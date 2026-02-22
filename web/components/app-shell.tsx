"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { SidebarProvider } from "./ui/sidebar";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();

  const isPublicPage =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/invite");

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">Loading...</div>
    );
  }

  if (isPublicPage) {
    return <main>{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="app-shell w-full">
        <Sidebar />

        <div className="main-area flex-1">
          <Topbar />
          <main>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
