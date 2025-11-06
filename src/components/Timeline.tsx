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
        {/* Sophisticated gradient and filter definitions */}
        <defs>
          {/* Vibrant purple gradient for AP containers */}
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.15 }} />
            <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 0.08 }} />
          </linearGradient>

          {/* Teal gradient for UAPs */}
          <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0891B2', stopOpacity: 1 }} />
          </linearGradient>

          {/* Coral gradient for highlights */}
          <linearGradient id="coralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FB923C', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
          </linearGradient>

          {/* Emerald gradient for success states */}
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
          </linearGradient>

          {/* Shimmer effect overlay */}
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </linearGradient>

          {/* Sophisticated multi-layer shadow */}
          <filter id="complexShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="0" dy="3" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Subtle glow effect */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="0" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Diagonal stripe pattern for AP background */}
          <pattern id="stripePattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.08"/>
          </pattern>
        </defs>

        {/* Header with sophisticated design */}
        <g>
          {/* Background with subtle gradient */}
          <rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="#FAFAF9" />
          <rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="url(#purpleGradient)" opacity="0.4" />

          {/* Bottom border with gradient */}
          <line x1="0" y1={HEADER_HEIGHT} x2={width} y2={HEADER_HEIGHT} stroke="#8B5CF6" strokeWidth="2" opacity="0.2" />

          {/* Time scale indicator line */}
          <line
            x1={TIMELINE_PADDING_LEFT}
            y1={HEADER_HEIGHT - 15}
            x2={width - TIMELINE_PADDING_RIGHT}
            y2={HEADER_HEIGHT - 15}
            stroke="#8B5CF6"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.3"
          />

          {ticks.map((tick, i) => {
            const x = dateToX(tick);
            const isFirst = i === 0;
            const isLast = i === ticks.length - 1;

            return (
              <g key={i}>
                {/* Vertical grid line */}
                <line
                  x1={x}
                  y1={HEADER_HEIGHT}
                  x2={x}
                  y2={height}
                  stroke="#E5E5E5"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                  opacity="0.4"
                />

                {/* Tick marker on timeline */}
                <circle
                  cx={x}
                  cy={HEADER_HEIGHT - 15}
                  r="4"
                  fill="#8B5CF6"
                  opacity={isFirst || isLast ? "1" : "0.5"}
                />

                {/* Date label */}
                <text
                  x={x}
                  y={HEADER_HEIGHT - 35}
                  fontSize="13"
                  fill="#52525B"
                  textAnchor="middle"
                  fontWeight="600"
                  letterSpacing="-0.2"
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
              {/* AP Container - Sophisticated multi-layer design */}
              <g filter="url(#complexShadow)">
                {/* Base container with rounded corners */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="#FFFFFF"
                  stroke="none"
                  rx="10"
                  ry="10"
                />

                {/* Stripe pattern background */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="url(#stripePattern)"
                  stroke="none"
                  rx="10"
                  ry="10"
                />

                {/* Gradient overlay */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="url(#purpleGradient)"
                  stroke="none"
                  rx="10"
                  ry="10"
                  opacity="0.6"
                />

                {/* Shimmer effect on top */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT / 2}
                  fill="url(#shimmer)"
                  stroke="none"
                  rx="10"
                  ry="10"
                  pointerEvents="none"
                />

                {/* Border with gradient */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width={apX2 - apX1}
                  height={BAR_HEIGHT}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                  rx="10"
                  ry="10"
                  opacity="0.3"
                />

                {/* Left accent bar - vibrant purple */}
                <rect
                  x={apX1}
                  y={y + 8}
                  width="5"
                  height={BAR_HEIGHT}
                  fill="#8B5CF6"
                  rx="10"
                  ry="10"
                />

                {/* Right accent indicator */}
                <circle
                  cx={apX2 - 12}
                  cy={y + 8 + BAR_HEIGHT / 2}
                  r="5"
                  fill="#A855F7"
                  opacity="0.6"
                />
              </g>

              {/* AP Title with modern typography */}
              <text
                x={apX1 + 18}
                y={y + 8 + BAR_HEIGHT / 2 + 6}
                fontSize="15"
                fill="#18181B"
                fontWeight="700"
                letterSpacing="-0.4"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}
              >
                {ap.title}
              </text>

              {/* UAPs - Sophisticated vibrant design */}
              {ap.subPackages.map((uap, uapIndex) => {
                const uapY = y + 50 + uapIndex * (SUBBAR_HEIGHT + UAP_SPACING);
                const uapX1 = dateToX(uap.start);
                const uapX2 = dateToX(uap.end);
                const uapWidth = uapX2 - uapX1;

                return (
                  <g key={uap.id}>
                    {/* UAP Bar with multiple visual layers */}
                    <g filter="url(#glow)">
                      {/* Base bar with gradient */}
                      <rect
                        x={uapX1}
                        y={uapY}
                        width={Math.max(uapWidth, 5)}
                        height={SUBBAR_HEIGHT}
                        fill="url(#tealGradient)"
                        stroke="none"
                        rx="8"
                        ry="8"
                        className="cursor-grab"
                        onMouseDown={e => handleMouseDown(e, 'move', ap.id, uap.id, uap.start, uap.end)}
                      />

                      {/* Shimmer overlay */}
                      <rect
                        x={uapX1}
                        y={uapY}
                        width={Math.max(uapWidth, 5)}
                        height={SUBBAR_HEIGHT / 2}
                        fill="url(#shimmer)"
                        stroke="none"
                        rx="8"
                        ry="8"
                        pointerEvents="none"
                      />

                      {/* Border highlight */}
                      <rect
                        x={uapX1}
                        y={uapY}
                        width={Math.max(uapWidth, 5)}
                        height={SUBBAR_HEIGHT}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        rx="8"
                        ry="8"
                        opacity="0.3"
                        pointerEvents="none"
                      />
                    </g>

                    {/* Progress indicator bar (left side) */}
                    <rect
                      x={uapX1}
                      y={uapY}
                      width="4"
                      height={SUBBAR_HEIGHT}
                      fill="#10B981"
                      rx="8"
                      ry="8"
                      opacity="0.8"
                    />

                    {/* Sophisticated resize handles with visual feedback */}
                    {/* Left resize handle */}
                    <g opacity="0" style={{ transition: 'opacity 0.3s ease' }} onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '1')} onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}>
                      <rect
                        x={uapX1 - 4}
                        y={uapY + 6}
                        width="8"
                        height={SUBBAR_HEIGHT - 12}
                        fill="#FFFFFF"
                        rx="3"
                        ry="3"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                      />
                      <rect
                        x={uapX1 - 3}
                        y={uapY + 7}
                        width="6"
                        height={SUBBAR_HEIGHT - 14}
                        fill="#06B6D4"
                        rx="2"
                        ry="2"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-left', ap.id, uap.id, uap.start, uap.end)}
                      />
                    </g>

                    {/* Right resize handle */}
                    <g opacity="0" style={{ transition: 'opacity 0.3s ease' }} onMouseOver={(e) => e.currentTarget.setAttribute('opacity', '1')} onMouseOut={(e) => e.currentTarget.setAttribute('opacity', '0')}>
                      <rect
                        x={uapX2 - 4}
                        y={uapY + 6}
                        width="8"
                        height={SUBBAR_HEIGHT - 12}
                        fill="#FFFFFF"
                        rx="3"
                        ry="3"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                      />
                      <rect
                        x={uapX2 - 3}
                        y={uapY + 7}
                        width="6"
                        height={SUBBAR_HEIGHT - 14}
                        fill="#06B6D4"
                        rx="2"
                        ry="2"
                        className="cursor-ew-resize"
                        onMouseDown={e => handleMouseDown(e, 'resize-right', ap.id, uap.id, uap.start, uap.end)}
                      />
                    </g>

                    {/* UAP Label with modern typography */}
                    <text
                      x={uapX1 + 14}
                      y={uapY + SUBBAR_HEIGHT / 2 + 6}
                      fontSize="13"
                      fill="#FFFFFF"
                      fontWeight="700"
                      letterSpacing="-0.3"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                    >
                      {uap.title}
                    </text>

                    {/* Status indicator dot (right side) */}
                    <circle
                      cx={uapX2 - 10}
                      cy={uapY + SUBBAR_HEIGHT / 2}
                      r="4"
                      fill="#10B981"
                      opacity="0.9"
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Milestones - Sophisticated vibrant design */}
        {milestones.map((ms, msIndex) => {
          const x = dateToX(ms.date);
          const y = totalRowsHeight + 50 + msIndex * 50;

          return (
            <g key={ms.id}>
              {/* Vertical indicator line with gradient */}
              <line
                x1={x}
                y1={HEADER_HEIGHT}
                x2={x}
                y2={y - 20}
                stroke="url(#coralGradient)"
                strokeWidth="2.5"
                strokeDasharray="8 6"
                opacity="0.4"
              />

              {/* Milestone marker - complex multi-layer */}
              <g filter="url(#complexShadow)">
                {/* Outer ring */}
                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  fill="url(#coralGradient)"
                  opacity="0.2"
                />

                {/* Main marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="11"
                  fill="url(#coralGradient)"
                  stroke="none"
                />

                {/* Shimmer overlay */}
                <circle
                  cx={x}
                  cy={y - 1}
                  r="11"
                  fill="url(#shimmer)"
                  stroke="none"
                  opacity="0.6"
                />

                {/* White border for definition */}
                <circle
                  cx={x}
                  cy={y}
                  r="11"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0.5"
                />

                {/* Inner core */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#FFFFFF"
                  opacity="0.95"
                />

                {/* Accent dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#FB923C"
                  opacity="0.8"
                />
              </g>

              {/* Milestone label with modern typography */}
              <text
                x={x + 22}
                y={y + 6}
                fontSize="14"
                fill="#18181B"
                fontWeight="700"
                letterSpacing="-0.3"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}
              >
                {ms.title}
              </text>

              {/* Subtle background for label */}
              <rect
                x={x + 18}
                y={y - 12}
                width={ms.title.length * 8.5 + 8}
                height="24"
                fill="#FAFAF9"
                rx="6"
                ry="6"
                opacity="0.9"
                style={{ pointerEvents: 'none' }}
              />

              {/* Re-render label on top */}
              <text
                x={x + 22}
                y={y + 6}
                fontSize="14"
                fill="#18181B"
                fontWeight="700"
                letterSpacing="-0.3"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}
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
