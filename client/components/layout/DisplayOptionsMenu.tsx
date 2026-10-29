'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { buttonStyles } from '@/components/ui/buttonStyles';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAppearance } from '@/hooks/useAppearance';

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
] as const;

const RADIUS_OPTIONS = [
  { value: 'sm', label: 'Sharp' },
  { value: 'md', label: 'Default' },
  { value: 'lg', label: 'Round' },
] as const;

/** Popover with UI scale and corner-radius controls (`data-scale`, `data-radius`). */
export function DisplayOptionsMenu() {
  const { appearance, update } = useAppearance();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const { target } = event;
      if (target instanceof Node && !containerRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Display options"
        aria-expanded={open}
        aria-controls={panelId}
        title="Display options"
        className={buttonStyles({ variant: 'outline', size: 'icon' })}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Display options"
          className="absolute end-0 top-full z-30 mt-2 w-64 space-y-4 rounded-lg border border-border bg-card p-4 shadow-lg"
        >
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">UI size</p>
            <SegmentedControl
              label="UI size"
              value={appearance.scale}
              options={SIZE_OPTIONS}
              onChange={(scale) => update({ scale })}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Corner radius</p>
            <SegmentedControl
              label="Corner radius"
              value={appearance.radius}
              options={RADIUS_OPTIONS}
              onChange={(radius) => update({ radius })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
