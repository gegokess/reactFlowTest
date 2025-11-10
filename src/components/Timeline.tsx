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
  week: { label: 'Tag', tickDays: 1, viewDays: 14, format: 'day' },
  month: { label: 'Woche', tickDays: 7, viewDays: 90, format: 'week' },
  quarter: { label: 'Monat', tickDays: 30, viewDays: 180, format: 'month' },
  year: { label: 'Quartal', tickDays: 90, viewDays: 365, format: 'quarter' },
} as const;

// Format tick label based on zoom level
const formatTickLabel = (dateStr: string, format: 'day' | 'week' | 'month' | 'quarter'): string => {
  const date = new Date(dateStr);

  switch (format) {
    case 'day':
      // Show day and short month name: "23. Dez"
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
      });

    case 'week':
      // Show calendar week: "KW 52"
      // Calculate ISO week number
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `KW ${weekNo}`;

    case 'month':
      // Show month name and year: "Dez 2024"
      return date.toLocaleDateString('de-DE', {
        month: 'short',
        year: 'numeric',
      });

    case 'quarter':
      // Show quarter and year: "Q4 2024"
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;

    default:
      return dateStr;
  }
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
    <div className="h-full flex flex-col bg-white">
      {/* Timeline Header */}
      <div className="border-b border-gray-100 px-6 py-4 bg-white">
        <div className="flex items-center justify-between">
          {/* Current zoom level indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {config.label}-Ansicht
            </span>
          </div>

          {/* Date Range & Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">27 Dec - 4 Jan</span>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Show Done Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">Show done</span>
              <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300">
                <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform translate-x-1" />
              </button>
            </div>

            {/* Sort & Filter */}
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div
        className="flex-1 overflow-auto relative"
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
        {/* Modern gradient and filter definitions - Relatel style */}
        <defs>
          {/* Sophisticated gradient for AP containers - soft blue-gray */}
          <linearGradient id="apGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#F0F4F8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#E8EDF3', stopOpacity: 1 }} />
          </linearGradient>

          {/* Soft Indigo - Professional and muted */}
          <linearGradient id="uapGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#A5B4FC', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#818CF8', stopOpacity: 1 }} />
          </linearGradient>

          {/* Soft Teal - Fresh and professional */}
          <linearGradient id="uapGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#99F6E4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#5EEAD4', stopOpacity: 1 }} />
          </linearGradient>

          {/* Soft Amber - Warm but professional */}
          <linearGradient id="uapGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FDE68A', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FCD34D', stopOpacity: 1 }} />
          </linearGradient>

          {/* Soft Rose - Elegant and subtle */}
          <linearGradient id="uapGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FBCFE8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F9A8D4', stopOpacity: 1 }} />
          </linearGradient>

          {/* Soft Emerald - Natural and calming */}
          <linearGradient id="uapGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#A7F3D0', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6EE7B7', stopOpacity: 1 }} />
          </linearGradient>

          {/* Soft Sky Blue - Clean and modern */}
          <linearGradient id="uapGradient6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#BAE6FD', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7DD3FC', stopOpacity: 1 }} />
          </linearGradient>

          {/* Current week highlight - very subtle */}
          <linearGradient id="currentWeekGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F0F4FF', stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: '#F0F4FF', stopOpacity: 0.1 }} />
          </linearGradient>

          {/* Subtle shimmer effect */}
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.1 }} />
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
          {/* Background - Light gray like YesYou */}
          <rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="#F9FAFB" />

          {/* Bottom border - subtle */}
          <line x1="0" y1={HEADER_HEIGHT} x2={width} y2={HEADER_HEIGHT} stroke="#E5E7EB" strokeWidth="1" opacity="1" />

          {/* Time scale indicator line - blue accent */}
          <line
            x1={TIMELINE_PADDING_LEFT}
            y1={HEADER_HEIGHT - 15}
            x2={width - TIMELINE_PADDING_RIGHT}
            y2={HEADER_HEIGHT - 15}
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
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
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={isCurrentWeek ? "0.8" : "0.5"}
                />

                {/* Tick marker on timeline */}
                <circle
                  cx={x}
                  cy={HEADER_HEIGHT - 15}
                  r="3"
                  fill={isCurrentWeek ? "#3B82F6" : "#9CA3AF"}
                  opacity={isFirst || isLast || isCurrentWeek ? "1" : "0.5"}
                />

                {/* Date label with Inter font */}
                <text
                  x={x}
                  y={HEADER_HEIGHT - 35}
                  fontSize="11"
                  fill={isCurrentWeek ? "#3B82F6" : "#6B7280"}
                  textAnchor="middle"
                  fontWeight={isCurrentWeek ? "600" : "500"}
                  letterSpacing="-0.2"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  {formatTickLabel(tick, config.format)}
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
              {/* AP Container - Clean, modern design like YesYou */}
              <g filter="url(#softShadow)">
                {/* Base container - light gray background */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="url(#apGradient)"
                  stroke="none"
                  rx="8"
                  ry="8"
                />

                {/* Border - subtle */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  rx="8"
                  ry="8"
                  opacity="1"
                />

                {/* Left accent bar - sophisticated slate blue */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width="4"
                  height={BAR_HEIGHT}
                  fill="#64748B"
                  rx="8"
                  ry="8"
                  opacity="1"
                />
              </g>

              {/* AP Title - clean text */}
              <text
                x={apX1 + 14}
                y={y + 8 + BAR_HEIGHT / 2 + 4}
                fontSize="13"
                fill="#374151"
                fontWeight="600"
                letterSpacing="-0.2"
                style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                {ap.title}
              </text>

              {/* UAPs - Modern Card Design */}
              {ap.subPackages.map((uap, uapIndex) => {
                const uapY = y + 50 + uapIndex * (SUBBAR_HEIGHT + UAP_SPACING);
                const uapX1 = dateToX(uap.start);
                const uapX2 = dateToX(uap.end);
                const uapWidth = Math.max(uapX2 - uapX1, 120);

                // Use color from UAP or default
                const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
                const color = uap.color || DEFAULT_COLORS[uapIndex % DEFAULT_COLORS.length];

                // Helper to get initials
                const getInitials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
                const getColorForInitials = (initials: string) => DEFAULT_COLORS[initials.charCodeAt(0) % DEFAULT_COLORS.length];

                const assignedTo = uap.assignedTo || [];

                return (
                  <g key={uap.id}>
                    {/* Card Background with Shadow */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width={uapWidth}
                      height={SUBBAR_HEIGHT}
                      fill="#FFFFFF"
                      rx="10"
                      ry="10"
                      filter="url(#softShadow)"
                    />

                    {/* Left Color Bar */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width="4"
                      height={SUBBAR_HEIGHT}
                      fill={color}
                      rx="10"
                      ry="10"
                    />

                    {/* Border */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width={uapWidth}
                      height={SUBBAR_HEIGHT}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                      rx="10"
                      ry="10"
                    />

                    {/* Interactive overlay for drag */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width={uapWidth}
                      height={SUBBAR_HEIGHT}
                      fill="transparent"
                      className="cursor-grab"
                      onMouseDown={e => handleMouseDown(e, 'move', ap.id, uap.id, uap.start, uap.end)}
                      onMouseEnter={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10,
                          content: `${uap.title}\n${new Date(uap.start).toLocaleDateString('de-DE')} - ${new Date(uap.end).toLocaleDateString('de-DE')}`
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />

                    {/* Foreign Object for HTML content */}
                    <foreignObject
                      x={uapX1 + 8}
                      y={uapY + 2}
                      width={uapWidth - 16}
                      height={SUBBAR_HEIGHT - 4}
                      pointerEvents="none"
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '100%',
                        padding: '0 4px',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
                        {/* Left side: Title and Category */}
                        <div style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#111827',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.2'
                          }}>
                            {uap.title}
                          </div>
                          {uap.category && (
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              marginTop: '1px',
                              lineHeight: '1'
                            }}>
                              {uap.category}
                            </div>
                          )}
                        </div>

                        {/* Right side: Avatars */}
                        {assignedTo.length > 0 && (
                          <div style={{
                            display: 'flex',
                            marginLeft: '8px',
                            gap: '-8px'
                          }}>
                            {assignedTo.slice(0, 3).map((person, idx) => {
                              const initials = getInitials(person);
                              const avatarColor = getColorForInitials(initials);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: avatarColor,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    fontWeight: 600,
                                    border: '2px solid white',
                                    marginLeft: idx > 0 ? '-8px' : '0'
                                  }}
                                  title={person}
                                >
                                  {initials}
                                </div>
                              );
                            })}
                            {assignedTo.length > 3 && (
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#D1D5DB',
                                color: '#4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 600,
                                border: '2px solid white',
                                marginLeft: '-8px'
                              }}>
                                +{assignedTo.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </foreignObject>

                    {/* Resize handles */}
                    <g opacity="0" style={{ transition: 'opacity 0.2s ease' }} onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '1')} onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}>
                      <rect
                        x={uapX1 - 3}
                        y={uapY + 6}
                        width="6"
                        height={SUBBAR_HEIGHT - 12}
                        fill="#FFFFFF"
                        stroke="#D1D5DB"
                        strokeWidth="1"
                        rx="2"
                        ry="2"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                      />
                    </g>

                    <g opacity="0" style={{ transition: 'opacity 0.2s ease' }} onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '1')} onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}>
                      <rect
                        x={uapX1 + uapWidth - 3}
                        y={uapY + 6}
                        width="6"
                        height={SUBBAR_HEIGHT - 12}
                        fill="#FFFFFF"
                        stroke="#D1D5DB"
                        strokeWidth="1"
                        rx="2"
                        ry="2"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                      />
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Milestones - Clean, elegant design with orange accent */}
        {milestones.map((ms, msIndex) => {
          const x = dateToX(ms.date);
          const y = totalRowsHeight + 50 + msIndex * 50;

          return (
            <g key={ms.id}>
              {/* Vertical indicator line - subtle blue */}
              <line
                x1={x}
                y1={HEADER_HEIGHT}
                x2={x}
                y2={y - 20}
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.3"
              />

              {/* Milestone marker - clean orange diamond */}
              <g filter="url(#softShadow)">
                {/* Outer glow */}
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="#F59E0B"
                  opacity="0.2"
                />

                {/* Main marker - diamond shape using transform */}
                <rect
                  x={x - 7}
                  y={y - 7}
                  width="14"
                  height="14"
                  fill="#F59E0B"
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
                  opacity="0.4"
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
                  opacity="0.5"
                />

                {/* Inner dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#FFFFFF"
                  opacity="1"
                />
              </g>

              {/* Subtle background for label */}
              <rect
                x={x + 16}
                y={y - 11}
                width={ms.title.length * 8 + 12}
                height="22"
                fill="#FFFFFF"
                rx="6"
                ry="6"
                opacity="0.95"
                filter="url(#softShadow)"
                stroke="#E5E7EB"
                strokeWidth="1"
              />

              {/* Milestone label - Inter font, gray color */}
              <text
                x={x + 22}
                y={y + 4}
                fontSize="12"
                fill="#374151"
                fontWeight="600"
                letterSpacing="-0.1"
                style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                {ms.title}
              </text>
            </g>
          );
        })}
        </svg>
      </div>
    </div>
  );
}
