import { SubPackage } from '../types';
import { useState } from 'react';

interface SubPackageCardProps {
  uap: SubPackage;
  onUpdate: (updates: Partial<SubPackage>) => void;
  onDelete: () => void;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
];

// Helper to get initials from a name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper to generate a color based on initials
function getColorForInitials(initials: string): string {
  const index = initials.charCodeAt(0) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[index];
}

export function SubPackageCard({ uap, onUpdate, onDelete }: SubPackageCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingAssignees, setIsEditingAssignees] = useState(false);
  const [newAssignee, setNewAssignee] = useState('');

  const color = uap.color || DEFAULT_COLORS[0];
  const assignedTo = uap.assignedTo || [];

  const handleAddAssignee = () => {
    if (newAssignee.trim()) {
      onUpdate({ assignedTo: [...assignedTo, newAssignee.trim()] });
      setNewAssignee('');
    }
  };

  const handleRemoveAssignee = (index: number) => {
    const updated = assignedTo.filter((_, i) => i !== index);
    onUpdate({ assignedTo: updated });
  };

  const handleColorChange = (newColor: string) => {
    onUpdate({ color: newColor });
    setShowMenu(false);
  };

  const confirmDelete = () => {
    if (window.confirm(`Wirklich "${uap.title}" löschen?`)) {
      onDelete();
    }
  };

  return (
    <div className="group/card relative bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Colored left bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />

      {/* Card content */}
      <div className="pl-5 pr-4 py-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={uap.title}
              onChange={e => onUpdate({ title: e.target.value })}
              className="w-full font-semibold text-base bg-transparent border-0 px-0 py-0 focus:ring-0 text-gray-900 placeholder:text-gray-400"
              placeholder="Unterarbeitspaket Titel"
            />
          </div>

          {/* Right side: Avatars + Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Avatars */}
            {assignedTo.length > 0 && (
              <div className="flex -space-x-2">
                {assignedTo.slice(0, 3).map((person, idx) => {
                  const initials = getInitials(person);
                  const avatarColor = getColorForInitials(initials);
                  return (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: avatarColor }}
                      title={person}
                    >
                      {initials}
                    </div>
                  );
                })}
                {assignedTo.length > 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                    +{assignedTo.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Menu button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Optionen"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <button
                      onClick={() => {
                        setIsEditingAssignees(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Personen zuweisen
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingCategory(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Kategorie bearbeiten
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <div className="px-4 py-2">
                      <div className="text-xs text-gray-500 mb-2">Farbe ändern</div>
                      <div className="flex flex-wrap gap-2">
                        {DEFAULT_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => handleColorChange(c)}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={confirmDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Löschen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category/subtitle */}
        {isEditingCategory ? (
          <div className="mb-3">
            <input
              type="text"
              value={uap.category || ''}
              onChange={e => onUpdate({ category: e.target.value })}
              onBlur={() => setIsEditingCategory(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditingCategory(false)}
              className="w-full text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Kategorie hinzufügen..."
              autoFocus
            />
          </div>
        ) : (
          uap.category && (
            <div className="mb-3">
              <span className="text-sm text-gray-500">{uap.category}</span>
            </div>
          )
        )}

        {/* Assignees editor */}
        {isEditingAssignees && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Zugewiesene Personen</div>
            <div className="space-y-2 mb-2">
              {assignedTo.map((person, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 bg-white rounded px-2 py-1.5">
                  <span className="text-sm text-gray-900">{person}</span>
                  <button
                    onClick={() => handleRemoveAssignee(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAssignee}
                onChange={e => setNewAssignee(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAssignee()}
                className="flex-1 text-sm bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="Name eingeben..."
              />
              <button
                onClick={handleAddAssignee}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={() => setIsEditingAssignees(false)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Fertig
            </button>
          </div>
        )}

        {/* Date inputs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-12">Start</label>
            <input
              type="date"
              value={uap.start}
              onChange={e => onUpdate({ start: e.target.value })}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-12">Ende</label>
            <input
              type="date"
              value={uap.end}
              onChange={e => onUpdate({ end: e.target.value })}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
