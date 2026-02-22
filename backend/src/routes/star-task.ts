import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { readOnlyDb } from "../db";
import { config } from "../lib/config";
import { prompts } from "../lib/prompts";

const MUTATING_SQL_REGEX =
  /(DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|GRANT|CREATE|REPLACE|EXECUTE|CALL|COPY)\s+/i;

export const starTaskRoutes = new Elysia({ prefix: "/star-task" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key-change-me",
    }),
  )
  .use(cookie())
  .derive(async ({ jwt, cookie: { auth_token } }) => {
    if (!auth_token?.value) return { user: null };
    const payload = await jwt.verify(auth_token.value as string);
    return { user: payload };
  })
  .post(
    "/chat",
    async ({ body, set, user }) => {
      if (!user) {
        set.status = 401;
        return { type: "error", text: "Unauthorized" };
      }
      const companyId = user.companyId as number;
      const role = (user as any).role;
      const userId = (user as any).id;

      let managerId = 0;
      if (role === "MANAGER") {
        const { getManagerId } = await import("../lib/user");
        managerId = (await getManagerId(userId)) || 0;
      }

      const { messages } = body;
      if (!messages || messages.length === 0) {
        set.status = 400;
        return { message: "History is empty" };
      }

      const lastMessage = messages[messages.length - 1].content;

      // We send the whole conversation to the LLM
      const ollamaMessages = [
        {
          role: "system",
          content: prompts.star_task.system
            .replace("{companyId}", companyId.toString())
            .replace("{managerId}", managerId.toString()),
        },
        ...messages,
      ];

      let aiDecision: any = null;

      // 1. Initial LLM call to decide strategy (Text or SQL)
      try {
        const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.llm.apiKey}`,
          },
          body: JSON.stringify({
            model: config.llm.model,
            messages: ollamaMessages,
            response_format: { type: "json_object" },
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(20000),
        });
        const data = (await res.json()) as any;
        if (!res.ok) throw new Error(data.error?.message || "LLM error");
        aiDecision = JSON.parse(data.choices[0].message.content);
      } catch (e: any) {
        console.error(e);
        set.status = 503;
        return {
          type: "error",
          text: `LLM недоступен или вернул ошибку: ${e.message}`,
        };
      }

      // 2. Handle simple text response
      if (aiDecision.type === "text") {
        return {
          type: "text",
          text: aiDecision.text,
        };
      }

      // 3. Handle SQL Generation Request
      if (aiDecision.type === "sql") {
        let sqlQuery = (aiDecision.sql || "").trim().replace(/```sql|```/g, "");
        let lastError = "";

        // 3 attempts to auto-recover from SQL errors
        for (let attempt = 0; attempt < 3; attempt++) {
          // Strict Validation
          if (!sqlQuery.toUpperCase().startsWith("SELECT")) {
            set.status = 400;
            return {
              type: "error",
              text: "Запрещенная операция. Допускается только SELECT.",
            };
          }
          if (MUTATING_SQL_REGEX.test(sqlQuery)) {
            set.status = 400;
            return {
              type: "error",
              text: "Обнаружена потенциальная SQL инъекция.",
            };
          }

          // Cleanup common LLM hallucinations
          sqlQuery = sqlQuery
            .replace(/\{companyId\}/g, companyId.toString())
            .replace(/\{managerId\}/g, managerId.toString());

          // Find table alias for tickets or assignments if it exists
          const ticketsAliasMatch = sqlQuery.match(/tickets\s+(\w+)/i);
          const tAlias = ticketsAliasMatch ? ticketsAliasMatch[1] : "tickets";
          
          const assignmentsAliasMatch = sqlQuery.match(/assignments\s+(\w+)/i);
          const aAlias = assignmentsAliasMatch ? assignmentsAliasMatch[1] : "assignments";

          // Force company filter check
          if (!sqlQuery.toLowerCase().includes("company_id")) {
             if (sqlQuery.toLowerCase().includes("where")) {
                sqlQuery = sqlQuery.replace(/where/i, `WHERE ${tAlias}.company_id = ${companyId} AND `);
             } else {
                sqlQuery += ` WHERE ${tAlias}.company_id = ${companyId}`;
             }
          }

          // Force manager filter if role is MANAGER
          if (managerId > 0 && !sqlQuery.includes(`manager_id = ${managerId}`)) {
            if (
              sqlQuery.toLowerCase().includes("from tickets") ||
              sqlQuery.toLowerCase().includes("from ticket_analysis")
            ) {
              const fromTable = sqlQuery.toLowerCase().includes("from tickets") ? "tickets" : "ticket_analysis";
              const tableAliasMatch = sqlQuery.match(new RegExp(`${fromTable}\\s+(\\w+)`, "i"));
              const alias = tableAliasMatch ? tableAliasMatch[1] : fromTable;

              if (!sqlQuery.toLowerCase().includes("join assignments")) {
                sqlQuery = sqlQuery.replace(
                  new RegExp(`from ${fromTable}(\\s+\\w+)?`, "i"),
                  `FROM ${fromTable}$1 JOIN assignments a ON ${alias}.id = a.ticket_id`
                );
                // Injected alias for assignments is 'a'
                sqlQuery = sqlQuery.replace(/where/i, `WHERE a.manager_id = ${managerId} AND `);
              } else {
                // If assignments already joined, use its alias
                if (sqlQuery.toLowerCase().includes("where")) {
                  sqlQuery = sqlQuery.replace(/where/i, `WHERE ${aAlias}.manager_id = ${managerId} AND `);
                } else {
                  sqlQuery += ` WHERE ${aAlias}.manager_id = ${managerId}`;
                }
              }
            } else if (sqlQuery.toLowerCase().includes("from assignments")) {
              if (sqlQuery.toLowerCase().includes("where")) {
                sqlQuery = sqlQuery.replace(/where/i, `WHERE ${aAlias}.manager_id = ${managerId} AND `);
              } else {
                sqlQuery += ` WHERE ${aAlias}.manager_id = ${managerId}`;
              }
            }
          }

          // Try Execute
          try {
            const result = await readOnlyDb.execute(sql.raw(sqlQuery));
            const rows = result as unknown as Record<string, unknown>[];
            const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

            // LLM Analysis of the result
            let analyticalText = "Вот данные по вашему запросу:";
            if (rows.length > 0) {
              try {
                const analysisRes = await fetch(
                  `${config.llm.baseUrl}/chat/completions`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${config.llm.apiKey}`,
                    },
                    body: JSON.stringify({
                      model: config.llm.model,
                      messages: [
                        {
                          role: "system",
                          content: prompts.star_task.analytics,
                        },
                        {
                          role: "user",
                          content: `Вопрос пользователя: ${lastMessage}\nДанные (JSON, ограничены): ${JSON.stringify(rows).slice(0, 3000)}`,
                        },
                      ],
                      temperature: 0.3,
                    }),
                    signal: AbortSignal.timeout(15000),
                  },
                );
                const analysisData = (await analysisRes.json()) as any;
                if (
                  analysisRes.ok &&
                  analysisData.choices?.[0]?.message?.content
                ) {
                  analyticalText = analysisData.choices[0].message.content;
                }
              } catch (err) {
                console.error("Analytics LLM error:", err);
              }
            } else {
              analyticalText =
                "К сожалению, по вашему запросу данных не найдено.";
            }

            // Determine chart type from the question
            const q = lastMessage.toLowerCase();
            let chartType = "bar";
            if (
              q.includes("доля") ||
              q.includes("процент") ||
              q.includes("распределени")
            )
              chartType = "pie";
            if (
              q.includes("динамик") ||
              q.includes("по дням") ||
              q.includes("по месяц")
            )
              chartType = "line";

            return {
              type: "sql_result",
              text: analyticalText,
              data: {
                sql: sqlQuery,
                columns,
                rows: rows.map((r) => columns.map((c) => r[c])),
                chartType,
                chartTitle: aiDecision.chartTitle || lastMessage,
              },
            };
          } catch (e: unknown) {
            lastError = (e as Error).message || String(e);

            if (attempt < 2) {
              console.log(
                `[Star Task] JSON Auto-recovery try ${attempt + 1}: ${lastError}`,
              );
              // Feed the error back to Ollama to fix the SQL
              try {
                const fixRes = await fetch(
                  `${config.llm.baseUrl}/chat/completions`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${config.llm.apiKey}`,
                    },
                    body: JSON.stringify({
                      model: config.llm.model,
                      messages: [
                        { role: "system", content: prompts.star_task.system },
                        { role: "user", content: lastMessage },
                        {
                          role: "assistant",
                          content: JSON.stringify(aiDecision),
                        },
                        {
                          role: "user",
                          content: `Твой SQL вернул ошибку PostgreSQL:\n${lastError}\n\nИсправь ошибку и верни новый JSON с полем "sql".`,
                        },
                      ],
                      response_format: { type: "json_object" },
                      temperature: 0.1,
                    }),
                  },
                );
                const fixData = (await fixRes.json()) as any;
                if (!fixRes.ok)
                  throw new Error(fixData.error?.message || "LLM error");
                const fixedDecision = JSON.parse(
                  fixData.choices[0].message.content,
                );
                sqlQuery = fixedDecision.sql || "";
              } catch (err) {
                console.error(err);
                break; // If recovery fails, break out and return error
              }
            }
          }
        }

        set.status = 400;
        return {
          type: "error",
          text: `Не удалось составить корректный SQL запрос после 3 попыток.\nОшибка БД: ${lastError}`,
        };
      }

      set.status = 400;
      return { type: "error", text: "Неизвестный формат ответа от ИИ." };
    },
    {
      body: t.Object({
        messages: t.Array(
          t.Object({
            role: t.String(),
            content: t.String(),
          }),
        ),
      }),
    },
  );
