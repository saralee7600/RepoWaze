import { Download, LayoutDashboard, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Extra route prefixes that keep this item highlighted (e.g. its detail pages). */
  alsoActiveFor?: readonly string[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    description: 'Overview of all analyzed projects',
    icon: LayoutDashboard,
    alsoActiveFor: ['/projects'],
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
  const matches = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  if (item.alsoActiveFor?.some(matches)) return true;
  return item.href === '/' ? pathname === '/' : matches(item.href);
}
