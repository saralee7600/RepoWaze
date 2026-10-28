import { Download, LayoutDashboard, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    description: 'Overview of all analyzed projects',
    icon: LayoutDashboard,
  },
  {
    href: '/import',
    label: 'Import Project',
    description: 'Analyze a GitHub repository',
    icon: Download,
  },
];

/** Exact match for the root route, prefix match for everything else. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.href === '/'
    ? pathname === '/'
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
