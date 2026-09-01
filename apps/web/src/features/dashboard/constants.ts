import { LayoutDashboard, type LucideIcon } from 'lucide-react';

export const DASHBOARD_ROUTES = {
  home: '/dashboard',
  profile: '/dashboard/profile',
} as const;

export interface DashboardNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: 'Home',
    href: DASHBOARD_ROUTES.home,
    icon: LayoutDashboard,
  },
];

export interface DashboardPlaceholderStat {
  title: string;
  description: string;
}

export const DASHBOARD_PLACEHOLDER_STATS: DashboardPlaceholderStat[] = [
  {
    title: 'Organizations',
    description: 'Manage your teams and workspaces.',
  },
  {
    title: 'Invitations',
    description: 'Track pending member invitations.',
  },
  {
    title: 'Activity',
    description: 'See recent updates across your account.',
  },
];
