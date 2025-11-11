/**
 * Date Utility Functions
 * Alle Datumsfunktionen arbeiten mit ISO-Format (YYYY-MM-DD)
 */

/**
 * Konvertiert ein Date-Objekt in ISO-Format (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Konvertiert einen ISO-Datums-String in ein Date-Objekt
 */
export function fromISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Berechnet die Anzahl der Tage zwischen zwei ISO-Datums-Strings
 */
export function daysBetween(start: string, end: string): number {
  const startDate = fromISODate(start);
  const endDate = fromISODate(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Addiert eine bestimmte Anzahl von Tagen zu einem ISO-Datum
 */
export function addDays(isoDate: string, days: number): string {
  const date = fromISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/**
 * Gibt das heutige Datum im ISO-Format zurück
 */
export function today(): string {
  return toISODate(new Date());
}

/**
 * Validiert, ob ein String ein gültiges ISO-Datum ist
 */
export function isValidISODate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const date = fromISODate(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validiert, ob start <= end
 */
export function isValidDateRange(start: string, end: string): boolean {
  return daysBetween(start, end) >= 0;
}

/**
 * Gibt das Minimum von mehreren ISO-Datums-Strings zurück
 */
export function minDate(...dates: string[]): string {
  if (dates.length === 0) return today();
  return dates.reduce((min, current) =>
    daysBetween(current, min) > 0 ? current : min
  );
}

/**
 * Gibt das Maximum von mehreren ISO-Datums-Strings zurück
 */
export function maxDate(...dates: string[]): string {
  if (dates.length === 0) return today();
  return dates.reduce((max, current) =>
    daysBetween(max, current) > 0 ? current : max
  );
}

/**
 * Formatiert ein ISO-Datum für die Anzeige
 * @param format - 'short' (DD.MM.YY), 'medium' (DD.MM.YYYY), 'long' (D. Mon YYYY)
 */
export function formatDate(isoDate: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = fromISODate(isoDate);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const monthNames = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
  ];

  switch (format) {
    case 'short':
      return `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${String(year).slice(-2)}`;
    case 'long':
      return `${day}. ${monthNames[month]} ${year}`;
    case 'medium':
    default:
      return `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
  }
}

/**
 * Gibt den Wochen-String für ein Datum zurück (z.B. "KW 42")
 */
export function getWeekNumber(isoDate: string): string {
  const date = fromISODate(isoDate);
  const onejan = new Date(date.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `KW ${weekNum}`;
}

/**
 * Gibt den Monats-Namen für ein Datum zurück
 */
export function getMonthName(isoDate: string): string {
  const date = fromISODate(isoDate);
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return monthNames[date.getMonth()];
}

/**
 * Gibt den Quartals-String für ein Datum zurück (z.B. "Q1 2024")
 */
export function getQuarterString(isoDate: string): string {
  const date = fromISODate(isoDate);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

/**
 * Clampt ein Datum zwischen min und max
 */
export function clampDate(isoDate: string, min: string, max: string): string {
  if (daysBetween(isoDate, min) < 0) return min;
  if (daysBetween(max, isoDate) < 0) return max;
  return isoDate;
}

/**
 * Berechnet einen Datums-Bereich basierend auf einem Start-Datum und der Anzahl sichtbarer Tage
 */
export function getViewportDates(centerDate: string, viewDays: number): { start: string; end: string } {
  const halfDays = Math.floor(viewDays / 2);
  const start = addDays(centerDate, -halfDays);
  const end = addDays(start, viewDays);
  return { start, end };
}
