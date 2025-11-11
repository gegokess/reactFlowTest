/**
 * MilestoneList Component
 * Verwaltung von Meilensteinen in der Sidebar
 */

import React, { useState } from 'react';
import type { Milestone } from '../types';
import { formatDate } from '../utils/dateUtils';

interface MilestoneListProps {
  milestones: Milestone[];
  onUpdate: (id: string, updates: Partial<Milestone>) => void;
  onDelete: (id: string) => void;
}

const MilestoneList: React.FC<MilestoneListProps> = ({ milestones, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');

  const handleEditStart = (ms: Milestone) => {
    setEditingId(ms.id);
    setEditTitle(ms.title);
    setEditDate(ms.date);
  };

  const handleEditSave = () => {
    if (editingId && editTitle.trim()) {
      onUpdate(editingId, { title: editTitle.trim(), date: editDate });
    }
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-border">
      {/* Header */}
      <div
        className="p-3 border-b border-border flex items-center justify-between cursor-pointer hover:bg-surface transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-medium text-text">Meilensteine</h3>
          <span className="text-xs text-text-muted">({milestones.length})</span>
        </div>
      </div>

      {/* Milestone List */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {milestones.length === 0 ? (
            <div className="text-center py-6 text-text-muted">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs">Keine Meilensteine vorhanden</p>
            </div>
          ) : (
            milestones.map(ms => (
              <div
                key={ms.id}
                className="bg-surface rounded-md p-3 border border-border hover:border-warning transition-colors"
              >
                {editingId === ms.id ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full text-sm font-medium px-2 py-1 border border-info rounded focus:outline-none focus:ring-1 focus:ring-info"
                      placeholder="Meilenstein-Titel"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full text-xs px-2 py-1 border border-border rounded focus:outline-none focus:ring-1 focus:ring-info"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        className="flex-1 px-3 py-1 bg-info text-white text-xs rounded hover:bg-opacity-90 transition-colors"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="flex-1 px-3 py-1 bg-surface text-text-muted text-xs rounded hover:bg-border transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-3 h-3 text-warning flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L15 9L22 10L17 15L18 22L12 19L6 22L7 15L2 10L9 9L12 2Z" />
                        </svg>
                        <h4 className="text-sm font-medium text-text truncate">{ms.title}</h4>
                      </div>
                      <p className="text-xs text-text-muted">{formatDate(ms.date, 'long')}</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditStart(ms)}
                        className="p-1 text-info hover:bg-white rounded transition-colors"
                        title="Bearbeiten"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Meilenstein "${ms.title}" wirklich löschen?`)) {
                            onDelete(ms.id);
                          }
                        }}
                        className="p-1 text-danger hover:bg-white rounded transition-colors"
                        title="Löschen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MilestoneList;
