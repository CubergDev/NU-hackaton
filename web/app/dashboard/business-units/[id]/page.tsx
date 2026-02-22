"use client";

import { Building2, MapPin, Search, ArrowLeft, Save, Loader2, Map as MapIcon, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const InteractiveMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

type FormData = {
  office: string;
  address: string;
};

type Suggestion = {
  displayName: string;
  latitude: number;
  longitude: number;
};

export default function BusinessUnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [form, setForm] = useState<FormData>({ office: "", address: "" });
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  // Address autocomplete
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load existing unit
  const loadUnit = useCallback(async () => {
    if (isNew) return;
    try {
      const unit = await api.businessUnits.get(Number(id));
      setForm({ office: unit.office, address: unit.address || "" });
      if (unit.latitude && unit.longitude) {
        setCoords([unit.latitude, unit.longitude]);
      }
    } catch (err) {
      alert("Не удалось загрузить данные офиса");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, isNew, router]);

  useEffect(() => {
    loadUnit();
  }, [loadUnit]);

  // Initial coordinates from URL (when clicking empty map space)
  useEffect(() => {
    if (isNew) {
      const lat = searchParams.get('lat');
      const lon = searchParams.get('lon');
      if (lat && lon) {
        setCoords([parseFloat(lat), parseFloat(lon)]);
        // Auto reverse geocode
        api.businessUnits.reverseGeocode(parseFloat(lat), parseFloat(lon)).then(res => {
          if (res.address) {
            setForm(prev => ({ ...prev, address: res.address }));
          }
        });
      }
    }
  }, [isNew, searchParams]);

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    setCoords([lat, lng]);
    setSugLoading(true);
    try {
      const res = await api.businessUnits.reverseGeocode(lat, lng);
      if (res.address) {
        setForm(prev => ({ ...prev, address: res.address }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    } finally {
      setSugLoading(false);
    }
  };

  // Handle address input and suggestions
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true);
      try {
        const results = await api.businessUnits.suggestions(q, form.office || undefined);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSugLoading(false);
      }
    }, 400);
  }, [form.office]);

  const handleAddressChange = (value: string) => {
    setForm(prev => ({ ...prev, address: value }));
    fetchSuggestions(value);
  };

  const selectSuggestion = (s: Suggestion) => {
    setForm(prev => ({ ...prev, address: s.displayName }));
    setCoords([s.latitude, s.longitude]);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.office.trim()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        office: form.office,
        address: form.address || undefined,
      };

      if (isNew) {
        await api.businessUnits.create(payload);
      } else {
        await api.businessUnits.update(Number(id), payload);
      }
      router.push('/dashboard/business-units');
    } catch (err) {
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить этот офис? Тикеты потеряют привязку.")) return;
    try {
      setSaving(true);
      await api.businessUnits.delete(Number(id));
      router.push('/dashboard/business-units');
    } catch {
      alert("Ошибка удаления");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Loader2 className="spin" size={32} style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  const markers = coords ? [{
    id: 'current',
    position: coords,
    title: form.address || form.office || "Выбранная точка"
  }] : [];

  return (
    <div className="page" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
        <button 
          onClick={() => router.back()} 
          type="button"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            border: "1px solid var(--border)", background: "var(--bg-card)",
            cursor: "pointer", color: "var(--text-secondary)", transition: "all 0.2s",
            marginTop: 2
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "clamp(18px, 4vw, 24px)", lineHeight: 1.2, marginBottom: 6 }}>
            <Building2 size={20} style={{ flexShrink: 0 }} /> 
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isNew ? "Добавление офиса" : "Редактирование офиса"}
            </span>
          </h1>
          <p className="page-subtitle" style={{ fontSize: "13px", lineHeight: 1.4, opacity: 0.8 }}>
            {isNew ? "Заполните данные или выберите точку на карте" : form.office}
          </p>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: "grid", gap: 24, alignItems: "start" }}>
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24 }}>
          <div className="input-wrap">
            <label htmlFor="office-city" className="input-label" style={{ textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 12, fontWeight: 600 }}>
              Город / Название *
            </label>
            <input
              id="office-city"
              className="input"
              type="text"
              required
              value={form.office}
              onChange={(e) => setForm({ ...form, office: e.target.value })}
              placeholder="Алматы, БЦ Нурлы Тау"
            />
          </div>

          <div ref={suggestionsRef} style={{ position: "relative" }}>
            <label htmlFor="office-address" className="input-label" style={{ textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 12, fontWeight: 600 }}>
              Адрес
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="office-address"
                className="input"
                type="text"
                value={form.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Проспект Абая, 150"
                style={{ paddingRight: 32 }}
              />
              <Search
                size={14}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: sugLoading ? "var(--primary)" : "var(--text-muted)",
                  animation: sugLoading ? "spin 1s linear infinite" : "none",
                }}
              />
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)",
                maxHeight: 240, overflowY: "auto", marginTop: 4,
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.latitude}-${s.longitude}-${i}`}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 8, width: "100%",
                      padding: "10px 14px", background: "transparent", border: "none",
                      borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                      color: "var(--text-primary)", fontSize: 13, textAlign: "left", cursor: "pointer", lineHeight: 1.5,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <MapPin size={14} style={{ marginTop: 3, flexShrink: 0, color: "var(--primary)" }} />
                    <span style={{ color: "var(--text-secondary)" }}>{s.displayName}</span>
                  </button>
                ))}
              </div>
            )}
            
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.4, display: "flex", gap: 6 }}>
              <MapIcon size={12} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Введите адрес чтобы найти его на карте, либо кликните на карте чтобы определить адрес автоматически.
              </span>
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !form.office.trim()}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />} 
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="btn btn-danger"
                style={{ padding: "8px 12px" }}
                title="Удалить офис"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Map Column */}
        <div className="card map-container" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          {sugLoading && (
            <div style={{
              position: "absolute", top: 12, right: 12, zIndex: 10,
              background: "var(--bg-card)", padding: "6px 12px", borderRadius: "100px",
              boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500
            }}>
              <Loader2 className="spin" size={14} style={{ color: "var(--primary)" }} />
              Геокодирование...
            </div>
          )}
          
          <InteractiveMap 
            center={coords || undefined} 
            zoom={coords ? 15 : 5}
            markers={markers}
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}
