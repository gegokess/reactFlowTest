import { useRef, useState, useEffect } from 'react';
import { WorkPackage, SubPackage, Milestone, ZoomLevel } from '../types';
import { toIso, addDays, daysBetween } from '../utils/dateUtils';

interface TimelineProps {
  workPackages: WorkPackage[];
  milestones: Milestone[];
  zoomLevel: ZoomLevel;
  clampUapInsideManualAp: boolean;
  onUpdateSubPackage: (apId: string, uapId: string, updates: Partial<SubPackage>) => void;
  onDrop?: (e: React.DragEvent) => void;
}

// Zoom configurations
const ZOOM_CONFIG = {
  week: { label: 'Woche', tickDays: 1, viewDays: 30 },
  month: { label: 'Monat', tickDays: 7, viewDays: 90 },
  quarter: { label: 'Quartal', tickDays: 14, viewDays: 180 },
};

const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 50;
const BAR_HEIGHT = 20;
const SUBBAR_HEIGHT = 16;

export function Timeline({
  workPackages,
  milestones,
  zoomLevel,
  clampUapInsideManualAp,
  onUpdateSubPackage,
  onDrop,
}: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewStart] = useState<string>(() => {
    // Start from earliest date in project
    const allDates = [
      ...workPackages.map(wp => wp.start),
      ...workPackages.flatMap(wp => wp.subPackages.map(sp => sp.start)),
      ...milestones.map(ms => ms.date),
    ];
    if (allDates.length === 0) return toIso(new Date());
    return allDates.reduce((min, curr) => curr < min ? curr : min);
  });

  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-left' | 'resize-right';
    apId: string;
    uapId: string;
    initialX: number;
    initialStart: string;
    initialEnd: string;
  } | null>(null);

  const config = ZOOM_CONFIG[zoomLevel];
  const viewDays = config.viewDays;
  const tickDays = config.tickDays;

  // Calculate SVG dimensions
  const width = 1200;
  const height = HEADER_HEIGHT + (workPackages.length * ROW_HEIGHT) + 100;

  // Convert date to X position
  const dateToX = (date: string): number => {
    const days = daysBetween(viewStart, date);
    return (days / viewDays) * width;
  };

  // Clamp UAP inside AP if needed
  const clampUap = (apId: string, start: string, end: string): { start: string; end: string } => {
    if (!clampUapInsideManualAp) return { start, end };

    const ap = workPackages.find(wp => wp.id === apId);
    if (!ap || ap.mode !== 'manual') return { start, end };

    let clampedStart = start;
    let clampedEnd = end;

    if (start < ap.start) clampedStart = ap.start;
    if (end > ap.end) clampedEnd = ap.end;
    if (clampedStart > clampedEnd) clampedStart = clampedEnd;

    return { start: clampedStart, end: clampedEnd };
  };

  // Mouse handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'move' | 'resize-left' | 'resize-right',
    apId: string,
    uapId: string,
    start: string,
    end: string
  ) => {
    e.preventDefault();
    setDragState({
      type,
      apId,
      uapId,
      initialX: e.clientX,
      initialStart: start,
      initialEnd: end,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.initialX;
    const deltaDays = Math.round((deltaX / rect.width) * viewDays);

    let newStart = dragState.initialStart;
    let newEnd = dragState.initialEnd;

    if (dragState.type === 'move') {
      newStart = addDays(dragState.initialStart, deltaDays);
      newEnd = addDays(dragState.initialEnd, deltaDays);
    } else if (dragState.type === 'resize-left') {
      newStart = addDays(dragState.initialStart, deltaDays);
      // Ensure start doesn't go past end
      if (newStart > newEnd) newStart = newEnd;
    } else if (dragState.type === 'resize-right') {
      newEnd = addDays(dragState.initialEnd, deltaDays);
      // Ensure end doesn't go before start
      if (newEnd < newStart) newEnd = newStart;
    }

    // Clamp if needed
    const clamped = clampUap(dragState.apId, newStart, newEnd);

    onUpdateSubPackage(dragState.apId, dragState.uapId, {
      start: clamped.start,
      end: clamped.end,
    });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState]);

  // Generate time ticks
  const ticks: string[] = [];
  for (let i = 0; i <= viewDays; i += tickDays) {
    ticks.push(addDays(viewStart, i));
  }

  return (
    <div
      className="h-full overflow-auto bg-white"
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200"
        data-timeline-svg="true"
      >
        {/* Header with time ticks */}
        <g>
          <rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="#f9fafb" />
          {ticks.map((tick, i) => {
            const x = dateToX(tick);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={height}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={HEADER_HEIGHT - 10}
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {new Date(tick).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </text>
              </g>
            );
          })}
        </g>

        {/* Work Packages and UAPs */}
        {workPackages.map((ap, apIndex) => {
          const y = HEADER_HEIGHT + apIndex * ROW_HEIGHT;
          const apX1 = dateToX(ap.start);
          const apX2 = dateToX(ap.end);

          return (
            <g key={ap.id}>
              {/* AP Bracket */}
              <g>
                <line
                  x1={apX1}
                  y1={y + 5}
                  x2={apX1}
                  y2={y + BAR_HEIGHT + 5}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <line
                  x1={apX1}
                  y1={y + 5}
                  x2={apX2}
                  y2={y + 5}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <line
                  x1={apX2}
                  y1={y + 5}
                  x2={apX2}
                  y2={y + BAR_HEIGHT + 5}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <text
                  x={apX1 + 5}
                  y={y + 18}
                  fontSize="12"
                  fill="#1e40af"
                  fontWeight="600"
                >
                  {ap.title}
                </text>
              </g>

              {/* UAPs */}
              {ap.subPackages.map((uap, uapIndex) => {
                const uapY = y + 25 + uapIndex * (SUBBAR_HEIGHT + 2);
                const uapX1 = dateToX(uap.start);
                const uapX2 = dateToX(uap.end);
                const uapWidth = uapX2 - uapX1;

                return (
                  <g key={uap.id}>
                    {/* UAP Bar */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width={Math.max(uapWidth, 2)}
                      height={SUBBAR_HEIGHT}
                      fill="#60a5fa"
                      stroke="#3b82f6"
                      strokeWidth="1"
                      className="cursor-grab"
                      onMouseDown={e => handleMouseDown(e, 'move', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* Left resize handle */}
                    <rect
                      x={uapX1 - 3}
                      y={uapY}
                      width="6"
                      height={SUBBAR_HEIGHT}
                      fill="#2563eb"
                      className="cursor-ew-resize"
                      onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* Right resize handle */}
                    <rect
                      x={uapX2 - 3}
                      y={uapY}
                      width="6"
                      height={SUBBAR_HEIGHT}
                      fill="#2563eb"
                      className="cursor-ew-resize"
                      onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* UAP Label */}
                    <text
                      x={uapX1 + 5}
                      y={uapY + SUBBAR_HEIGHT - 4}
                      fontSize="10"
                      fill="white"
                      fontWeight="500"
                    >
                      {uap.title}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Milestones */}
        {milestones.map((ms, msIndex) => {
          const x = dateToX(ms.date);
          const y = HEADER_HEIGHT + workPackages.length * ROW_HEIGHT + 20 + msIndex * 30;

          return (
            <g key={ms.id}>
              {/* Diamond shape */}
              <polygon
                points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="2"
              />
              <text
                x={x + 12}
                y={y + 4}
                fontSize="12"
                fill="#92400e"
                fontWeight="600"
              >
                {ms.title}
              </text>
              {/* Vertical line */}
              <line
                x1={x}
                y1={HEADER_HEIGHT}
                x2={x}
                y2={y - 8}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
