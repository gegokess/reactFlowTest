/**
 * SubPackageCard Component
 * Card für UAPs mit Titel und Zeitraum
 * Basierend auf docs/03-Components.md und docs/05-DesignSystem.md
 */

import React, { useState, useRef, useEffect } from 'react';
import type { SubPackage } from '../types';
import { formatDate } from '../utils/dateUtils';

interface SubPackageCardProps {
  subPackage: SubPackage;
  onUpdate: (updates: Partial<SubPackage>) => void;
  onDelete: () => void;
}

const SubPackageCard: React.FC<SubPackageCardProps> = ({ subPackage, onUpdate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(subPackage.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Schließe Menü bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Auto-Focus bei Titel-Bearbeitung
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== subPackage.title) {
      onUpdate({ title: trimmed });
    } else {
      setTitleValue(subPackage.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleValue(subPackage.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      className="bg-white rounded-md shadow-sm border border-border overflow-hidden h-full"
      style={{ minWidth: '200px' }}
    >
      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        {/* Header mit Titel und Drei-Punkt-Menü */}
        <div className="flex items-start justify-between gap-2">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="flex-1 text-sm font-medium text-text px-1 py-0.5 border border-info rounded focus:outline-none focus:ring-1 focus:ring-info"
            />
          ) : (
            <h4
              className="flex-1 text-sm font-medium text-text cursor-pointer hover:text-info transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Klicken zum Bearbeiten"
            >
              {subPackage.title}
            </h4>
          )}

          {/* Drei-Punkt-Menü */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="three-dot-menu p-1 hover:bg-surface rounded transition-colors"
              aria-label="Optionen"
            >
              <svg className="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-md border border-border z-10 min-w-[160px]">
                {/* Löschen */}
                <button
                  onClick={() => {
                    if (confirm(`UAP "${subPackage.title}" wirklich löschen?`)) {
                      onDelete();
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-surface transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Löschen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Datum-Bereich */}
        <div className="text-xs text-text-muted">
          {formatDate(subPackage.start, 'short')} - {formatDate(subPackage.end, 'short')}
        </div>
      </div>
    </div>
  );
};

export default SubPackageCard;
