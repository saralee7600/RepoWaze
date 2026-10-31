export const APPEARANCE_OPTIONS = {
  theme: ['dark', 'light'],
  scale: ['sm', 'md', 'lg'],
  radius: ['sm', 'md', 'lg'],
} as const;

export type AppearanceKey = keyof typeof APPEARANCE_OPTIONS;
export type Theme = (typeof APPEARANCE_OPTIONS.theme)[number];
export type Scale = (typeof APPEARANCE_OPTIONS.scale)[number];
export type Radius = (typeof APPEARANCE_OPTIONS.radius)[number];

export interface Appearance {
  theme: Theme;
  scale: Scale;
  radius: Radius;
}

export const DEFAULT_APPEARANCE: Appearance = { theme: 'dark', scale: 'md', radius: 'md' };

export const APPEARANCE_STORAGE_KEY = 'ast-inspector:appearance';

const APPEARANCE_KEYS = Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[];

function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.find((option) => option === value) ?? fallback;
}

export function parseAppearance(raw: string | null): Appearance {
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed === 'object' && parsed !== null) data = { ...parsed };
  } catch {
  }
  return {
    theme: pick(APPEARANCE_OPTIONS.theme, data.theme, DEFAULT_APPEARANCE.theme),
    scale: pick(APPEARANCE_OPTIONS.scale, data.scale, DEFAULT_APPEARANCE.scale),
    radius: pick(APPEARANCE_OPTIONS.radius, data.radius, DEFAULT_APPEARANCE.radius),
  };
}

export function readStoredAppearance(): Appearance {
  try {
    return parseAppearance(window.localStorage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function writeStoredAppearance(appearance: Appearance): void {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
  }
}

export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  for (const key of APPEARANCE_KEYS) {
    root.setAttribute(`data-${key}`, appearance[key]);
  }
}

export const APPEARANCE_INIT_SCRIPT =
  `(function(){try{var o=${JSON.stringify(APPEARANCE_OPTIONS)},` +
  `s=JSON.parse(localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)})||"{}"),` +
  `r=document.documentElement;` +
  `for(var k in o){if(o[k].indexOf(s[k])>-1)r.setAttribute("data-"+k,s[k])}}catch(e){}})()`;
