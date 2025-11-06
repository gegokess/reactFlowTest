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
    <div className="h-full overflow-y-auto p-8 space-y-8">
      {/* Work Packages */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Arbeitspakete</h2>
        {workPackages.map(ap => {
          const isExpanded = expandedAps.has(ap.id);
          const hasUaps = ap.subPackages.length > 0;
          const isReadOnly = hasUaps;

          return (
            <div key={ap.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all">
              {/* AP Header */}
              <div className="flex items-center gap-3 mb-4">
                {hasUaps && (
                  <button
                    onClick={() => toggleExpand(ap.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
                    title={isExpanded ? 'Zuklappen' : 'Aufklappen'}
                  >
                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <input
                  type="text"
                  value={ap.title}
                  onChange={e => onUpdateWorkPackage(ap.id, { title: e.target.value })}
                  className="input flex-1 font-semibold text-base bg-white"
                  placeholder="Arbeitspaket Titel"
                />
                <button
                  onClick={() => confirmDelete(ap.title, () => onDeleteWorkPackage(ap.id))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="Löschen"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* AP Mode */}
              <div className="flex items-center gap-4 mb-4">
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Start</label>
                  <input
                    type="date"
                    value={ap.start}
                    onChange={e => onUpdateWorkPackage(ap.id, { start: e.target.value })}
                    className="input w-full text-sm bg-white"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Ende</label>
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
                <p className="text-xs text-gray-400 mb-4 italic">
                  Datum wird automatisch aus UAPs berechnet
                </p>
              )}

              {/* Add UAP Button */}
              <button
                onClick={() => onAddSubPackage(ap.id)}
                className="btn-sm btn-secondary w-full mt-3"
              >
                + Unterarbeitspaket
              </button>

              {/* Sub Packages */}
              {isExpanded && hasUaps && (
                <div className="mt-5 space-y-3">
                  {ap.subPackages.map(uap => (
                    <div key={uap.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="text"
                          value={uap.title}
                          onChange={e => onUpdateSubPackage(ap.id, uap.id, { title: e.target.value })}
                          className="input flex-1 text-sm font-medium bg-white"
                          placeholder="Unterarbeitspaket Titel"
                        />
                        <button
                          onClick={() => confirmDelete(uap.title, () => onDeleteSubPackage(ap.id, uap.id))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Start</label>
                          <input
                            type="date"
                            value={uap.start}
                            onChange={e => onUpdateSubPackage(ap.id, uap.id, { start: e.target.value })}
                            className="input w-full text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Ende</label>
                          <input
                            type="date"
                            value={uap.end}
                            onChange={e => onUpdateSubPackage(ap.id, uap.id, { end: e.target.value })}
                            className="input w-full text-xs bg-white"
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
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Meilensteine</h2>
        {milestones.map(ms => (
          <div key={ms.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <input
                type="text"
                value={ms.title}
                onChange={e => onUpdateMilestone(ms.id, { title: e.target.value })}
                className="input flex-1 font-semibold text-base bg-white"
                placeholder="Meilenstein Titel"
              />
              <button
                onClick={() => confirmDelete(ms.title, () => onDeleteMilestone(ms.id))}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                title="Löschen"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Datum</label>
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
