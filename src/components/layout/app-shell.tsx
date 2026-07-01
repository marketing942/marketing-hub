"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./nav-config";
import { signOut } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/user";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  coordinator: "Coordenador",
  paid_traffic: "Tráfego Pago",
  social_media: "Social Media",
  viewer: "Visualizador",
};

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-border bg-bg-elevated transition-transform lg:static lg:translate-x-0 lg:flex",
          open ? "flex translate-x-0" : "hidden -translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green/15 text-green-neon">
            <Activity className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-text">CPPEM</p>
            <p className="text-[11px] text-text-muted">Marketing Hub</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted/70">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-green/12 text-green-neon"
                            : "text-text-muted hover:bg-card-alt hover:text-text",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green/15 text-xs font-semibold text-green-neon">
              {(user.fullName ?? user.email ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text">
                {user.fullName ?? user.email}
              </p>
              <p className="text-[10px] text-text-muted">
                {ROLE_LABEL[user.role] ?? user.role}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                title="Sair"
                className="rounded-md p-1.5 text-text-muted hover:bg-card-alt hover:text-critical"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-bg-elevated/60 px-4 backdrop-blur lg:px-6">
          <button
            className="rounded-lg p-2 text-text-muted hover:bg-card-alt lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium text-text">
              CPPEM Marketing Hub
            </h1>
            <p className="text-[11px] text-text-muted">
              Performance em tempo real
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
