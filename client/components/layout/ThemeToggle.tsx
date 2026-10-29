'use client';

import { Moon, Sun } from 'lucide-react';
import { buttonStyles } from '@/components/ui/buttonStyles';
import { useAppearance } from '@/hooks/useAppearance';

/** One-click dark/light switch; updates `html[data-theme]` instantly. */
export function ThemeToggle() {
  const { appearance, update } = useAppearance();
  const next = appearance.theme === 'dark' ? 'light' : 'dark';
  const Icon = appearance.theme === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => update({ theme: next })}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={buttonStyles({ variant: 'outline', size: 'icon' })}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
