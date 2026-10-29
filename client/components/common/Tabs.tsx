'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Tabs as TabsRoot,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export interface TabItem {
  /** Stable identifier; also the value written to the URL when synced. */
  value: string;
  label: string;
  content: ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface TabsProps {
  items: readonly TabItem[];
  /** Initially active tab. Defaults to the first enabled item. */
  defaultValue?: string;
  /**
   * Name of the query parameter that mirrors the active tab (e.g. `"tab"` -> `?tab=entities`).
   * Omit it to keep the active tab in local state only. When used, render the
   * component inside a `<Suspense>` boundary (it reads `useSearchParams`).
   */
  urlParam?: string;
  /** Accessible name of the tab list. */
  label?: string;
  className?: string;
}

function resolveFallback(items: readonly TabItem[], defaultValue?: string): string {
  const preferred = items.find((item) => item.value === defaultValue && !item.disabled);
  return (preferred ?? items.find((item) => !item.disabled) ?? items[0])?.value ?? '';
}

function isSelectable(items: readonly TabItem[], value: string | null): value is string {
  return value !== null && items.some((item) => item.value === value && !item.disabled);
}

interface TabsViewProps extends Pick<TabsProps, 'items' | 'label' | 'className'> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Presentational tabs shared by the local and URL-synced variants. */
function TabsView({ items, value, onValueChange, label, className }: TabsViewProps) {
  return (
    <TabsRoot value={value} onValueChange={onValueChange} className={className}>
      <TabsList variant="line" aria-label={label} className="h-auto w-full justify-start overflow-x-auto border-b border-border pb-1">
        {items.map(({ value: itemValue, label: itemLabel, icon: Icon, disabled }) => (
          <TabsTrigger key={itemValue} value={itemValue} disabled={disabled} className="flex-none px-3 py-1.5">
            {Icon && <Icon aria-hidden="true" />}
            {itemLabel}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map(({ value: itemValue, content }) => (
        <TabsContent key={itemValue} value={itemValue} className="pt-4">
          {content}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}

function LocalTabs({ items, defaultValue, ...rest }: Omit<TabsProps, 'urlParam'>) {
  const [value, setValue] = useState(() => resolveFallback(items, defaultValue));
  return <TabsView items={items} value={value} onValueChange={setValue} {...rest} />;
}

function UrlSyncedTabs({ items, defaultValue, urlParam, ...rest }: TabsProps & { urlParam: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const fallback = resolveFallback(items, defaultValue);
  const requested = searchParams.get(urlParam);
  // An unknown or disabled `?tab=` value quietly falls back to the default tab.
  const value = isSelectable(items, requested) ? requested : fallback;

  const handleChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(window.location.search);
      if (next === fallback) params.delete(urlParam);
      else params.set(urlParam, next);

      const query = params.toString();
      // Native history API: Next.js syncs it with `useSearchParams` without a server round trip.
      window.history.replaceState(null, '', query === '' ? pathname : `${pathname}?${query}`);
    },
    [fallback, pathname, urlParam],
  );

  return <TabsView items={items} value={value} onValueChange={handleChange} {...rest} />;
}

/**
 * Reusable tabs driven by a plain config array. Pass `urlParam` to keep the
 * active tab in the URL so it survives reloads and can be shared as a link.
 */
export function Tabs({ urlParam, ...props }: TabsProps) {
  return urlParam ? <UrlSyncedTabs urlParam={urlParam} {...props} /> : <LocalTabs {...props} />;
}
