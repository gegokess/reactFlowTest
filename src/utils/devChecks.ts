/**
 * Development Checks & Validation
 * Funktionen zur Laufzeit-Validierung und Fehlerprüfung
 */

import type { WorkPackage, SubPackage, Milestone, Project } from '../types';
import { isValidISODate, isValidDateRange } from './dateUtils';

/**
 * Validiert ein SubPackage-Objekt
 */
export function validateSubPackage(subPackage: SubPackage): string[] {
  const errors: string[] = [];

  if (!subPackage.id) {
    errors.push('SubPackage ID ist erforderlich');
  }

  if (!subPackage.title || subPackage.title.trim() === '') {
    errors.push('SubPackage Titel ist erforderlich');
  }

  if (!isValidISODate(subPackage.start)) {
    errors.push(`SubPackage Start-Datum ist ungültig: ${subPackage.start}`);
  }

  if (!isValidISODate(subPackage.end)) {
    errors.push(`SubPackage End-Datum ist ungültig: ${subPackage.end}`);
  }

  if (isValidISODate(subPackage.start) && isValidISODate(subPackage.end)) {
    if (!isValidDateRange(subPackage.start, subPackage.end)) {
      errors.push(`SubPackage Start-Datum (${subPackage.start}) muss vor End-Datum (${subPackage.end}) liegen`);
    }
  }

  return errors;
}

/**
 * Validiert ein WorkPackage-Objekt
 */
export function validateWorkPackage(workPackage: WorkPackage): string[] {
  const errors: string[] = [];

  if (!workPackage.id) {
    errors.push('WorkPackage ID ist erforderlich');
  }

  if (!workPackage.title || workPackage.title.trim() === '') {
    errors.push('WorkPackage Titel ist erforderlich');
  }

  if (!isValidISODate(workPackage.start)) {
    errors.push(`WorkPackage Start-Datum ist ungültig: ${workPackage.start}`);
  }

  if (!isValidISODate(workPackage.end)) {
    errors.push(`WorkPackage End-Datum ist ungültig: ${workPackage.end}`);
  }

  if (isValidISODate(workPackage.start) && isValidISODate(workPackage.end)) {
    if (!isValidDateRange(workPackage.start, workPackage.end)) {
      errors.push(`WorkPackage Start-Datum (${workPackage.start}) muss vor End-Datum (${workPackage.end}) liegen`);
    }
  }

  if (!['auto', 'manual'].includes(workPackage.mode)) {
    errors.push(`WorkPackage Mode ist ungültig: ${workPackage.mode}`);
  }

  // Validiere alle SubPackages
  workPackage.subPackages.forEach((sp, index) => {
    const spErrors = validateSubPackage(sp);
    spErrors.forEach(err => errors.push(`SubPackage [${index}]: ${err}`));
  });

  return errors;
}

/**
 * Validiert ein Milestone-Objekt
 */
export function validateMilestone(milestone: Milestone): string[] {
  const errors: string[] = [];

  if (!milestone.id) {
    errors.push('Milestone ID ist erforderlich');
  }

  if (!milestone.title || milestone.title.trim() === '') {
    errors.push('Milestone Titel ist erforderlich');
  }

  if (!isValidISODate(milestone.date)) {
    errors.push(`Milestone Datum ist ungültig: ${milestone.date}`);
  }

  return errors;
}

/**
 * Validiert ein komplettes Project-Objekt
 */
export function validateProject(project: Project): string[] {
  const errors: string[] = [];

  if (!project.id) {
    errors.push('Project ID ist erforderlich');
  }

  if (!project.name || project.name.trim() === '') {
    errors.push('Project Name ist erforderlich');
  }

  if (!project.settings) {
    errors.push('Project Settings sind erforderlich');
  }

  // Validiere alle WorkPackages
  project.workPackages.forEach((wp, index) => {
    const wpErrors = validateWorkPackage(wp);
    wpErrors.forEach(err => errors.push(`WorkPackage [${index}]: ${err}`));
  });

  // Validiere alle Milestones
  project.milestones.forEach((ms, index) => {
    const msErrors = validateMilestone(ms);
    msErrors.forEach(err => errors.push(`Milestone [${index}]: ${err}`));
  });

  return errors;
}

/**
 * Gibt Warnungen für ein Projekt aus (z.B. für Best Practices)
 */
export function getProjectWarnings(project: Project): string[] {
  const warnings: string[] = [];

  // Warnung bei sehr vielen WorkPackages
  if (project.workPackages.length > 50) {
    warnings.push(`Projekt hat ${project.workPackages.length} WorkPackages - Performance könnte beeinträchtigt sein`);
  }

  // Warnung bei sehr vielen SubPackages
  const totalSubPackages = project.workPackages.reduce((sum, wp) => sum + wp.subPackages.length, 0);
  if (totalSubPackages > 200) {
    warnings.push(`Projekt hat ${totalSubPackages} SubPackages - Performance könnte beeinträchtigt sein`);
  }

  // Warnung bei WorkPackages ohne SubPackages im Auto-Modus
  project.workPackages.forEach((wp) => {
    if (wp.mode === 'auto' && wp.subPackages.length === 0) {
      warnings.push(`WorkPackage "${wp.title}" ist im Auto-Modus, hat aber keine SubPackages`);
    }
  });

  return warnings;
}

/**
 * Logs validation errors to console (nur im Development-Mode)
 */
export function logValidationErrors(context: string, errors: string[]): void {
  if (import.meta.env.DEV && errors.length > 0) {
    console.error(`[Validation Error] ${context}:`, errors);
  }
}

/**
 * Logs validation warnings to console (nur im Development-Mode)
 */
export function logValidationWarnings(context: string, warnings: string[]): void {
  if (import.meta.env.DEV && warnings.length > 0) {
    console.warn(`[Validation Warning] ${context}:`, warnings);
  }
}
