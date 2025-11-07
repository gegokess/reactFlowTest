import { useRef, useState, useEffect } from 'react';
import { WorkPackage, SubPackage, Milestone, ZoomLevel } from '../types';
import { toIso, addDays, daysBetween, parseIso } from '../utils/dateUtils';

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

// Sophisticated spacing system - complex visual hierarchy
const BASE_ROW_HEIGHT = 70; // Base height for AP with more breathing room
const HEADER_HEIGHT = 90;
const BAR_HEIGHT = 36;
const SUBBAR_HEIGHT = 28;
const UAP_SPACING = 10; // Generous spacing between UAPs
const ROW_PADDING = 35; // Padding at bottom of each row
const TIMELINE_PADDING_LEFT = 80; // Left padding so APs don't start at edge
const TIMELINE_PADDING_RIGHT = 60; // Right padding for balance

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

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
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

  // Calculate SVG dimensions - wider for more spacious design with padding
  const width = 2000;
  const totalRowsHeight = rowPositions.length > 0
    ? rowPositions[rowPositions.length - 1].y + rowPositions[rowPositions.length - 1].height
    : HEADER_HEIGHT;
  const height = totalRowsHeight + 180; // Extra space for milestones

  // Convert date to X position (with left/right padding)
  const dateToX = (date: string): number => {
    const days = daysBetween(viewStart, date);
    const availableWidth = width - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
    return TIMELINE_PADDING_LEFT + (days / viewDays) * availableWidth;
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
      className="h-full overflow-auto relative"
      style={{ backgroundColor: '#FFFFFF' }}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
    >
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
          className="px-3 py-2 rounded-lg text-xs font-medium text-white whitespace-pre-line"
        >
          <div
            style={{
              backgroundColor: '#16232A',
              padding: '8px 12px',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(22, 35, 42, 0.2)',
              fontFamily: 'Inter, "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '-0.2px',
            }}
          >
            {tooltip.content}
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ backgroundColor: '#FFFFFF' }}
        data-timeline-svg="true"
      >
        {/* Modern gradient and filter definitions with new color palette */}
        <defs>
          {/* Deep Sea Green gradient for AP containers - subtle and professional */}
          <linearGradient id="apGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#075056', stopOpacity: 0.08 }} />
            <stop offset="100%" style={{ stopColor: '#075056', stopOpacity: 0.04 }} />
          </linearGradient>

          {/* Deep Sea Green gradient for UAP bars - vibrant but not overwhelming */}
          <linearGradient id="uapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#075056', stopOpacity: 0.85 }} />
            <stop offset="100%" style={{ stopColor: '#064045', stopOpacity: 0.75 }} />
          </linearGradient>

          {/* Blaze Orange gradient for active/critical elements */}
          <linearGradient id="blazeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FF5B04', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#CC4903', stopOpacity: 1 }} />
          </linearGradient>

          {/* Current week highlight - soft Blaze Orange */}
          <linearGradient id="currentWeekGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FF5B04', stopOpacity: 0.04 }} />
            <stop offset="100%" style={{ stopColor: '#FF5B04', stopOpacity: 0.02 }} />
          </linearGradient>

          {/* Subtle shimmer effect */}
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.25 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.05 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </linearGradient>

          {/* Soft shadow - y-offset 2px, low opacity */}
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Minimal glow for hover states */}
          <filter id="minimalGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Header with clean, modern design */}
        <g>
          {/* Background - Wild Sand */}
          <rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="#E4EEF0" />

          {/* Bottom border - Mirage with low opacity */}
          <line x1="0" y1={HEADER_HEIGHT} x2={width} y2={HEADER_HEIGHT} stroke="#16232A" strokeWidth="1.5" opacity="0.15" />

          {/* Time scale indicator line - Deep Sea Green */}
          <line
            x1={TIMELINE_PADDING_LEFT}
            y1={HEADER_HEIGHT - 15}
            x2={width - TIMELINE_PADDING_RIGHT}
            y2={HEADER_HEIGHT - 15}
            stroke="#075056"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.25"
          />

          {ticks.map((tick, i) => {
            const x = dateToX(tick);
            const isFirst = i === 0;
            const isLast = i === ticks.length - 1;

            // Check if this is the current week
            const today = new Date();
            const tickDate = parseIso(tick);
            const nextTick = i < ticks.length - 1 ? parseIso(ticks[i + 1]) : null;
            const isCurrentWeek = tickDate <= today && (nextTick ? today < nextTick : true);

            return (
              <g key={i}>
                {/* Current week highlight with soft Blaze Orange */}
                {isCurrentWeek && nextTick && (
                  <rect
                    x={x}
                    y={HEADER_HEIGHT}
                    width={dateToX(ticks[i + 1]) - x}
                    height={height - HEADER_HEIGHT}
                    fill="url(#currentWeekGradient)"
                    pointerEvents="none"
                  />
                )}

                {/* Vertical grid line - subtle and clean */}
                <line
                  x1={x}
                  y1={HEADER_HEIGHT}
                  x2={x}
                  y2={height}
                  stroke="#16232A"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={isCurrentWeek ? "0.12" : "0.06"}
                />

                {/* Tick marker on timeline */}
                <circle
                  cx={x}
                  cy={HEADER_HEIGHT - 15}
                  r="3"
                  fill={isCurrentWeek ? "#FF5B04" : "#075056"}
                  opacity={isFirst || isLast || isCurrentWeek ? "0.9" : "0.4"}
                />

                {/* Date label with Inter/Source Sans font */}
                <text
                  x={x}
                  y={HEADER_HEIGHT - 35}
                  fontSize="12"
                  fill={isCurrentWeek ? "#FF5B04" : "#16232A"}
                  textAnchor="middle"
                  fontWeight={isCurrentWeek ? "700" : "500"}
                  letterSpacing="-0.3"
                  style={{ fontFamily: 'Inter, "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif' }}
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
              {/* AP Container - Clean, modern design */}
              <g filter="url(#softShadow)">
                {/* Base container - Wild Sand background */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="#E4EEF0"
                  stroke="none"
                  rx="6"
                  ry="6"
                />

                {/* Subtle gradient overlay - Deep Sea Green */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="url(#apGradient)"
                  stroke="none"
                  rx="6"
                  ry="6"
                />

                {/* Shimmer effect - subtle */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT / 2}
                  fill="url(#shimmer)"
                  stroke="none"
                  rx="6"
                  ry="6"
                  pointerEvents="none"
                />

                {/* Border - Deep Sea Green with low opacity */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="none"
                  stroke="#075056"
                  strokeWidth="1"
                  rx="6"
                  ry="6"
                  opacity="0.2"
                />

                {/* Left accent bar - Deep Sea Green */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width="4"
                  height={BAR_HEIGHT}
                  fill="#075056"
                  rx="6"
                  ry="6"
                  opacity="0.6"
                />
              </g>

              {/* AP Title - Mirage text, Inter font */}
              <text
                x={apX1 + 16}
                y={y + 8 + BAR_HEIGHT / 2 + 5}
                fontSize="14"
                fill="#16232A"
                fontWeight="700"
                letterSpacing="-0.3"
                style={{ fontFamily: 'Inter, "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                {ap.title}
              </text>

              {/* UAPs - Clean, modern design with Deep Sea Green */}
              {ap.subPackages.map((uap, uapIndex) => {
                const uapY = y + 50 + uapIndex * (SUBBAR_HEIGHT + UAP_SPACING);
                const uapX1 = dateToX(uap.start);
                const uapX2 = dateToX(uap.end);
                const uapWidth = uapX2 - uapX1;

                // Calculate progress (mock for now - could be from data)
                const progress = 0.6; // 60% progress

                return (
                  <g key={uap.id}>
                    {/* UAP Bar - main container */}
                    <g filter="url(#softShadow)">
                      {/* Base bar - Deep Sea Green */}
                      <rect
                        x={uapX1}
                        y={uapY}
                        width={Math.max(uapWidth, 5)}
                        height={SUBBAR_HEIGHT}
                        fill="#075056"
                        stroke="none"
                        rx="6"
                        ry="6"
                        className="cursor-grab"
                        onMouseDown={e => handleMouseDown(e, 'move', ap.id, uap.id, uap.start, uap.end)}
                        onMouseEnter={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                            content: `${uap.title}\n${new Date(uap.start).toLocaleDateString('de-DE')} - ${new Date(uap.end).toLocaleDateString('de-DE')}\nFortschritt: ${Math.round(progress * 100)}%`
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />

                      {/* Shimmer overlay */}
                      <rect
                        x={uapX1}
                        y={uapY}
                        width={Math.max(uapWidth, 5)}
                        height={SUBBAR_HEIGHT / 2}
                        fill="url(#shimmer)"
                        stroke="none"
                        rx="6"
                        ry="6"
                        pointerEvents="none"
                      />

                      {/* Border - subtle white highlight */}
                      <rect
                        x={uapX1}
                        y={uapY}
                        width={Math.max(uapWidth, 5)}
                        height={SUBBAR_HEIGHT}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        rx="6"
                        ry="6"
                        opacity="0.2"
                        pointerEvents="none"
                      />
                    </g>

                    {/* Progress indicator bar - Blaze Orange overlay */}
                    <rect
                      x={uapX1}
                      y={uapY + SUBBAR_HEIGHT - 3}
                      width={Math.max(uapWidth, 5) * progress}
                      height="3"
                      fill="#FF5B04"
                      rx="2"
                      ry="2"
                      opacity="0.9"
                      pointerEvents="none"
                    />

                    {/* Clean resize handles - minimal hover effect */}
                    {/* Left resize handle */}
                    <g opacity="0" style={{ transition: 'opacity 0.2s ease' }} onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '1')} onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}>
                      <rect
                        x={uapX1 - 3}
                        y={uapY + 6}
                        width="6"
                        height={SUBBAR_HEIGHT - 12}
                        fill="#FFFFFF"
                        rx="2"
                        ry="2"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                      />
                      <rect
                        x={uapX1 - 2}
                        y={uapY + 7}
                        width="4"
                        height={SUBBAR_HEIGHT - 14}
                        fill="#FF5B04"
                        rx="1"
                        ry="1"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                      />
                    </g>

                    {/* Right resize handle */}
                    <g opacity="0" style={{ transition: 'opacity 0.2s ease' }} onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '1')} onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}>
                      <rect
                        x={uapX2 - 3}
                        y={uapY + 6}
                        width="6"
                        height={SUBBAR_HEIGHT - 12}
                        fill="#FFFFFF"
                        rx="2"
                        ry="2"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                      />
                      <rect
                        x={uapX2 - 2}
                        y={uapY + 7}
                        width="4"
                        height={SUBBAR_HEIGHT - 14}
                        fill="#FF5B04"
                        rx="1"
                        ry="1"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                      />
                    </g>

                    {/* UAP Label - Inter font, white text */}
                    <text
                      x={uapX1 + 12}
                      y={uapY + SUBBAR_HEIGHT / 2 + 5}
                      fontSize="12"
                      fill="#FFFFFF"
                      fontWeight="600"
                      letterSpacing="-0.2"
                      style={{ fontFamily: 'Inter, "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif' }}
                      pointerEvents="none"
                    >
                      {uap.title}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Milestones - Clean, elegant design with Blaze Orange */}
        {milestones.map((ms, msIndex) => {
          const x = dateToX(ms.date);
          const y = totalRowsHeight + 50 + msIndex * 50;

          return (
            <g key={ms.id}>
              {/* Vertical indicator line - subtle Deep Sea Green */}
              <line
                x1={x}
                y1={HEADER_HEIGHT}
                x2={x}
                y2={y - 20}
                stroke="#075056"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.25"
              />

              {/* Milestone marker - clean Blaze Orange diamond */}
              <g filter="url(#softShadow)">
                {/* Outer glow */}
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="#FF5B04"
                  opacity="0.15"
                />

                {/* Main marker - diamond shape using transform */}
                <rect
                  x={x - 7}
                  y={y - 7}
                  width="14"
                  height="14"
                  fill="#FF5B04"
                  stroke="none"
                  rx="2"
                  transform={`rotate(45 ${x} ${y})`}
                />

                {/* Shimmer overlay */}
                <rect
                  x={x - 7}
                  y={y - 7}
                  width="14"
                  height="7"
                  fill="url(#shimmer)"
                  stroke="none"
                  rx="2"
                  transform={`rotate(45 ${x} ${y})`}
                  opacity="0.5"
                />

                {/* White border for definition */}
                <rect
                  x={x - 7}
                  y={y - 7}
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  rx="2"
                  transform={`rotate(45 ${x} ${y})`}
                  opacity="0.4"
                />

                {/* Inner dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#FFFFFF"
                  opacity="0.9"
                />
              </g>

              {/* Subtle background for label */}
              <rect
                x={x + 16}
                y={y - 11}
                width={ms.title.length * 8 + 12}
                height="22"
                fill="#E4EEF0"
                rx="4"
                ry="4"
                opacity="0.95"
                filter="url(#softShadow)"
              />

              {/* Milestone label - Inter font, Mirage color */}
              <text
                x={x + 22}
                y={y + 5}
                fontSize="13"
                fill="#16232A"
                fontWeight="600"
                letterSpacing="-0.2"
                style={{ fontFamily: 'Inter, "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif' }}
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
