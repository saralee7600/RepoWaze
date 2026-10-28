const numberFormatter = new Intl.NumberFormat('en-US');

// UTC keeps server-rendered and client-rendered output identical (no hydration mismatch).
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Formats an ISO-8601 string as e.g. "Oct 28, 2026"; returns the input if unparseable. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/** Strips the protocol and trailing slash: "https://github.com/a/b/" -> "github.com/a/b". */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}
