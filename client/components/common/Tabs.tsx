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
  value: string;
  label: string;
  content: ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface TabsProps {
  items: readonly TabItem[];
  defaultValue?: string;
  urlParam?: string;
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
  const value = isSelectable(items, requested) ? requested : fallback;

  const handleChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(window.location.search);
      if (next === fallback) params.delete(urlParam);
      else params.set(urlParam, next);

      const query = params.toString();
      window.history.replaceState(null, '', query === '' ? pathname : `${pathname}?${query}`);
    },
    [fallback, pathname, urlParam],
  );

  return <TabsView items={items} value={value} onValueChange={handleChange} {...rest} />;
}

export function Tabs({ urlParam, ...props }: TabsProps) {
  return urlParam ? <UrlSyncedTabs urlParam={urlParam} {...props} /> : <LocalTabs {...props} />;
}
