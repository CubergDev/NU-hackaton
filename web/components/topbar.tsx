"use client";

import { Bell, GitBranch, LogOut, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "../dictionaries/i18n";
import { useAuth } from "../lib/auth-context";
import { SidebarTrigger } from "./ui/sidebar";

export function Topbar() {
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      const isLight = window.matchMedia(
        "(prefers-color-scheme: light)",
      ).matches;
      setTheme(isLight ? "light" : "dark");
      document.documentElement.setAttribute(
        "data-theme",
        isLight ? "light" : "dark",
      );
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <header className="topbar">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div className="topbar-logo">
            <div className="topbar-logo-icon">
              <GitBranch size={14} />
            </div>
            <span>FIRE</span>
            <span className="topbar-demo">DEMO</span>
          </div>
        </Link>
      </div>

      <div className="topbar-search">
        <Search
          size={15}
          style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }}
        />
        <input type="search" placeholder="Search tickets..." />
      </div>

      <div className="topbar-right">
        {/* Language Switcher */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as "en" | "ru" | "kz")}
          style={{
            background: "transparent",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            padding: "2px 4px",
            fontSize: 12,
            color: "hsl(var(--secondary-foreground))",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="ru">RU</option>
          <option value="en">EN</option>
          <option value="kz">KZ</option>
        </select>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {user ? (
          <>
            <div
              className="topbar-avatar"
              style={{
                borderLeft: "1px solid hsl(var(--border))",
                paddingLeft: "8px",
              }}
            >
              <div
                className="topbar-avatar-circle"
                style={{
                  backgroundColor: user.role === "ADMIN" ? "#4f46e5" : "#333",
                }}
              >
                {(user.name || "U").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="topbar-user-name">
                  {user.name || "Пользователь"}
                </div>
                <div className="topbar-user-role capitalize">{user.role}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="ml-1 flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors shrink-0"
              title={t.auth.logOut as string}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-blue-500 hover:text-blue-400"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
