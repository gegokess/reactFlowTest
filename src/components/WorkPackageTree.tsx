/**
 * WorkPackageTree Component
 * Hierarchische Sidebar-Ansicht für WorkPackages und SubPackages
 * Basierend auf docs/03-Components.md
 */

import React, { useState } from 'react';
import type { WorkPackage, Milestone } from '../types';
import SubPackageCard from './SubPackageCard';
import MilestoneList from './MilestoneList';

interface WorkPackageTreeProps {
  workPackages: WorkPackage[];
  milestones: Milestone[];
  onUpdateWorkPackage: (id: string, updates: Partial<WorkPackage>) => void;
  onDeleteWorkPackage: (id: string) => void;
  onAddSubPackage: (wpId: string) => void;
  onUpdateSubPackage: (wpId: string, spId: string, updates: Partial<WorkPackage['subPackages'][0]>) => void;
  onDeleteSubPackage: (wpId: string, spId: string) => void;
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onDeleteMilestone: (id: string) => void;
}

const WorkPackageTree: React.FC<WorkPackageTreeProps> = ({
  workPackages,
  milestones,
  onUpdateWorkPackage,
  onDeleteWorkPackage,
  onAddSubPackage,
  onUpdateSubPackage,
  onDeleteSubPackage,
  onUpdateMilestone,
  onDeleteMilestone,
}) => {
  const [expandedWps, setExpandedWps] = useState<Set<string>>(
    new Set(workPackages.map(wp => wp.id))
  );

  const toggleExpanded = (id: string) => {
    setExpandedWps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="w-96 bg-surface border-r border-border overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* WorkPackages Section */}
        {workPackages.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Keine Arbeitspakete vorhanden</p>
            <p className="text-xs mt-1">Klicke auf "AP hinzufügen" um zu starten</p>
          </div>
        ) : (
          workPackages.map(wp => (
            <WorkPackageCard
              key={wp.id}
              workPackage={wp}
              isExpanded={expandedWps.has(wp.id)}
              onToggleExpanded={() => toggleExpanded(wp.id)}
              onUpdate={updates => onUpdateWorkPackage(wp.id, updates)}
              onDelete={() => onDeleteWorkPackage(wp.id)}
              onAddSubPackage={() => onAddSubPackage(wp.id)}
              onUpdateSubPackage={(spId, updates) => onUpdateSubPackage(wp.id, spId, updates)}
              onDeleteSubPackage={spId => onDeleteSubPackage(wp.id, spId)}
            />
          ))
        )}

        {/* Milestones Section */}
        {(workPackages.length > 0 || milestones.length > 0) && (
          <div className="border-t border-border pt-4">
            <MilestoneList
              milestones={milestones}
              onUpdate={onUpdateMilestone}
              onDelete={onDeleteMilestone}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface WorkPackageCardProps {
  workPackage: WorkPackage;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdate: (updates: Partial<WorkPackage>) => void;
  onDelete: () => void;
  onAddSubPackage: () => void;
  onUpdateSubPackage: (spId: string, updates: Partial<WorkPackage['subPackages'][0]>) => void;
  onDeleteSubPackage: (spId: string) => void;
}

const WorkPackageCard: React.FC<WorkPackageCardProps> = ({
  workPackage,
  isExpanded,
  onToggleExpanded,
  onUpdate,
  onDelete,
  onAddSubPackage,
  onUpdateSubPackage,
  onDeleteSubPackage,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(workPackage.title);

  const handleTitleSave = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== workPackage.title) {
      onUpdate({ title: trimmed });
    } else {
      setTitleValue(workPackage.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleValue(workPackage.title);
      setIsEditingTitle(false);
    }
  };

  const isAutoMode = workPackage.mode === 'auto';
  const hasSubPackages = workPackage.subPackages.length > 0;

  return (
    <div className="bg-white rounded-md shadow-sm border border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          {/* Expand/Collapse Button */}
          <button
            onClick={onToggleExpanded}
            className="p-1 hover:bg-surface rounded transition-colors"
            aria-label={isExpanded ? 'Einklappen' : 'Ausklappen'}
          >
            <svg
              className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="flex-1 text-sm font-medium text-text px-2 py-1 border border-info rounded focus:outline-none focus:ring-1 focus:ring-info"
            />
          ) : (
            <h3
              className="flex-1 text-sm font-medium text-text cursor-pointer hover:text-info transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Klicken zum Bearbeiten"
            >
              {workPackage.title}
            </h3>
          )}

          {/* Delete Button */}
          <button
            onClick={() => {
              if (confirm(`AP "${workPackage.title}" wirklich löschen?`)) {
                onDelete();
              }
            }}
            className="p-1 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
            aria-label="Löschen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-text-muted">Modus:</span>
          <div className="flex gap-1 bg-surface rounded p-0.5">
            <button
              onClick={() => onUpdate({ mode: 'auto' })}
              disabled={!hasSubPackages}
              className={`
                px-2 py-1 text-xs rounded transition-colors
                ${isAutoMode
                  ? 'bg-white text-info font-medium shadow-sm'
                  : 'text-text-muted hover:text-text'
                }
                ${!hasSubPackages ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={!hasSubPackages ? 'Benötigt UAPs' : 'Automatisch aus UAPs berechnet'}
            >
              Auto
            </button>
            <button
              onClick={() => onUpdate({ mode: 'manual' })}
              className={`
                px-2 py-1 text-xs rounded transition-colors
                ${!isAutoMode
                  ? 'bg-white text-info font-medium shadow-sm'
                  : 'text-text-muted hover:text-text'
                }
              `}
              title="Manuelle Datumsangabe"
            >
              Manuell
            </button>
          </div>
        </div>

        {/* Date Inputs (nur im Manual-Modus) */}
        {!isAutoMode && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-muted block mb-1">Start</label>
              <input
                type="date"
                value={workPackage.start}
                onChange={e => onUpdate({ start: e.target.value })}
                className="w-full text-xs px-2 py-1 border border-border rounded focus:outline-none focus:ring-1 focus:ring-info"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Ende</label>
              <input
                type="date"
                value={workPackage.end}
                onChange={e => onUpdate({ end: e.target.value })}
                className="w-full text-xs px-2 py-1 border border-border rounded focus:outline-none focus:ring-1 focus:ring-info"
              />
            </div>
          </div>
        )}

        {/* Auto-Mode Info */}
        {isAutoMode && (
          <div className="text-xs text-text-muted flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Daten werden aus UAPs berechnet
          </div>
        )}
      </div>

      {/* SubPackages */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {workPackage.subPackages.map(sp => (
            <SubPackageCard
              key={sp.id}
              subPackage={sp}
              onUpdate={updates => onUpdateSubPackage(sp.id, updates)}
              onDelete={() => onDeleteSubPackage(sp.id)}
            />
          ))}

          {/* Add SubPackage Button */}
          <button
            onClick={onAddSubPackage}
            className="w-full py-2 border border-dashed border-border rounded-md text-sm text-text-muted hover:text-info hover:border-info transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            UAP hinzufügen
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkPackageTree;
