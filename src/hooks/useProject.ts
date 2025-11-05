// React hook for project state management with localStorage persistence

import { useState, useEffect } from 'react';
import { Project, WorkPackage, SubPackage, Milestone, Toast } from '../types';
import { minDate, maxDate, toIso } from '../utils/dateUtils';

const STORAGE_KEY = 'projekt-zeitplan-data';

/**
 * Creates a default empty project
 */
function createDefaultProject(): Project {
  const today = toIso(new Date());
  const nextMonth = toIso(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  return {
    id: crypto.randomUUID(),
    name: 'Neues Projekt',
    description: '',
    settings: {
      clampUapInsideManualAp: true
    },
    workPackages: [
      {
        id: crypto.randomUUID(),
        title: 'Arbeitspaket 1',
        start: today,
        end: nextMonth,
        mode: 'manual',
        subPackages: []
      }
    ],
    milestones: [
      {
        id: crypto.randomUUID(),
        title: 'Meilenstein 1',
        date: today
      }
    ]
  };
}

/**
 * Rollup AP dates from UAPs (auto mode)
 */
export function rollupAp(ap: WorkPackage): WorkPackage {
  if (ap.subPackages.length === 0) {
    return ap; // No rollup needed
  }

  const starts = ap.subPackages.map(sp => sp.start);
  const ends = ap.subPackages.map(sp => sp.end);

  return {
    ...ap,
    start: minDate(starts),
    end: maxDate(ends)
  };
}

/**
 * Main project hook with localStorage persistence
 */
export function useProject() {
  const [project, setProject] = useState<Project>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored project', e);
      }
    }
    return createDefaultProject();
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  // Toast management
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const toast: Toast = {
      id: crypto.randomUUID(),
      message,
      type
    };
    setToasts(prev => [...prev, toast]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Project operations
  const updateProject = (updates: Partial<Project>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const addWorkPackage = () => {
    const today = toIso(new Date());
    const nextMonth = toIso(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const newAp: WorkPackage = {
      id: crypto.randomUUID(),
      title: `Arbeitspaket ${project.workPackages.length + 1}`,
      start: today,
      end: nextMonth,
      mode: 'manual',
      subPackages: []
    };

    setProject(prev => ({
      ...prev,
      workPackages: [...prev.workPackages, newAp]
    }));

    addToast('Arbeitspaket hinzugefügt', 'success');
  };

  const updateWorkPackage = (id: string, updates: Partial<WorkPackage>) => {
    setProject(prev => ({
      ...prev,
      workPackages: prev.workPackages.map(wp => {
        if (wp.id !== id) return wp;

        const updated = { ...wp, ...updates };

        // Apply rollup if in auto mode or has subpackages
        if (updated.mode === 'auto' || updated.subPackages.length > 0) {
          return rollupAp(updated);
        }

        return updated;
      })
    }));
  };

  const deleteWorkPackage = (id: string) => {
    setProject(prev => ({
      ...prev,
      workPackages: prev.workPackages.filter(wp => wp.id !== id)
    }));
    addToast('Arbeitspaket gelöscht', 'success');
  };

  const addSubPackage = (apId: string) => {
    const ap = project.workPackages.find(wp => wp.id === apId);
    if (!ap) return;

    const newUap: SubPackage = {
      id: crypto.randomUUID(),
      title: `UAP ${ap.subPackages.length + 1}`,
      start: ap.start,
      end: ap.end
    };

    updateWorkPackage(apId, {
      mode: 'auto', // Switch to auto mode when adding UAPs
      subPackages: [...ap.subPackages, newUap]
    });

    addToast('Unterarbeitspaket hinzugefügt', 'success');
  };

  const updateSubPackage = (apId: string, uapId: string, updates: Partial<SubPackage>) => {
    const ap = project.workPackages.find(wp => wp.id === apId);
    if (!ap) return;

    const updatedSubPackages = ap.subPackages.map(sp =>
      sp.id === uapId ? { ...sp, ...updates } : sp
    );

    updateWorkPackage(apId, { subPackages: updatedSubPackages });
  };

  const deleteSubPackage = (apId: string, uapId: string) => {
    const ap = project.workPackages.find(wp => wp.id === apId);
    if (!ap) return;

    const updatedSubPackages = ap.subPackages.filter(sp => sp.id !== uapId);

    updateWorkPackage(apId, {
      subPackages: updatedSubPackages,
      // Switch to manual if no more UAPs
      mode: updatedSubPackages.length === 0 ? 'manual' : 'auto'
    });

    addToast('Unterarbeitspaket gelöscht', 'success');
  };

  const addMilestone = () => {
    const today = toIso(new Date());

    const newMs: Milestone = {
      id: crypto.randomUUID(),
      title: `Meilenstein ${project.milestones.length + 1}`,
      date: today
    };

    setProject(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMs]
    }));

    addToast('Meilenstein hinzugefügt', 'success');
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setProject(prev => ({
      ...prev,
      milestones: prev.milestones.map(ms =>
        ms.id === id ? { ...ms, ...updates } : ms
      )
    }));
  };

  const deleteMilestone = (id: string) => {
    setProject(prev => ({
      ...prev,
      milestones: prev.milestones.filter(ms => ms.id !== id)
    }));
    addToast('Meilenstein gelöscht', 'success');
  };

  const exportToJson = (): string => {
    return JSON.stringify(project, null, 2);
  };

  const importFromJson = (json: string) => {
    try {
      const imported = JSON.parse(json);
      setProject(imported);
      addToast('Projekt importiert', 'success');
    } catch (e) {
      addToast('Import fehlgeschlagen: Ungültiges JSON', 'error');
    }
  };

  return {
    project,
    updateProject,
    addWorkPackage,
    updateWorkPackage,
    deleteWorkPackage,
    addSubPackage,
    updateSubPackage,
    deleteSubPackage,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    exportToJson,
    importFromJson,
    toasts,
    addToast,
    removeToast
  };
}
