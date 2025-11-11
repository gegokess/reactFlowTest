/**
 * useProject Hook
 * Zentrale State-Management für das Projekt
 * Basierend auf docs/06-StateManagement.md
 */

import { useState, useEffect, useCallback } from 'react';
import type { Project, WorkPackage, SubPackage, Milestone, Toast } from '../types';
import { today, minDate, maxDate, addDays } from '../utils/dateUtils';
import { validateProject, logValidationErrors, logValidationWarnings, getProjectWarnings } from '../utils/devChecks';

const STORAGE_KEY = 'projekt-zeitplan';

// Default-Projekt
function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Neues Projekt',
    description: 'Projekt-Beschreibung',
    settings: {
      clampUapInsideManualAp: false,
    },
    workPackages: [],
    milestones: [],
  };
}

export function useProject() {
  const [project, setProject] = useState<Project>(() => {
    // Lade Projekt aus localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Project;
        // Validiere geladenes Projekt
        const errors = validateProject(parsed);
        if (errors.length > 0) {
          logValidationErrors('Loaded Project', errors);
          return createDefaultProject();
        }
        return parsed;
      }
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
    }
    return createDefaultProject();
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Speichere Projekt in localStorage bei jeder Änderung
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));

      // Validiere und logge Warnungen im Development-Mode
      if (import.meta.env.DEV) {
        const warnings = getProjectWarnings(project);
        logValidationWarnings('Project Update', warnings);
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Projekts:', error);
      showToast('error', 'Fehler beim Speichern des Projekts');
    }
  }, [project]);

  // Toast-Management
  const showToast = useCallback((type: Toast['type'], message: string, duration = 3000) => {
    const newToast: Toast = {
      id: crypto.randomUUID(),
      type,
      message,
      duration,
    };
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Projekt-Operationen
  const updateProjectName = useCallback((name: string) => {
    setProject(prev => ({ ...prev, name }));
  }, []);

  const updateProjectSettings = useCallback((settings: Partial<Project['settings']>) => {
    setProject(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const updateProjectDates = useCallback((start?: string, end?: string) => {
    setProject(prev => ({ ...prev, start, end }));
    showToast('success', 'Projekt-Zeitraum aktualisiert');
  }, [showToast]);

  // Auto-Rollup: Berechnet AP-Daten aus UAPs
  const rollupWorkPackageDates = useCallback((apId: string) => {
    setProject(prev => {
      const wpIndex = prev.workPackages.findIndex(wp => wp.id === apId);
      if (wpIndex === -1) return prev;

      const wp = prev.workPackages[wpIndex];

      // Wenn keine SubPackages vorhanden, ändere nichts
      if (wp.subPackages.length === 0) {
        return prev;
      }

      // Berechne min/max Daten
      const starts = wp.subPackages.map(sp => sp.start);
      const ends = wp.subPackages.map(sp => sp.end);
      const newStart = minDate(...starts);
      const newEnd = maxDate(...ends);

      // Erstelle neues WorkPackage mit auto mode
      const updatedWp: WorkPackage = {
        ...wp,
        start: newStart,
        end: newEnd,
        mode: 'auto',
      };

      const newWorkPackages = [...prev.workPackages];
      newWorkPackages[wpIndex] = updatedWp;

      return {
        ...prev,
        workPackages: newWorkPackages,
      };
    });
  }, []);

  // WorkPackage CRUD
  const addWorkPackage = useCallback(() => {
    const todayDate = today();
    const nextWeek = addDays(todayDate, 7);

    const newWp: WorkPackage = {
      id: crypto.randomUUID(),
      title: 'Neues Arbeitspaket',
      start: todayDate,
      end: nextWeek,
      mode: 'manual',
      subPackages: [],
    };

    setProject(prev => ({
      ...prev,
      workPackages: [...prev.workPackages, newWp],
    }));

    showToast('success', 'Arbeitspaket hinzugefügt');
  }, [showToast]);

  const updateWorkPackage = useCallback((id: string, updates: Partial<WorkPackage>) => {
    setProject(prev => {
      const index = prev.workPackages.findIndex(wp => wp.id === id);
      if (index === -1) return prev;

      const updatedWp = { ...prev.workPackages[index], ...updates };
      const newWorkPackages = [...prev.workPackages];
      newWorkPackages[index] = updatedWp;

      return {
        ...prev,
        workPackages: newWorkPackages,
      };
    });
  }, []);

  const deleteWorkPackage = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      workPackages: prev.workPackages.filter(wp => wp.id !== id),
    }));
    showToast('success', 'Arbeitspaket gelöscht');
  }, [showToast]);

  // SubPackage CRUD
  const addSubPackage = useCallback((apId: string) => {
    const todayDate = today();
    const nextWeek = addDays(todayDate, 7);

    const newSp: SubPackage = {
      id: crypto.randomUUID(),
      title: 'Neues Unterarbeitspaket',
      start: todayDate,
      end: nextWeek,
    };

    setProject(prev => {
      const wpIndex = prev.workPackages.findIndex(wp => wp.id === apId);
      if (wpIndex === -1) return prev;

      const wp = prev.workPackages[wpIndex];
      const updatedWp: WorkPackage = {
        ...wp,
        subPackages: [...wp.subPackages, newSp],
      };

      const newWorkPackages = [...prev.workPackages];
      newWorkPackages[wpIndex] = updatedWp;

      return {
        ...prev,
        workPackages: newWorkPackages,
      };
    });

    // Trigger auto-rollup
    setTimeout(() => rollupWorkPackageDates(apId), 0);

    showToast('success', 'Unterarbeitspaket hinzugefügt');
  }, [showToast, rollupWorkPackageDates]);

  const updateSubPackage = useCallback((apId: string, uapId: string, updates: Partial<SubPackage>) => {
    setProject(prev => {
      const wpIndex = prev.workPackages.findIndex(wp => wp.id === apId);
      if (wpIndex === -1) return prev;

      const wp = prev.workPackages[wpIndex];
      const spIndex = wp.subPackages.findIndex(sp => sp.id === uapId);
      if (spIndex === -1) return prev;

      const updatedSp = { ...wp.subPackages[spIndex], ...updates };
      const newSubPackages = [...wp.subPackages];
      newSubPackages[spIndex] = updatedSp;

      const updatedWp: WorkPackage = {
        ...wp,
        subPackages: newSubPackages,
      };

      const newWorkPackages = [...prev.workPackages];
      newWorkPackages[wpIndex] = updatedWp;

      return {
        ...prev,
        workPackages: newWorkPackages,
      };
    });

    // Trigger auto-rollup
    setTimeout(() => rollupWorkPackageDates(apId), 0);
  }, [rollupWorkPackageDates]);

  const deleteSubPackage = useCallback((apId: string, uapId: string) => {
    setProject(prev => {
      const wpIndex = prev.workPackages.findIndex(wp => wp.id === apId);
      if (wpIndex === -1) return prev;

      const wp = prev.workPackages[wpIndex];
      const updatedWp: WorkPackage = {
        ...wp,
        subPackages: wp.subPackages.filter(sp => sp.id !== uapId),
      };

      const newWorkPackages = [...prev.workPackages];
      newWorkPackages[wpIndex] = updatedWp;

      return {
        ...prev,
        workPackages: newWorkPackages,
      };
    });

    // Trigger auto-rollup
    setTimeout(() => rollupWorkPackageDates(apId), 0);

    showToast('success', 'Unterarbeitspaket gelöscht');
  }, [showToast, rollupWorkPackageDates]);

  // Milestone CRUD
  const addMilestone = useCallback(() => {
    const newMs: Milestone = {
      id: crypto.randomUUID(),
      title: 'Neuer Meilenstein',
      date: today(),
    };

    setProject(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMs],
    }));

    showToast('success', 'Meilenstein hinzugefügt');
  }, [showToast]);

  const updateMilestone = useCallback((id: string, updates: Partial<Milestone>) => {
    setProject(prev => {
      const index = prev.milestones.findIndex(ms => ms.id === id);
      if (index === -1) return prev;

      const updatedMs = { ...prev.milestones[index], ...updates };
      const newMilestones = [...prev.milestones];
      newMilestones[index] = updatedMs;

      return {
        ...prev,
        milestones: newMilestones,
      };
    });
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      milestones: prev.milestones.filter(ms => ms.id !== id),
    }));
    showToast('success', 'Meilenstein gelöscht');
  }, [showToast]);

  // Export/Import
  const exportToJSON = useCallback((): string => {
    return JSON.stringify(project, null, 2);
  }, [project]);

  const exportToFile = useCallback(() => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '-')}_${today()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Projekt als JSON exportiert');
  }, [exportToJSON, project.name, showToast]);

  const copyToClipboard = useCallback(async () => {
    try {
      const json = exportToJSON();
      await navigator.clipboard.writeText(json);
      showToast('success', 'JSON in Zwischenablage kopiert');
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
      showToast('error', 'Fehler beim Kopieren in Zwischenablage');
    }
  }, [exportToJSON, showToast]);

  const importFromJSON = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as Project;

      // Validiere importiertes Projekt
      const errors = validateProject(parsed);
      if (errors.length > 0) {
        logValidationErrors('Imported Project', errors);
        showToast('error', 'Importiertes Projekt ist ungültig');
        return;
      }

      setProject(parsed);
      showToast('success', 'Projekt erfolgreich importiert');
    } catch (error) {
      console.error('Fehler beim Importieren:', error);
      showToast('error', 'Fehler beim Importieren des Projekts');
    }
  }, [showToast]);

  const resetProject = useCallback(() => {
    setProject(createDefaultProject());
    showToast('info', 'Projekt zurückgesetzt');
  }, [showToast]);

  return {
    project,
    toasts,

    // Toast
    showToast,
    removeToast,

    // Projekt
    updateProjectName,
    updateProjectSettings,
    updateProjectDates,

    // WorkPackage
    addWorkPackage,
    updateWorkPackage,
    deleteWorkPackage,

    // SubPackage
    addSubPackage,
    updateSubPackage,
    deleteSubPackage,

    // Milestone
    addMilestone,
    updateMilestone,
    deleteMilestone,

    // Export/Import
    exportToJSON,
    exportToFile,
    copyToClipboard,
    importFromJSON,
    resetProject,
  };
}
