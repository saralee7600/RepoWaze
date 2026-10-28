'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Network, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiStatusIndicator } from './ApiStatusIndicator';
import { NAV_ITEMS, isNavItemActive } from './nav-items';

interface SidebarProps {
  /** Mobile drawer state; ignored on `lg` and up where the sidebar is static. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="app-sidebar"
        aria-label="Primary"
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-64 shrink-0 flex-col border-e border-border bg-slate-950',
          'transition-transform duration-200 ease-out',
          'lg:static lg:translate-x-0 lg:rtl:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Network className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              AST Inspector
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    active ? 'text-primary' : 'group-hover:text-foreground',
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          <ApiStatusIndicator />
        </div>
      </aside>
    </>
  );
}
