import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  Contact,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Target,
  UserCircle,
  Users,
} from "lucide-react";

export type Designation = "manager" | "crm" | "team_lead" | "agent";
export type Role = Designation | "admin";

export const DESIGNATION_META: Record<
  Role,
  { label: string; tier: string; blurb: string }
> = {
  admin: { label: "Administrator", tier: "System", blurb: "Full system control" },
  manager: { label: "Manager", tier: "Tier 1", blurb: "Highest responsibility" },
  crm: { label: "CRM", tier: "Tier 2", blurb: "Customer & lead ownership" },
  team_lead: { label: "Team Lead", tier: "Tier 3", blurb: "Mid-level team ownership" },
  agent: { label: "Agent", tier: "Tier 4", blurb: "Operational execution" },
};

export const DESIGNATION_OPTIONS: Designation[] = ["manager", "crm", "team_lead", "agent"];

export type NavItem = { label: string; icon: typeof Gauge; soon?: boolean };

export const ROLE_NAV: Record<Designation, NavItem[]> = {
  manager: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Team", icon: Users, soon: true },
    { label: "CRM", icon: Contact, soon: true },
    { label: "Reports", icon: ClipboardList, soon: true },
    { label: "Analytics", icon: BarChart3, soon: true },
  ],
  crm: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Customers", icon: Contact, soon: true },
    { label: "Leads", icon: Target, soon: true },
    { label: "Follow-ups", icon: CalendarClock, soon: true },
    { label: "Reports", icon: ClipboardList, soon: true },
  ],
  team_lead: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "My Team", icon: Users, soon: true },
    { label: "Leads", icon: Target, soon: true },
    { label: "Tasks", icon: ListChecks, soon: true },
    { label: "Reports", icon: ClipboardList, soon: true },
  ],
  agent: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Leads", icon: Target },
    { label: "Add Lead", icon: ListChecks },
    { label: "Follow-ups", icon: CalendarClock, soon: true },
    { label: "Profile", icon: UserCircle, soon: true },
  ],
};


export const ROLE_PANELS: Record<Designation, { title: string; cards: string[] }> = {
  manager: { title: "Manager Dashboard", cards: ["Team Performance", "Teams / Agents"] },
  crm: { title: "CRM Dashboard", cards: ["Lead Overview", "Customer Overview"] },
  team_lead: { title: "Team Lead Dashboard", cards: ["Team Performance", "Agent Performance"] },
  agent: { title: "Agent Dashboard", cards: ["Today's Tasks", "Assigned Leads", "Follow-ups"] },
};
