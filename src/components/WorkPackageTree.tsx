import { useState } from 'react';
import { WorkPackage, SubPackage, Milestone } from '../types';
import { SubPackageCard } from './SubPackageCard';

interface WorkPackageTreeProps {
  workPackages: WorkPackage[];
  milestones: Milestone[];
  onUpdateWorkPackage: (id: string, updates: Partial<WorkPackage>) => void;
  onDeleteWorkPackage: (id: string) => void;
  onAddSubPackage: (apId: string) => void;
  onUpdateSubPackage: (apId: string, uapId: string, updates: Partial<SubPackage>) => void;
  onDeleteSubPackage: (apId: string, uapId: string) => void;
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onDeleteMilestone: (id: string) => void;
}

export function WorkPackageTree({
  workPackages,
  milestones,
  onUpdateWorkPackage,
  onDeleteWorkPackage,
  onAddSubPackage,
  onUpdateSubPackage,
  onDeleteSubPackage,
  onUpdateMilestone,
  onDeleteMilestone,
}: WorkPackageTreeProps) {
  const [expandedAps, setExpandedAps] = useState<Set<string>>(
    new Set(workPackages.map(wp => wp.id))
  );

  const toggleExpand = (id: string) => {
    setExpandedAps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const confirmDelete = (title: string, onConfirm: () => void) => {
    if (window.confirm(`Wirklich "${title}" löschen?`)) {
      onConfirm();
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-5 space-y-6">
      {/* Work Packages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Arbeitspakete</h2>
          <span className="text-xs text-gray-400">{workPackages.length}</span>
        </div>
        {workPackages.map(ap => {
          const isExpanded = expandedAps.has(ap.id);
          const hasUaps = ap.subPackages.length > 0;
          const isReadOnly = hasUaps;

          return (
            <div key={ap.id} className="group relative">
              {/* AP Card */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-100/50 transition-all duration-200">
                {/* AP Header Row */}
                <div className="flex items-start gap-2 mb-3">
                  {hasUaps && (
                    <button
                      onClick={() => toggleExpand(ap.id)}
                      className="mt-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-white transition-colors flex-shrink-0"
                      title={isExpanded ? 'Zuklappen' : 'Aufklappen'}
                    >
                      <svg className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={ap.title}
                      onChange={e => onUpdateWorkPackage(ap.id, { title: e.target.value })}
                      className="w-full font-medium text-sm bg-transparent border-0 px-0 py-0 focus:ring-0 text-gray-900 placeholder:text-gray-400"
                      placeholder="Arbeitspaket Titel"
                    />
                    {hasUaps && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-gray-500">Auto-Modus</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{ap.subPackages.length} UAPs</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => confirmDelete(ap.title, () => onDeleteWorkPackage(ap.id))}
                    className="mt-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Löschen"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* AP Details */}
                {!hasUaps && (
                  <div className="space-y-2.5">
                    {/* Mode Selection */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-12">Modus</label>
                      <select
                        value={ap.mode}
                        onChange={e => onUpdateWorkPackage(ap.id, { mode: e.target.value as 'auto' | 'manual' })}
                        className="flex-1 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      >
                        <option value="manual">Manuell</option>
                        <option value="auto">Auto (Rollup)</option>
                      </select>
                    </div>

                    {/* Date Inputs */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-12">Start</label>
                      <input
                        type="date"
                        value={ap.start}
                        onChange={e => onUpdateWorkPackage(ap.id, { start: e.target.value })}
                        className="flex-1 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-12">Ende</label>
                      <input
                        type="date"
                        value={ap.end}
                        onChange={e => onUpdateWorkPackage(ap.id, { end: e.target.value })}
                        className="flex-1 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      />
                    </div>
                  </div>
                )}

                {isReadOnly && (
                  <div className="flex items-center gap-2 mt-2.5 px-2 py-1.5 bg-blue-50 rounded-md">
                    <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-blue-700">Zeitraum wird aus UAPs berechnet</span>
                  </div>
                )}

                {/* Add UAP Button */}
                <button
                  onClick={() => onAddSubPackage(ap.id)}
                  className="w-full mt-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md py-1.5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Unterarbeitspaket hinzufügen
                </button>
              </div>

              {/* Sub Packages */}
              {isExpanded && hasUaps && (
                <div className="mt-3 ml-7 space-y-3 border-l-2 border-gray-200 pl-4">
                  {ap.subPackages.map((uap) => (
                    <SubPackageCard
                      key={uap.id}
                      uap={uap}
                      onUpdate={(updates) => onUpdateSubPackage(ap.id, uap.id, updates)}
                      onDelete={() => onDeleteSubPackage(ap.id, uap.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Meilensteine</h2>
          <span className="text-xs text-gray-400">{milestones.length}</span>
        </div>
        {milestones.map(ms => (
          <div key={ms.id} className="group relative">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-100/50 transition-all duration-200">
              <div className="flex items-start gap-2 mb-2.5">
                <div className="mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0 bg-amber-100 rounded">
                  <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={ms.title}
                    onChange={e => onUpdateMilestone(ms.id, { title: e.target.value })}
                    className="w-full font-medium text-sm bg-transparent border-0 px-0 py-0 focus:ring-0 text-gray-900 placeholder:text-gray-400"
                    placeholder="Meilenstein Titel"
                  />
                </div>
                <button
                  onClick={() => confirmDelete(ms.title, () => onDeleteMilestone(ms.id))}
                  className="mt-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  title="Löschen"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-12">Datum</label>
                <input
                  type="date"
                  value={ms.date}
                  onChange={e => onUpdateMilestone(ms.id, { date: e.target.value })}
                  className="flex-1 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
