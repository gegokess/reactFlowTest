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

// Increased spacing for a more spacious, modern design
const ROW_HEIGHT = 90;
const HEADER_HEIGHT = 80;
const BAR_HEIGHT = 32;
const SUBBAR_HEIGHT = 24;

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

  // Calculate SVG dimensions - wider for more spacious design
  const width = 1800;
  const height = HEADER_HEIGHT + (workPackages.length * ROW_HEIGHT) + 150;

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
          <rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="#fafafa" />
          {ticks.map((tick, i) => {
            const x = dateToX(tick);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={height}
                  stroke="#e5e5e5"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                <text
                  x={x}
                  y={HEADER_HEIGHT - 25}
                  fontSize="14"
                  fill="#525252"
                  textAnchor="middle"
                  fontWeight="500"
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
                  y1={y + 10}
                  x2={apX1}
                  y2={y + BAR_HEIGHT + 10}
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1={apX1}
                  y1={y + 10}
                  x2={apX2}
                  y2={y + 10}
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1={apX2}
                  y1={y + 10}
                  x2={apX2}
                  y2={y + BAR_HEIGHT + 10}
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text
                  x={apX1 + 10}
                  y={y + 28}
                  fontSize="15"
                  fill="#1e40af"
                  fontWeight="600"
                  letterSpacing="0.3"
                >
                  {ap.title}
                </text>
              </g>

              {/* UAPs */}
              {ap.subPackages.map((uap, uapIndex) => {
                const uapY = y + 45 + uapIndex * (SUBBAR_HEIGHT + 6);
                const uapX1 = dateToX(uap.start);
                const uapX2 = dateToX(uap.end);
                const uapWidth = uapX2 - uapX1;

                return (
                  <g key={uap.id}>
                    {/* UAP Bar */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width={Math.max(uapWidth, 3)}
                      height={SUBBAR_HEIGHT}
                      fill="#60a5fa"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      rx="4"
                      ry="4"
                      className="cursor-grab"
                      onMouseDown={e => handleMouseDown(e, 'move', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* Left resize handle */}
                    <rect
                      x={uapX1 - 4}
                      y={uapY}
                      width="8"
                      height={SUBBAR_HEIGHT}
                      fill="#1d4ed8"
                      rx="2"
                      ry="2"
                      className="cursor-ew-resize"
                      onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* Right resize handle */}
                    <rect
                      x={uapX2 - 4}
                      y={uapY}
                      width="8"
                      height={SUBBAR_HEIGHT}
                      fill="#1d4ed8"
                      rx="2"
                      ry="2"
                      className="cursor-ew-resize"
                      onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* UAP Label */}
                    <text
                      x={uapX1 + 8}
                      y={uapY + SUBBAR_HEIGHT - 6}
                      fontSize="12"
                      fill="white"
                      fontWeight="500"
                      letterSpacing="0.2"
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
          const y = HEADER_HEIGHT + workPackages.length * ROW_HEIGHT + 40 + msIndex * 45;

          return (
            <g key={ms.id}>
              {/* Diamond shape */}
              <polygon
                points={`${x},${y - 10} ${x + 10},${y} ${x},${y + 10} ${x - 10},${y}`}
                fill="#fbbf24"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <text
                x={x + 16}
                y={y + 5}
                fontSize="14"
                fill="#92400e"
                fontWeight="600"
                letterSpacing="0.3"
              >
                {ms.title}
              </text>
              {/* Vertical line */}
              <line
                x1={x}
                y1={HEADER_HEIGHT}
                x2={x}
                y2={y - 10}
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.5"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
