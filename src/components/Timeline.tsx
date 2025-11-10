/**
 * Timeline Component
 * SVG-basierte Gantt-Chart-Visualisierung mit Drag & Drop und Resize
 * Basierend auf docs/04-Timeline.md
 */

import React, { useState, useRef, useMemo } from 'react';
import type { WorkPackage, Milestone, ZoomLevel, SubPackage } from '../types';
import { ZOOM_CONFIGS, TIMELINE_CONSTANTS } from '../types';
import {
  daysBetween,
  addDays,
  today,
  formatDate,
  getWeekNumber,
  getMonthName,
  getQuarterString,
  clampDate,
} from '../utils/dateUtils';

interface TimelineProps {
  workPackages: WorkPackage[];
  milestones: Milestone[];
  zoomLevel: ZoomLevel;
  clampingEnabled: boolean;
  projectStart?: string;
  projectEnd?: string;
  onUpdateSubPackage: (wpId: string, spId: string, updates: Partial<SubPackage>) => void;
  onUpdateMilestone?: (msId: string, updates: Partial<Milestone>) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  workPackages,
  milestones,
  zoomLevel,
  clampingEnabled,
  projectStart,
  onUpdateSubPackage,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-left' | 'resize-right';
    wpId: string;
    spId: string;
    originalStart: string;
    originalEnd: string;
    startX: number;
  } | null>(null);

  const zoomConfig = ZOOM_CONFIGS[zoomLevel];
  const {
    BASE_ROW_HEIGHT,
    SUBBAR_HEIGHT,
    UAP_SPACING,
    ROW_PADDING,
    HEADER_HEIGHT,
    PADDING_LEFT,
    PADDING_RIGHT,
    AP_LABEL_HEIGHT,
    AP_LABEL_SPACING,
    AP_PADDING_HORIZONTAL,
    AP_PADDING_VERTICAL,
  } = TIMELINE_CONSTANTS;

  // Berechne Viewport-Zeitbereich
  const viewStart = useMemo(() => {
    // Wenn Projektstart gesetzt, verwende diesen
    if (projectStart) {
      return projectStart;
    }

    // Ansonsten: Finde frühestes Datum aus allen Daten
    const allDates = [
      ...workPackages.map(wp => wp.start),
      ...workPackages.flatMap(wp => wp.subPackages.map(sp => sp.start)),
      ...milestones.map(ms => ms.date),
    ];
    if (allDates.length === 0) return today();

    const minDate = allDates.reduce((min, date) =>
      daysBetween(date, min) > 0 ? date : min
    );

    // Starte etwas früher für bessere Übersicht
    return addDays(minDate, -7);
  }, [workPackages, milestones, projectStart]);

  const viewWidth = 1200; // Fixed width, can be made dynamic
  const availableWidth = viewWidth - PADDING_LEFT - PADDING_RIGHT;

  // Koordinaten-Konvertierung
  const dateToX = (date: string): number => {
    const days = daysBetween(viewStart, date);
    return PADDING_LEFT + (days / zoomConfig.viewDays) * availableWidth;
  };

  // Berechne Zeilenhöhe für WorkPackage (mit AP Label Height und Padding)
  const getRowHeight = (wp: WorkPackage): number => {
    const uapCount = wp.subPackages.length;
    const labelSpace = AP_LABEL_HEIGHT + AP_LABEL_SPACING;

    if (uapCount === 0) {
      return labelSpace + BASE_ROW_HEIGHT;
    }

    return labelSpace + BASE_ROW_HEIGHT + uapCount * (SUBBAR_HEIGHT + UAP_SPACING) + ROW_PADDING + (2 * AP_PADDING_VERTICAL);
  };

  // Berechne Y-Position für WorkPackage
  const getRowY = (wpIndex: number): number => {
    let y = HEADER_HEIGHT;
    for (let i = 0; i < wpIndex; i++) {
      y += getRowHeight(workPackages[i]);
    }
    return y;
  };

  // Gesamthöhe des SVG
  const totalHeight = useMemo(() => {
    return (
      HEADER_HEIGHT +
      workPackages.reduce((sum, wp) => sum + getRowHeight(wp), 0) +
      100 // Extra padding at bottom
    );
  }, [workPackages, BASE_ROW_HEIGHT, SUBBAR_HEIGHT, UAP_SPACING, ROW_PADDING, HEADER_HEIGHT]);

  // Generiere Zeit-Achsen-Ticks
  const timeTicks = useMemo(() => {
    const ticks: { date: string; x: number; label: string }[] = [];
    let currentDate = viewStart;
    let dayCount = 0;

    while (dayCount <= zoomConfig.viewDays) {
      const x = dateToX(currentDate);
      let label = '';

      switch (zoomConfig.format) {
        case 'day':
          label = formatDate(currentDate, 'short');
          break;
        case 'week':
          label = getWeekNumber(currentDate);
          break;
        case 'month':
          label = getMonthName(currentDate).slice(0, 3);
          break;
        case 'quarter':
          label = getQuarterString(currentDate);
          break;
      }

      ticks.push({ date: currentDate, x, label });
      currentDate = addDays(currentDate, zoomConfig.tickDays);
      dayCount += zoomConfig.tickDays;
    }

    return ticks;
  }, [viewStart, zoomConfig, dateToX]);

  // Drag & Drop Handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'move' | 'resize-left' | 'resize-right',
    wpId: string,
    spId: string,
    sp: SubPackage
  ) => {
    e.stopPropagation();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    setDragState({
      type,
      wpId,
      spId,
      originalStart: sp.start,
      originalEnd: sp.end,
      startX: e.clientX - svgRect.left,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const currentX = e.clientX - svgRect.left;
    const deltaX = currentX - dragState.startX;
    const deltaDays = Math.round((deltaX / availableWidth) * zoomConfig.viewDays);

    const { wpId, spId, originalStart, originalEnd, type } = dragState;

    let newStart = originalStart;
    let newEnd = originalEnd;

    if (type === 'move') {
      newStart = addDays(originalStart, deltaDays);
      newEnd = addDays(originalEnd, deltaDays);
    } else if (type === 'resize-left') {
      newStart = addDays(originalStart, deltaDays);
      // Stelle sicher, dass Start <= End
      if (daysBetween(newStart, newEnd) < 1) {
        newStart = addDays(newEnd, -1);
      }
    } else if (type === 'resize-right') {
      newEnd = addDays(originalEnd, deltaDays);
      // Stelle sicher, dass Start <= End
      if (daysBetween(newStart, newEnd) < 1) {
        newEnd = addDays(newStart, 1);
      }
    }

    // Clamping (wenn aktiviert und AP im Manual-Modus)
    if (clampingEnabled) {
      const wp = workPackages.find(w => w.id === wpId);
      if (wp && wp.mode === 'manual') {
        newStart = clampDate(newStart, wp.start, wp.end);
        newEnd = clampDate(newEnd, wp.start, wp.end);
      }
    }

    onUpdateSubPackage(wpId, spId, { start: newStart, end: newEnd });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  return (
    <div className="timeline-container flex-1 overflow-auto bg-white">
      <svg
        ref={svgRef}
        width={viewWidth}
        height={totalHeight}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="timeline-svg"
        id="gantt-chart-svg"
      >
        {/* Grid Lines */}
        {timeTicks.map(tick => (
          <line
            key={tick.date}
            x1={tick.x}
            y1={HEADER_HEIGHT}
            x2={tick.x}
            y2={totalHeight}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
        ))}

        {/* Time Axis Header */}
        <g className="time-axis">
          <rect
            x={0}
            y={0}
            width={viewWidth}
            height={HEADER_HEIGHT}
            fill="var(--color-surface)"
          />
          {timeTicks.map(tick => (
            <text
              key={tick.date}
              x={tick.x}
              y={HEADER_HEIGHT - 20}
              textAnchor="middle"
              className="text-xs fill-text-muted"
            >
              {tick.label}
            </text>
          ))}
          <line
            x1={0}
            y1={HEADER_HEIGHT}
            x2={viewWidth}
            y2={HEADER_HEIGHT}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        </g>

        {/* Milestone Linien hinter den Arbeitspaketen */}
        {milestones.map(ms => {
          const msX = dateToX(ms.date);
          return (
            <line
              key={`ms-line-${ms.id}`}
              x1={msX}
              y1={HEADER_HEIGHT}
              x2={msX}
              y2={totalHeight}
              stroke="var(--color-warning)"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* WorkPackages und SubPackages */}
        {workPackages.map((wp, wpIndex) => {
          const rowY = getRowY(wpIndex);
          const rowHeight = getRowHeight(wp);
          const labelSpace = AP_LABEL_HEIGHT + AP_LABEL_SPACING;

          // AP Container Position (NACH dem Label)
          const containerY = rowY + labelSpace;
          const containerHeight = rowHeight - labelSpace - 10;

          return (
            <g key={wp.id} className="work-package-row">
              {/* AP Label (ÜBER dem Container) */}
              <text
                x={PADDING_LEFT + 10}
                y={rowY + AP_LABEL_HEIGHT - 4}
                className="text-sm font-medium fill-text"
              >
                {wp.title}
              </text>

              {/* AP Container (grauer Hintergrund-Box mit Padding) */}
              <rect
                x={dateToX(wp.start)}
                y={containerY}
                width={Math.max(20, dateToX(wp.end) - dateToX(wp.start))}
                height={containerHeight}
                fill="var(--color-surface)"
                stroke="var(--color-border)"
                strokeWidth={1}
                rx={8}
              />

              {/* SubPackages (mit Padding innerhalb des Containers) */}
              {wp.subPackages.map((sp, spIndex) => {
                const spY = containerY + AP_PADDING_VERTICAL + 10 + spIndex * (SUBBAR_HEIGHT + UAP_SPACING);
                const spX = Math.max(dateToX(wp.start) + AP_PADDING_HORIZONTAL, dateToX(sp.start));
                const spEndX = Math.min(dateToX(wp.end) - AP_PADDING_HORIZONTAL, dateToX(sp.end));
                const spWidth = Math.max(60, spEndX - spX);

                return (
                  <g key={sp.id} className="sub-package">
                    {/* UAP Card mit foreignObject für HTML-Content */}
                    <foreignObject
                      x={spX}
                      y={spY}
                      width={spWidth}
                      height={SUBBAR_HEIGHT}
                      onMouseDown={e => handleMouseDown(e, 'move', wp.id, sp.id, sp)}
                      style={{ cursor: dragState ? 'grabbing' : 'grab' }}
                    >
                      <div
                        className="h-full bg-white rounded border border-border shadow-sm flex items-center px-2 hover:shadow-md transition-shadow"
                        onMouseEnter={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            x: rect.right + 10,
                            y: rect.top,
                            content: `${sp.title}\n${formatDate(sp.start)} - ${formatDate(sp.end)}`,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {/* Farbbalken */}
                        <div
                          className="w-1 h-4 rounded-full mr-2"
                          style={{ backgroundColor: sp.color || '#3B82F6' }}
                        />
                        {/* Titel */}
                        <span className="text-xs font-medium text-text truncate flex-1">
                          {sp.title}
                        </span>
                      </div>
                    </foreignObject>

                    {/* Resize Handles */}
                    <rect
                      x={spX - 3}
                      y={spY}
                      width={6}
                      height={SUBBAR_HEIGHT}
                      fill="transparent"
                      style={{ cursor: 'ew-resize' }}
                      onMouseDown={e => handleMouseDown(e, 'resize-left', wp.id, sp.id, sp)}
                      className="resize-handle"
                    />
                    <rect
                      x={spX + spWidth - 3}
                      y={spY}
                      width={6}
                      height={SUBBAR_HEIGHT}
                      fill="transparent"
                      style={{ cursor: 'ew-resize' }}
                      onMouseDown={e => handleMouseDown(e, 'resize-right', wp.id, sp.id, sp)}
                      className="resize-handle"
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Milestone Marker & Labels */}
        {milestones.map(ms => {
          const msX = dateToX(ms.date);
          const markerY = totalHeight - 60; // Marker im unteren Bereich der Timeline
          const labelY = markerY + 4;

          return (
            <g key={ms.id} className="milestone">
              {/* Diamant-Symbol */}
              <path
                d={`M ${msX} ${markerY - 8} L ${msX + 8} ${markerY} L ${msX} ${markerY + 8} L ${msX - 8} ${markerY} Z`}
                fill="var(--color-warning)"
                stroke="white"
                strokeWidth={2}
              />

              {/* Label */}
              <text
                x={msX + 12}
                y={labelY}
                className="text-xs font-medium fill-warning"
              >
                {ms.title}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed bg-text text-white text-xs px-3 py-2 rounded shadow-lg whitespace-pre-line pointer-events-none z-50"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default Timeline;
