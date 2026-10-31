'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, Menu } from 'lucide-react';
import { buttonStyles } from '@/components/ui/buttonStyles';
import { DisplayOptionsMenu } from './DisplayOptionsMenu';
import { NAV_ITEMS, isNavItemActive, type NavItem } from './nav-items';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  menuOpen: boolean;
  onMenuClick: () => void;
}

function Heading({ current }: { current: NavItem | undefined }) {
  return (
    <>
      <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
        {current?.label ?? 'AST Inspector'}
      </h1>
      {current && (
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {current.description}
        </p>
      )}
    </>
  );
}

function ImportLink() {
  return (
    <Link href="/import" className={buttonStyles({ size: 'sm' })}>
      <Download className="size-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">Import Project</span>
      <span className="sm:hidden">Import</span>
    </Link>
  );
}

/** Nav item matching the current route. Needs the pathname, which isn't known while prerendering dynamic routes. */
function useCurrentNavItem(): NavItem | undefined {
  const pathname = usePathname();
  return NAV_ITEMS.find((item) => isNavItemActive(item, pathname));
}

function RouteHeading() {
  return <Heading current={useCurrentNavItem()} />;
}

function RouteImportLink() {
  return useCurrentNavItem()?.href === '/import' ? null : <ImportLink />;
}

export function Header({ menuOpen, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
        className="-ms-1 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <Suspense fallback={<Heading current={undefined} />}>
          <RouteHeading />
        </Suspense>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <DisplayOptionsMenu />
      </div>

      <Suspense fallback={<ImportLink />}>
        <RouteImportLink />
      </Suspense>

      <UserMenu />
    </header>
  );
}
