'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearance,
  readStoredAppearance,
  writeStoredAppearance,
  type Appearance,
} from '@/lib/appearance';

const listeners = new Set<() => void>();
let current: Appearance | null = null;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): Appearance {
  current ??= readStoredAppearance();
  return current;
}

function getServerSnapshot(): Appearance {
  return DEFAULT_APPEARANCE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== APPEARANCE_STORAGE_KEY) return;
    current = readStoredAppearance();
    applyAppearance(current);
    emit();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function updateAppearance(patch: Partial<Appearance>): void {
  const previous = getSnapshot();
  const next: Appearance = { ...previous, ...patch };
  if (next.theme === previous.theme && next.scale === previous.scale && next.radius === previous.radius) {
    return;
  }
  current = next;
  applyAppearance(next);
  writeStoredAppearance(next);
  emit();
}

export function useAppearance(): {
  appearance: Appearance;
  update: (patch: Partial<Appearance>) => void;
} {
  const appearance = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    applyAppearance(getSnapshot());
  }, []);

  return { appearance, update: updateAppearance };
}
