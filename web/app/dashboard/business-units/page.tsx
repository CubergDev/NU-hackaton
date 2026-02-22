"use client";

import { Building2, MapPin, Pencil, Plus, List, Map as MapIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import type { BusinessUnit } from "@/types";
import { parseCSV } from "@/lib/csv";

const InteractiveMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

export default function BusinessUnitsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.businessUnits
      .list()
      .then(setUnits)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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

      const res = await api.businessUnits.batch(data);
      alert(`Successfully imported ${res.inserted} business units.`);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to import business units");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот офис? Тикеты потеряют привязку.")) return;
    try {
      await api.businessUnits.delete(id);
      load();
    } catch {
      alert("Ошибка удаления");
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    router.push(`/dashboard/business-units/new?lat=${lat}&lon=${lng}`);
  };

  const mapMarkers = units
    .filter((bu) => bu.latitude != null && bu.longitude != null)
    .map((bu) => ({
      id: bu.id,
      position: [bu.latitude!, bu.longitude!] as [number, number],
      title: `${bu.office} — ${bu.address}`,
      onClick: () => router.push(`/dashboard/business-units/${bu.id}`),
    }));

  return (
    <div className="page">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Building2 size={22} /> Управление офисами
          </h1>
          <p className="page-subtitle">Филиалы и отделения компании</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* View Toggle */}
          <div style={{ 
            display: "flex", 
            background: "var(--bg-card)", 
            padding: 4, 
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)"
          }}>
            <button
              onClick={() => setViewMode("map")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: "var(--radius-sm)",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: viewMode === "map" ? "var(--bg-active)" : "transparent",
                color: viewMode === "map" ? "var(--primary)" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              <MapIcon size={14} /> Карта
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: "var(--radius-sm)",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: viewMode === "list" ? "var(--bg-active)" : "transparent",
                color: viewMode === "list" ? "var(--primary)" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              <List size={14} /> Список
            </button>
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
            type="button" 
            className="btn btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Upload size={14} />
            {importing ? "Импорт..." : "Импорт"}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => router.push("/dashboard/business-units/new")}>
            <Plus size={14} /> Добавить
          </button>
        </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="skeleton"
              style={{ height: 72, borderRadius: 8 }}
            />
          ))}
        </div>
      ) : units.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "40px 0" }}
        >
          <p style={{ color: "var(--text-muted)" }}>
            Нет офисов. Добавьте первый!
          </p>
        </div>
      ) : viewMode === "map" ? (
        <div className="card" style={{ height: "calc(100vh - 200px)", minHeight: 400, padding: 0, overflow: "hidden" }}>
          <InteractiveMap 
            markers={mapMarkers}
            onMapClick={handleMapClick}
            zoom={5}
            // Dynamic bounds based on available markers
            bounds={mapMarkers.length > 0 ? mapMarkers.map(m => m.position) : undefined}
          />
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table
              className="data-table"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>
                    Офис
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>
                    Адрес
                  </th>
                  <th style={{ textAlign: "center", padding: "10px 12px" }}>
                    Координаты
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 12px" }}>
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {units.map((bu) => (
                  <tr
                    key={bu.id}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "12px", fontWeight: 600 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MapPin size={14} style={{ color: "var(--primary)" }} />
                        {bu.office}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        color: "var(--text-secondary)",
                        fontSize: 13,
                      }}
                    >
                      {bu.address || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {bu.latitude != null && bu.longitude != null
                        ? `${bu.latitude.toFixed(4)}, ${bu.longitude.toFixed(4)}`
                        : "—"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => router.push(`/dashboard/business-units/${bu.id}`)}
                          title="Редактировать"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(bu.id)}
                          title="Удалить"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
