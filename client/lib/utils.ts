type ClassValue = string | false | null | undefined;

/** Joins truthy class names (minimal `clsx` replacement; no extra dependency). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
