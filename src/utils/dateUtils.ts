// Date utilities for ISO date handling

/**
 * Clamps an ISO date string to valid format.
 * Returns a valid ISO date (YYYY-MM-DD) even if input is invalid.
 */
export function clampIso(date: string): string {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    // Invalid date, return today
    return new Date().toISOString().split('T')[0];
  }
  return date;
}

/**
 * Converts a date to ISO string (YYYY-MM-DD)
 */
export function toIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parses an ISO date string to Date object
 */
export function parseIso(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

/**
 * Adds days to an ISO date string
 */
export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

/**
 * Calculates days between two ISO dates
 */
export function daysBetween(start: string, end: string): number {
  const startDate = parseIso(start);
  const endDate = parseIso(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Gets the minimum date from an array of dates
 */
export function minDate(dates: string[]): string {
  if (dates.length === 0) return toIso(new Date());
  return dates.reduce((min, curr) => curr < min ? curr : min);
}

/**
 * Gets the maximum date from an array of dates
 */
export function maxDate(dates: string[]): string {
  if (dates.length === 0) return toIso(new Date());
  return dates.reduce((max, curr) => curr > max ? curr : max);
}

/**
 * Snaps a date to whole days (already in ISO format, so just validate)
 */
export function snapToDay(iso: string): string {
  return clampIso(iso);
}

/**
 * Formats a date for display (e.g., "15. Jan 2024")
 */
export function formatDate(iso: string, locale = 'de-DE'): string {
  const date = parseIso(iso);
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats a date range for display
 */
export function formatDateRange(start: string, end: string, locale = 'de-DE'): string {
  return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
}
