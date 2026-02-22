"use client";

import {
  BarChart3,
  Building2,
  DownloadCloud,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Dictionary, useI18n } from "../dictionaries/i18n";
import { useAuth } from "../lib/auth-context";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const getNavKeys = (t: Dictionary) => [
  { href: "/dashboard", icon: LayoutDashboard, label: t.sidebar.dashboard },
  {
    href: "/tickets",
    icon: Inbox,
    label: t.sidebar.incomingQueue,
    badge: null,
  },
  { href: "/managers", icon: Users, label: t.sidebar.managers },
  { href: "/stats", icon: BarChart3, label: t.sidebar.analytics },
  { href: "/star-task", icon: Sparkles, label: t.sidebar.starTask },
];

export function Sidebar() {
  const path = usePathname();
  const { t } = useI18n();
  const { user } = useAuth();
  const NAV = getNavKeys(t);

  return (
    <ShadcnSidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GitBranch className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">FIRE</span>
                  <span className="">Routing Engine v1.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, icon: Icon, label, badge }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={path.startsWith(href)}>
                    <Link href={href}>
                      <Icon className="size-4" />
                      <span>{label as string}</span>
                    </Link>
                  </SidebarMenuButton>
                  {badge && (
                    <SidebarMenuBadge>{badge as string}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={path.startsWith("/dashboard/import")}
                  >
                    <Link href="/dashboard/import">
                      <DownloadCloud className="size-4" />
                      <span>{t.sidebar.importData as string}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={path.startsWith("/dashboard/team")}
                  >
                    <Link href="/dashboard/team">
                      <UserPlus className="size-4" />
                      <span>{t.sidebar.manageTeam as string}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={path.startsWith("/dashboard/business-units")}
                  >
                    <Link href="/dashboard/business-units">
                      <Building2 className="size-4" />
                      <span>{t.sidebar.businessUnits as string}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </ShadcnSidebar>
  );
}
