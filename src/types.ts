/**
 * Type Definitions für Projekt Zeitplan
 * Basierend auf der Dokumentation in docs/02-DataModel.md
 */

// Unterarbeitspaket (UAP)
export interface SubPackage {
  id: string;
  title: string;
  start: string; // ISO format: YYYY-MM-DD
  end: string; // ISO format: YYYY-MM-DD
}

// Arbeitspaket (AP)
export interface WorkPackage {
  id: string;
  title: string;
  start: string; // ISO format: YYYY-MM-DD
  end: string; // ISO format: YYYY-MM-DD
  mode: 'auto' | 'manual'; // auto = rollup from UAPs, manual = user-defined
  subPackages: SubPackage[];
}

// Meilenstein
export interface Milestone {
  id: string;
  title: string;
  date: string; // ISO format: YYYY-MM-DD
}

// Projekt-Einstellungen
export interface ProjectSettings {
  clampUapInsideManualAp: boolean; // Constraint UAPs within AP boundaries (manual mode only)
}

// Projekt
export interface Project {
  id: string;
  name: string;
  description?: string;
  start?: string; // ISO format: YYYY-MM-DD - Optional project start date
  end?: string; // ISO format: YYYY-MM-DD - Optional project end date
  settings: ProjectSettings;
  workPackages: WorkPackage[];
  milestones: Milestone[];
}

// Toast-Benachrichtigungen
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default: 3000
}

// Zoom-Levels für Timeline
export type ZoomLevel = 'week' | 'month' | 'quarter' | 'year';

export interface ZoomConfig {
  tickDays: number; // Days between tick marks
  viewDays: number; // Number of days visible in viewport
  format: 'day' | 'week' | 'month' | 'quarter'; // How to format time axis labels
}

// Timeline-Konfiguration
export const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  week: { tickDays: 1, viewDays: 14, format: 'day' },
  month: { tickDays: 7, viewDays: 90, format: 'week' },
  quarter: { tickDays: 30, viewDays: 180, format: 'month' },
  year: { tickDays: 90, viewDays: 365, format: 'quarter' },
};

// Timeline-Layout-Konstanten
export const TIMELINE_CONSTANTS = {
  BASE_ROW_HEIGHT: 70,
  SUBBAR_HEIGHT: 28,
  UAP_SPACING: 16, // Erhöht von 10 auf 16 für besseren vertikalen Abstand
  ROW_PADDING: 35,
  HEADER_HEIGHT: 90,
  PADDING_LEFT: 40,
  PADDING_RIGHT: 40,
  PADDING_TOP: 20,
  PADDING_BOTTOM: 20,
  // AP Label und Padding
  AP_LABEL_HEIGHT: 24,
  AP_LABEL_SPACING: 12, // Erhöht von 8 auf 12 für mehr Luft zwischen Label und Container
  AP_PADDING_HORIZONTAL: 16,
  AP_PADDING_VERTICAL: 8,
  // Milestone
  MILESTONE_BOTTOM_OFFSET: 60, // Abstand vom unteren Rand für Meilenstein-Marker
} as const;
