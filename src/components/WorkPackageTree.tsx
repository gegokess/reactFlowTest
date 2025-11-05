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
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Work Packages */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">Arbeitspakete</h2>
        {workPackages.map(ap => {
          const isExpanded = expandedAps.has(ap.id);
          const hasUaps = ap.subPackages.length > 0;
          const isReadOnly = hasUaps;

          return (
            <div key={ap.id} className="card">
              {/* AP Header */}
              <div className="flex items-center gap-2 mb-2">
                {hasUaps && (
                  <button
                    onClick={() => toggleExpand(ap.id)}
                    className="icon-btn p-1"
                    title={isExpanded ? 'Zuklappen' : 'Aufklappen'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
                <input
                  type="text"
                  value={ap.title}
                  onChange={e => onUpdateWorkPackage(ap.id, { title: e.target.value })}
                  className="input flex-1"
                  placeholder="AP Titel"
                />
                <button
                  onClick={() => confirmDelete(ap.title, () => onDeleteWorkPackage(ap.id))}
                  className="icon-btn text-red-600 hover:bg-red-50"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>

              {/* AP Mode */}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-gray-600">Modus:</label>
                <select
                  value={ap.mode}
                  onChange={e => onUpdateWorkPackage(ap.id, { mode: e.target.value as 'auto' | 'manual' })}
                  className="select text-sm"
                  disabled={hasUaps}
                >
                  <option value="manual">Manuell</option>
                  <option value="auto">Auto (Rollup)</option>
                </select>
                {hasUaps && (
                  <span className="text-xs text-gray-500">(Auto wegen UAPs)</span>
                )}
              </div>

              {/* AP Dates */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Start</label>
                  <input
                    type="date"
                    value={ap.start}
                    onChange={e => onUpdateWorkPackage(ap.id, { start: e.target.value })}
                    className="input w-full text-sm"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Ende</label>
                  <input
                    type="date"
                    value={ap.end}
                    onChange={e => onUpdateWorkPackage(ap.id, { end: e.target.value })}
                    className="input w-full text-sm"
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              {isReadOnly && (
                <p className="text-xs text-gray-500 mb-2">
                  Datumsfelder sind read-only (werden von UAPs berechnet)
                </p>
              )}

              {/* Add UAP Button */}
              <button
                onClick={() => onAddSubPackage(ap.id)}
                className="btn-sm btn-primary w-full"
              >
                + UAP hinzufügen
              </button>

              {/* Sub Packages */}
              {isExpanded && hasUaps && (
                <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
                  {ap.subPackages.map(uap => (
                    <div key={uap.id} className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={uap.title}
                          onChange={e => onUpdateSubPackage(ap.id, uap.id, { title: e.target.value })}
                          className="input flex-1 text-sm"
                          placeholder="UAP Titel"
                        />
                        <button
                          onClick={() => confirmDelete(uap.title, () => onDeleteSubPackage(ap.id, uap.id))}
                          className="icon-btn text-red-600 hover:bg-red-50 text-xs"
                          title="Löschen"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Start</label>
                          <input
                            type="date"
                            value={uap.start}
                            onChange={e => onUpdateSubPackage(ap.id, uap.id, { start: e.target.value })}
                            className="input w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Ende</label>
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
        <h2 className="text-lg font-semibold text-gray-700">Meilensteine</h2>
        {milestones.map(ms => (
          <div key={ms.id} className="card">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💎</span>
              <input
                type="text"
                value={ms.title}
                onChange={e => onUpdateMilestone(ms.id, { title: e.target.value })}
                className="input flex-1"
                placeholder="Meilenstein Titel"
              />
              <button
                onClick={() => confirmDelete(ms.title, () => onDeleteMilestone(ms.id))}
                className="icon-btn text-red-600 hover:bg-red-50"
                title="Löschen"
              >
                🗑️
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Datum</label>
              <input
                type="date"
                value={ms.date}
                onChange={e => onUpdateMilestone(ms.id, { date: e.target.value })}
                className="input w-full text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
