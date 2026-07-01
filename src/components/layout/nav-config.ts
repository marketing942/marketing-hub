import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Layers,
  Building2,
  PencilLine,
  Bell,
  Camera,
  RefreshCw,
  Plug,
  Target,
  Users,
  Tv,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operação",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/overview", label: "Visão Geral", icon: Layers },
      { href: "/tv", label: "Modo TV", icon: Tv },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/builder", label: "Dashboard Builder", icon: PencilLine },
      { href: "/companies", label: "Empresas", icon: Building2 },
      { href: "/manual-inputs", label: "Dados Manuais", icon: PencilLine },
      { href: "/alerts", label: "Alertas", icon: Bell },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/snapshots", label: "Snapshots", icon: Camera },
      { href: "/sync-status", label: "Sincronização", icon: RefreshCw },
      { href: "/settings/integrations", label: "Integrações", icon: Plug },
      { href: "/settings/goals", label: "Metas", icon: Target },
      { href: "/settings/users", label: "Usuários", icon: Users },
    ],
  },
];
