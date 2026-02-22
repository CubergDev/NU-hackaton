"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Inbox,
  Info,
  RefreshCw,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Manager, TicketRow } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LangBadge,
  PriorityBadge,
  SegmentBadge,
  SentimentBadge,
} from "../../components/badges";
import { useI18n } from "../../dictionaries/i18n";

const OFFICES = [
  "Все офисы",
  "Алматы",
  "Астана",
  "Шымкент",
  "Атырау",
  "Актобе",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Тараз",
  "Костанай",
  "Кызылорда",
  "Уральск",
  "Актау",
  "Петропавловск",
  "Кокшетау",
];
const SEGMENTS = ["Все", "Mass", "VIP", "Priority"];
const SENTIMENTS = ["Все", "Позитивный", "Нейтральный", "Негативный"];
const LANGUAGES = ["Все", "RU", "KZ", "ENG"];

type ProcessState = "idle" | "loading" | "success" | "error";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [processState, setProcessState] = useState<ProcessState>("idle");
  const [processMsg, setProcessMsg] = useState("");
  const [filters, setFilters] = useState({
    office: "",
    segment: "",
    sentiment: "",
    language: "",
  });
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: String(limit),
        offset: String(page * limit),
      };
      if (filters.office) params.office = filters.office;
      if (filters.segment) params.segment = filters.segment;
      if (filters.sentiment) params.sentiment = filters.sentiment;
      if (filters.language) params.language = filters.language;
      const [t, m] = await Promise.all([
        api.tickets.list(params),
        api.managers.list(),
      ]);
      setTickets(t);
      setManagers(m.slice(0, 8));
    } catch {
      /* backend not ready */
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleProcess() {
    setProcessState("loading");
    try {
      const r = await api.tickets.process();
      setProcessState("success");
      setProcessMsg(`Обработано ${r.count} тикетов`);
      await loadTickets();
    } catch {
      setProcessState("error");
      setProcessMsg("Ошибка обработки");
    }
    setTimeout(() => setProcessState("idle"), 4000);
  }

  const totalLoad = managers.reduce((s, m) => s + (m.currentLoad ?? 0), 0);

  return (
    <div className="page">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">AI-powered ticket routing overview</p>
        </div>
        <button
          type="button"
          className={`btn ${processState === "loading" ? "btn-secondary" : "btn-dark"}`}
          onClick={handleProcess}
          disabled={processState === "loading"}
        >
          {processState === "loading" ? (
            <>
              <RefreshCw
                size={15}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              {t.dashboard.processing}
            </>
          ) : processState === "success" ? (
            <>
              <CheckCircle size={15} /> {processMsg}
            </>
          ) : processState === "error" ? (
            <>
              <AlertTriangle size={15} /> {processMsg}
            </>
          ) : (
            <>
              <Zap size={15} /> {t.dashboard.processTickets}
            </>
          )}
        </button>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Новых тикетов"
          value={tickets.length.toString()}
          trend="+12% за вчера"
          trendDir="up"
          icon={<Inbox size={18} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
        <KpiCard
          label="Назначено"
          value={tickets.filter((t) => t.managerId).length.toString()}
          trend="+5% за неделю"
          trendDir="up"
          icon={<CheckCircle size={18} />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <KpiCard
          label="SLA риски"
          value={tickets
            .filter((t) => (t.priority ?? 0) >= 8)
            .length.toString()}
          trend="Требует внимания"
          trendDir="neutral"
          icon={<AlertTriangle size={18} />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <KpiCard
          label="Менеджеры"
          value={managers.length.toString()}
          trend={`${totalLoad} тик. в работе`}
          trendDir="neutral"
          icon={<Users size={18} />}
          iconBg="#EDE9FE"
          iconColor="#7C3AED"
        />
      </div>

      {/* Main split layout */}
      <div className="dash-split">
        {/* Left: Incoming Queue */}
        <div className="card">
          <div className="card-header">
            <h2
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Inbox size={16} />
              Incoming Queue
            </h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadTickets}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <FilterSelect
              label={t.dashboard.office}
              value={filters.office}
              options={OFFICES}
              onChange={(v) => {
                setFilters((f) => ({
                  ...f,
                  office: v === "Все офисы" ? "" : v,
                }));
                setPage(0);
              }}
            />
            <FilterSelect
              label={t.dashboard.segment}
              value={filters.segment || "Все"}
              options={SEGMENTS}
              onChange={(v) => {
                setFilters((f) => ({ ...f, segment: v === "Все" ? "" : v }));
                setPage(0);
              }}
            />
            <FilterSelect
              label={t.dashboard.sentiment}
              value={filters.sentiment || "Все"}
              options={SENTIMENTS}
              onChange={(v) => {
                setFilters((f) => ({ ...f, sentiment: v === "Все" ? "" : v }));
                setPage(0);
              }}
            />
            <FilterSelect
              label={t.dashboard.language}
              value={filters.language || "Все"}
              options={LANGUAGES}
              onChange={(v) => {
                setFilters((f) => ({ ...f, language: v === "Все" ? "" : v }));
                setPage(0);
              }}
            />
            {(filters.office ||
              filters.segment ||
              filters.sentiment ||
              filters.language) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-reset"
                onClick={() => {
                  setFilters({
                    office: "",
                    segment: "",
                    sentiment: "",
                    language: "",
                  });
                  setPage(0);
                }}
              >
                {t.dashboard.reset}
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.dashboard.tableClient}</th>
                  <th>{t.dashboard.tableSegment}</th>
                  <th className="col-hide-xs">{t.dashboard.tableType}</th>
                  <th>{t.dashboard.tablePriority}</th>
                  <th className="col-hide-sm">{t.dashboard.tableSentiment}</th>
                  <th className="col-hide-sm">{t.dashboard.tableLang}</th>
                  <th className="col-hide-xs">{t.dashboard.tableManager}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: order is stable for skeleton
                    <tr key={`skeleton-${i}`} style={{ cursor: "default" }}>
                      <td>
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "80%" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "60%" }}
                        />
                      </td>
                      <td className="col-hide-xs">
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "80%" }}
                        />
                      </td>
                      <td>
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "40%" }}
                        />
                      </td>
                      <td className="col-hide-sm">
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "70%" }}
                        />
                      </td>
                      <td className="col-hide-sm">
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "40%" }}
                        />
                      </td>
                      <td className="col-hide-xs">
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "70%" }}
                        />
                      </td>
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr style={{ cursor: "default" }}>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      {t.dashboard.pressProcess}
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/tickets/${t.id}`)}
                    >
                      <td
                        style={{
                          color: "var(--primary)",
                          fontWeight: 600,
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                      >
                        #{String(t.guid?.slice(0, 8) || t.id)}
                      </td>
                      <td>
                        <SegmentBadge segment={t.segment} />
                      </td>
                      <td
                        className="col-hide-xs"
                        style={{
                          fontSize: 13,
                          maxWidth: 140,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.ticketType ?? "—"}
                      </td>
                      <td>
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="col-hide-sm">
                        <SentimentBadge sentiment={t.sentimentVal} />
                      </td>
                      <td className="col-hide-sm">
                        <LangBadge lang={t.language} />
                      </td>
                      <td
                        className="col-hide-xs"
                        style={{
                          fontSize: 13,
                          color: "hsl(var(--secondary-foreground))",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.managerName ?? (
                          <span
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="pagination-info">
              {loading ? "..." : `Показано ${tickets.length} тикетов`}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ← {t.dashboard.prev}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={tickets.length < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              {t.dashboard.next} →
            </button>
          </div>
        </div>

        {/* Right: Manager Workload */}
        <div className="card" style={{ alignSelf: "flex-start" }}>
          <div className="card-header">
            <h2
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Users size={16} />
              Manager Workload
            </h2>
          </div>
          <div
            style={{
              padding: "12px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {managers.length === 0 ? (
              <p
                style={{
                  color: "hsl(var(--muted-foreground))",
                  fontSize: 13,
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                Нет данных
              </p>
            ) : (
              managers.map((m) => {
                const max = Math.max(
                  ...managers.map((x) => x.currentLoad ?? 0),
                  1,
                );
                const pct = Math.round(((m.currentLoad ?? 0) / max) * 100);
                const cls = pct >= 80 ? "danger" : pct >= 60 ? "warn" : "";
                return (
                  <div key={m.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 5,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {m.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "hsl(var(--muted-foreground))",
                          }}
                        >
                          {m.office} • {m.position}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color:
                            cls === "danger"
                              ? "var(--danger)"
                              : "hsl(var(--secondary-foreground))",
                        }}
                      >
                        {m.currentLoad ?? 0} тик.
                      </span>
                    </div>
                    <div className="workload-bar-bg">
                      <div
                        className={`workload-bar-fill ${cls}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Routing Decisions */}
      {tickets.filter((t) => t.assignmentId).length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h2
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Clock size={16} />
              Recent Routing Decisions
            </h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Тикет</th>
                  <th>Тип</th>
                  <th>Менеджер</th>
                  <th>Офис</th>
                  <th>Назначен</th>
                </tr>
              </thead>
              <tbody>
                {tickets
                  .filter((t) => t.assignmentId)
                  .slice(0, 10)
                  .map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        style={{ cursor: "pointer" }}
                      >
                        <td
                          style={{
                            color: "var(--primary)",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          #{t.guid?.slice(0, 12) || t.id}
                        </td>
                        <td style={{ fontSize: 13 }}>{t.ticketType ?? "—"}</td>
                        <td style={{ fontSize: 13, fontWeight: 500 }}>
                          {t.managerName ?? "—"}
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "hsl(var(--secondary-foreground))",
                          }}
                        >
                          {t.managerOffice ?? "—"}
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "hsl(var(--muted-foreground))",
                          }}
                        >
                          {t.assignedAt
                            ? new Date(t.assignedAt).toLocaleTimeString("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                      </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Routing Decision Modal */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      >
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} className="text-primary" />
              История маршрутизации
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  padding: "12px 16px",
                  background: "hsl(var(--muted) / 0.5)",
                  borderRadius: 12,
                  marginBottom: 20,
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginBottom: 4 }}>
                  Тикет #{selectedTicket.guid?.slice(0, 12)} • {selectedTicket.ticketType}
                </div>
                <div style={{ fontWeight: 600 }}>
                  Назначен: {selectedTicket.managerName}
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  let parsed: any = null;
                  try {
                    parsed = JSON.parse(selectedTicket.assignmentReason || "{}");
                  } catch {
                    parsed = { steps: [selectedTicket.assignmentReason] };
                  }

                  if (parsed && Array.isArray(parsed.steps)) {
                    return parsed.steps.map((step: string, idx: number) => {
                      const isLast = idx === parsed.steps.length - 1;
                      return (
                        // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
                        <div key={idx} style={{ display: "flex", gap: 14, position: "relative" }}>
                          {!isLast && (
                            <div
                              style={{
                                position: "absolute",
                                left: 7,
                                top: 20,
                                bottom: 0,
                                width: 2,
                                background: "hsl(var(--primary) / 0.15)",
                              }}
                            />
                          )}
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: isLast ? "var(--primary)" : "transparent",
                              border: `2px solid ${isLast ? "var(--primary)" : "hsl(var(--primary) / 0.5)"}`,
                              zIndex: 1,
                              marginTop: 4,
                            }}
                          />
                          <div
                            style={{
                                fontSize: 14,
                                color: isLast ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                                paddingBottom: 24,
                                lineHeight: 1.5,
                            }}
                          >
                            {step}
                          </div>
                        </div>
                      );
                    });
                  }
                  return (
                    <div className="text-muted-foreground text-sm italic">
                      Нет детальной истории (старый формат данных)
                    </div>
                  );
                })()}
              </div>

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push(`/tickets/${selectedTicket.id}`)}
                >
                  <Info size={14} /> Перейти к тикету
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  trend,
  trendDir,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  trend: string;
  trendDir: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="kpi-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <p className="kpi-label">{label}</p>
        <div
          className="kpi-icon-wrap"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <p className="kpi-value">{value}</p>
      <p className={`kpi-trend ${trendDir}`} style={{ margin: 0 }}>
        {trendDir === "up" ? "↑" : trendDir === "down" ? "↓" : ""} {trend}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="select-wrap">
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ height: 34, fontSize: 13, paddingRight: 28 }}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
