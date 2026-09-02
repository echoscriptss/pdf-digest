import { LayoutDashboard, Settings, ClipboardList, UserPlus, Users } from "lucide-react";

import type { NavItem } from "@/lib/erp-config";

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Users", icon: Users },
  { label: "Create User", icon: UserPlus },
  { label: "Reports", icon: ClipboardList, soon: true },
  { label: "Settings", icon: Settings, soon: true },
];
