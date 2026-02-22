"use client";

import { Users, Upload } from "lucide-react";
import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import type { Manager } from "@/types";
import { useI18n } from "../../dictionaries/i18n";
import { parseCSV } from "@/lib/csv";

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchManagers = () => {
    setLoading(true);
    api.managers
      .list()
      .then(setManagers)
      .catch(() => setManagers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      let data: any[] = [];
      if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        data = parseCSV(text);
      } else {
        alert("Unsupported format. Please upload .json or .csv");
        return;
      }

      if (data.length === 0) {
        alert("No data found to import");
        return;
      }

      const res = await api.managers.batch(data);
      alert(`Successfully imported ${res.inserted} managers.`);
      fetchManagers();
    } catch (err) {
      console.error(err);
      alert("Failed to import managers");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const maxLoad = Math.max(...managers.map((m) => m.currentLoad ?? 0), 1);

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Users size={20} />
            {t.sidebar.managers}
          </h1>
          <p className="page-subtitle">{t.managers.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="file"
            accept=".csv,.json"
            ref={fileInputRef}
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Upload size={16} />
            {importing ? "Импорт..." : "Импорт"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.dashboard.tableManager}</th>
                <th>Должность</th>
                <th>{t.dashboard.tableOffice}</th>
                <th>{t.managers.skills}</th>
                <th style={{ minWidth: 160 }}>{t.managers.load}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Skeletons do not reorder
                  <tr key={i} style={{ cursor: "default" }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: Skeletons do not reorder
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ height: 16, width: "75%" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : managers.length === 0 ? (
                <tr style={{ cursor: "default" }}>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    Нет данных
                  </td>
                </tr>
              ) : (
                managers.map((m) => {
                  const pct = Math.round(
                    ((m.currentLoad ?? 0) / maxLoad) * 100,
                  );
                  const cls = pct >= 80 ? "danger" : pct >= 60 ? "warn" : "";
                  return (
                    <tr key={m.id} style={{ cursor: "default" }}>
                      <td style={{ fontWeight: 600, fontSize: 14 }}>
                        {m.name}
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "hsl(var(--secondary-foreground))",
                        }}
                      >
                        {m.position ?? "—"}
                      </td>
                      <td style={{ fontSize: 13 }}>{m.office ?? "—"}</td>
                      <td>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
                        >
                          {(m.skills ?? []).map((s) => (
                            <span key={s} className="skill-tag">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div className="workload-bar-bg" style={{ flex: 1 }}>
                            <div
                              className={`workload-bar-fill ${cls}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color:
                                cls === "danger"
                                  ? "var(--danger)"
                                  : "hsl(var(--secondary-foreground))",
                              minWidth: 28,
                              textAlign: "right",
                            }}
                          >
                            {m.currentLoad ?? 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
