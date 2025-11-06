import { useState } from 'react';
import { WorkPackage, SubPackage, Milestone } from '../types';

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
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Work Packages */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Arbeitspakete</h2>
        {workPackages.map(ap => {
          const isExpanded = expandedAps.has(ap.id);
          const hasUaps = ap.subPackages.length > 0;
          const isReadOnly = hasUaps;

          return (
            <div key={ap.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              {/* AP Header */}
              <div className="flex items-center gap-2 mb-3">
                {hasUaps && (
                  <button
                    onClick={() => toggleExpand(ap.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white transition-colors"
                    title={isExpanded ? 'Zuklappen' : 'Aufklappen'}
                  >
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <input
                  type="text"
                  value={ap.title}
                  onChange={e => onUpdateWorkPackage(ap.id, { title: e.target.value })}
                  className="input flex-1 font-medium bg-white"
                  placeholder="Arbeitspaket Titel"
                />
                <button
                  onClick={() => confirmDelete(ap.title, () => onDeleteWorkPackage(ap.id))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="Löschen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* AP Mode */}
              <div className="flex items-center gap-3 mb-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Modus</label>
                <select
                  value={ap.mode}
                  onChange={e => onUpdateWorkPackage(ap.id, { mode: e.target.value as 'auto' | 'manual' })}
                  className="select text-sm bg-white"
                  disabled={hasUaps}
                >
                  <option value="manual">Manuell</option>
                  <option value="auto">Auto (Rollup)</option>
                </select>
                {hasUaps && (
                  <span className="text-xs text-gray-400">(Auto wegen UAPs)</span>
                )}
              </div>

              {/* AP Dates */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Start</label>
                  <input
                    type="date"
                    value={ap.start}
                    onChange={e => onUpdateWorkPackage(ap.id, { start: e.target.value })}
                    className="input w-full text-sm bg-white"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Ende</label>
                  <input
                    type="date"
                    value={ap.end}
                    onChange={e => onUpdateWorkPackage(ap.id, { end: e.target.value })}
                    className="input w-full text-sm bg-white"
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              {isReadOnly && (
                <p className="text-xs text-gray-400 mb-3 italic">
                  Datum wird automatisch aus UAPs berechnet
                </p>
              )}

              {/* Add UAP Button */}
              <button
                onClick={() => onAddSubPackage(ap.id)}
                className="btn-sm btn-secondary w-full mt-2"
              >
                + Unterarbeitspaket
              </button>

              {/* Sub Packages */}
              {isExpanded && hasUaps && (
                <div className="mt-4 space-y-2">
                  {ap.subPackages.map(uap => (
                    <div key={uap.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={uap.title}
                          onChange={e => onUpdateSubPackage(ap.id, uap.id, { title: e.target.value })}
                          className="input flex-1 text-sm"
                          placeholder="Unterarbeitspaket Titel"
                        />
                        <button
                          onClick={() => confirmDelete(uap.title, () => onDeleteSubPackage(ap.id, uap.id))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Start</label>
                          <input
                            type="date"
                            value={uap.start}
                            onChange={e => onUpdateSubPackage(ap.id, uap.id, { start: e.target.value })}
                            className="input w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Ende</label>
                          <input
                            type="date"
                            value={uap.end}
                            onChange={e => onUpdateSubPackage(ap.id, uap.id, { end: e.target.value })}
                            className="input w-full text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Meilensteine</h2>
        {milestones.map(ms => (
          <div key={ms.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <input
                type="text"
                value={ms.title}
                onChange={e => onUpdateMilestone(ms.id, { title: e.target.value })}
                className="input flex-1 font-medium bg-white"
                placeholder="Meilenstein Titel"
              />
              <button
                onClick={() => confirmDelete(ms.title, () => onDeleteMilestone(ms.id))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                title="Löschen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Datum</label>
              <input
                type="date"
                value={ms.date}
                onChange={e => onUpdateMilestone(ms.id, { date: e.target.value })}
                className="input w-full text-sm bg-white"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
