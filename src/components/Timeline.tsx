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

// Apple-inspired spacing - precise and generous
const BASE_ROW_HEIGHT = 60; // Base height for AP
const HEADER_HEIGHT = 80;
const BAR_HEIGHT = 32;
const SUBBAR_HEIGHT = 24;
const UAP_SPACING = 8; // Spacing between UAPs (Apple-style)
const ROW_PADDING = 30; // Padding at bottom of each row

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

  // Calculate dynamic row heights based on UAP count (Apple-style precise spacing)
  const getRowHeight = (wp: WorkPackage) => {
    const uapCount = wp.subPackages.length;
    if (uapCount === 0) return BASE_ROW_HEIGHT;
    return BASE_ROW_HEIGHT + (uapCount * (SUBBAR_HEIGHT + UAP_SPACING)) + ROW_PADDING;
  };

  // Calculate cumulative Y positions for each work package
  const rowPositions = workPackages.reduce((acc, wp, index) => {
    const prevY = index === 0 ? HEADER_HEIGHT : acc[index - 1].y + acc[index - 1].height;
    acc.push({
      y: prevY,
      height: getRowHeight(wp),
    });
    return acc;
  }, [] as { y: number; height: number }[]);

  // Calculate SVG dimensions - wider for more spacious design
  const width = 1800;
  const totalRowsHeight = rowPositions.length > 0
    ? rowPositions[rowPositions.length - 1].y + rowPositions[rowPositions.length - 1].height
    : HEADER_HEIGHT;
  const height = totalRowsHeight + 150; // Extra space for milestones

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
        {/* Apple-inspired gradient definitions */}
        <defs>
          {/* Glass gloss effect for AP containers */}
          <linearGradient id="appleGloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </linearGradient>
          {/* UAP gradient for subtle depth */}
          <linearGradient id="uapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.25 }} />
            <stop offset="100%" style={{ stopColor: '#000000', stopOpacity: 0.05 }} />
          </linearGradient>
          {/* Soft shadow for elevation */}
          <filter id="appleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Header with time ticks - Apple-inspired */}
        <g>
          <rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="#fafafa" />
          <line x1="0" y1={HEADER_HEIGHT} x2={width} y2={HEADER_HEIGHT} stroke="#d1d1d6" strokeWidth="0.5" />
          {ticks.map((tick, i) => {
            const x = dateToX(tick);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={HEADER_HEIGHT}
                  x2={x}
                  y2={height}
                  stroke="#e5e5e7"
                  strokeWidth="0.5"
                  opacity="0.6"
                />
                <text
                  x={x}
                  y={HEADER_HEIGHT - 32}
                  fontSize="13"
                  fill="#86868b"
                  textAnchor="middle"
                  fontWeight="600"
                  letterSpacing="-0.1"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
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
          const y = rowPositions[apIndex].y;
          const apX1 = dateToX(ap.start);
          const apX2 = dateToX(ap.end);

          return (
            <g key={ap.id}>
              {/* AP Container - Apple-inspired glass material */}
              <g>
                {/* Background bar with Apple-style glass effect */}
                <rect
                  x={apX1}
                  y={y + 5}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT + 5}
                  fill="#f5f5f7"
                  stroke="none"
                  rx="8"
                  ry="8"
                  opacity="0.6"
                />
                {/* Subtle overlay for depth */}
                <rect
                  x={apX1}
                  y={y + 5}
                  width={apX2 - apX1}
                  height={(BAR_HEIGHT + 5) / 2}
                  fill="url(#appleGloss)"
                  stroke="none"
                  rx="8"
                  ry="8"
                  opacity="0.5"
                />
                {/* Border with subtle color */}
                <rect
                  x={apX1}
                  y={y + 5}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT + 5}
                  fill="none"
                  stroke="#d1d1d6"
                  strokeWidth="0.5"
                  rx="8"
                  ry="8"
                  opacity="0.8"
                />
                {/* AP Title with SF-inspired typography */}
                <text
                  x={apX1 + 14}
                  y={y + 27}
                  fontSize="15"
                  fill="#1d1d1f"
                  fontWeight="600"
                  letterSpacing="-0.3"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                >
                  {ap.title}
                </text>
                {/* Accent indicator with Apple blue */}
                <rect
                  x={apX1}
                  y={y + 5}
                  width="3"
                  height={BAR_HEIGHT + 5}
                  fill="#007aff"
                  rx="1.5"
                  ry="1.5"
                />
              </g>

              {/* UAPs - Apple-inspired design */}
              {ap.subPackages.map((uap, uapIndex) => {
                const uapY = y + 45 + uapIndex * (SUBBAR_HEIGHT + UAP_SPACING);
                const uapX1 = dateToX(uap.start);
                const uapX2 = dateToX(uap.end);
                const uapWidth = uapX2 - uapX1;

                return (
                  <g key={uap.id} filter="url(#appleShadow)">
                    {/* UAP Bar - Apple blue with subtle gradient */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width={Math.max(uapWidth, 3)}
                      height={SUBBAR_HEIGHT}
                      fill="#007aff"
                      stroke="none"
                      rx="7"
                      ry="7"
                      className="cursor-grab"
                      onMouseDown={e => handleMouseDown(e, 'move', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* Glass overlay for depth */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width={Math.max(uapWidth, 3)}
                      height={SUBBAR_HEIGHT}
                      fill="url(#uapGradient)"
                      stroke="none"
                      rx="7"
                      ry="7"
                      pointerEvents="none"
                    />

                    {/* Left resize handle - Apple subtle design */}
                    <rect
                      x={uapX1 - 2}
                      y={uapY + 5}
                      width="3"
                      height={SUBBAR_HEIGHT - 10}
                      fill="#ffffff"
                      rx="1.5"
                      ry="1.5"
                      opacity="0"
                      className="cursor-ew-resize"
                      style={{ transition: 'opacity 0.25s ease' }}
                      onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '0.9')}
                      onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}
                      onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* Right resize handle - Apple subtle design */}
                    <rect
                      x={uapX2 - 1}
                      y={uapY + 5}
                      width="3"
                      height={SUBBAR_HEIGHT - 10}
                      fill="#ffffff"
                      rx="1.5"
                      ry="1.5"
                      opacity="0"
                      className="cursor-ew-resize"
                      style={{ transition: 'opacity 0.25s ease' }}
                      onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '0.9')}
                      onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}
                      onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                    />

                    {/* UAP Label - SF-inspired typography */}
                    <text
                      x={uapX1 + 12}
                      y={uapY + SUBBAR_HEIGHT / 2 + 5}
                      fontSize="13"
                      fill="#ffffff"
                      fontWeight="600"
                      letterSpacing="-0.2"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                    >
                      {uap.title}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Milestones - Apple-inspired design */}
        {milestones.map((ms, msIndex) => {
          const x = dateToX(ms.date);
          const y = totalRowsHeight + 40 + msIndex * 45;

          return (
            <g key={ms.id}>
              {/* Vertical indicator line - Apple subtle */}
              <line
                x1={x}
                y1={HEADER_HEIGHT}
                x2={x}
                y2={y - 14}
                stroke="#ff9500"
                strokeWidth="1.5"
                strokeDasharray="3 5"
                opacity="0.3"
              />

              {/* Milestone marker with Apple orange and shadow */}
              <g filter="url(#appleShadow)">
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="#ff9500"
                  stroke="none"
                />
                {/* Glass highlight */}
                <circle
                  cx={x}
                  cy={y - 1}
                  r="9"
                  fill="url(#appleGloss)"
                  stroke="none"
                  opacity="0.4"
                />
                {/* Border */}
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="1.5"
                />
                {/* Inner indicator */}
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#ffffff"
                  opacity="0.95"
                />
              </g>

              {/* Milestone label with SF typography */}
              <text
                x={x + 18}
                y={y + 5}
                fontSize="14"
                fill="#1d1d1f"
                fontWeight="600"
                letterSpacing="-0.2"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
              >
                {ms.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
