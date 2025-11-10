// Domänenmodell für Projekt Zeitplan

export type ZoomLevel = 'week' | 'month' | 'quarter' | 'year';

export interface SubPackage {
  id: string;
  title: string;
  start: string; // ISO date string YYYY-MM-DD
  end: string;   // ISO date string YYYY-MM-DD
  category?: string; // Optional category/subtitle
  color?: string; // Color for the left bar (hex or color name)
  assignedTo?: string[]; // Array of person names/initials
}

export interface WorkPackage {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  mode: 'auto' | 'manual'; // auto = rollup from UAPs, manual = editable
  subPackages: SubPackage[];
}

export interface Milestone {
  id: string;
  title: string;
  date: string; // ISO date string
}

export interface ProjectSettings {
  clampUapInsideManualAp: boolean; // Clamp UAPs inside AP when AP is manual
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  settings: ProjectSettings;
  workPackages: WorkPackage[];
  milestones: Milestone[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
