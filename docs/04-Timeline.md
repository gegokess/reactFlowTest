# Timeline / Gantt-Chart Implementierung

## Übersicht

Die Timeline-Komponente ist das Herzstück der Visualisierung. Sie rendert ein SVG-basiertes Gantt-Chart mit modernen Card-Designs, Drag & Drop und Resize-Funktionalität.

## Technische Architektur

### SVG + foreignObject

**Warum SVG?**
- Präzise Positionierung auf Zeitachse
- Skalierbare Grafiken
- Einfache mathematische Transformationen (Datum → X-Position)

**Warum foreignObject?**
- Ermöglicht HTML/CSS innerhalb SVG
- Moderne Card-Designs mit Flexbox
- Komplexe Layouts (Titel, Kategorie, Avatare)
- Bessere Typography

## Koordinatensystem

### Zeitachse (X-Achse)

```typescript
// Konfiguration pro Zoom-Level
const ZOOM_CONFIG = {
  week:    { tickDays: 1,  viewDays: 14,  format: 'day' },      // 2 Wochen
  month:   { tickDays: 7,  viewDays: 90,  format: 'week' },     // 3 Monate
  quarter: { tickDays: 30, viewDays: 180, format: 'month' },    // 6 Monate
  year:    { tickDays: 90, viewDays: 365, format: 'quarter' },  // 1 Jahr
};

// Umrechnung: Datum → X-Position
const dateToX = (date: string): number => {
  const days = daysBetween(viewStart, date);
  const availableWidth = width - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT;
  return TIMELINE_PADDING_LEFT + (days / viewDays) * availableWidth;
};
```

**Beispiel**:
```
viewStart: 2025-01-01
viewDays: 90
width: 2000
padding: 80 links, 60 rechts

Datum 2025-01-15:
  days = 14
  availableWidth = 2000 - 80 - 60 = 1860
  x = 80 + (14 / 90) * 1860 = 80 + 289.33 = 369.33
```

### Y-Achse (Arbeitspakete)

```typescript
// Dynamische Höhenberechnung
const getRowHeight = (wp: WorkPackage) => {
  const uapCount = wp.subPackages.length;
  if (uapCount === 0) return BASE_ROW_HEIGHT;
  return BASE_ROW_HEIGHT + (uapCount * (SUBBAR_HEIGHT + UAP_SPACING)) + ROW_PADDING;
};

// Konstanten
const BASE_ROW_HEIGHT = 70;      // AP-Höhe
const SUBBAR_HEIGHT = 28;        // UAP-Card-Höhe
const UAP_SPACING = 10;          // Abstand zwischen UAPs
const ROW_PADDING = 35;          // Padding unter jedem AP
const HEADER_HEIGHT = 90;        // Header-Höhe
```

**Beispiel**:
```
AP mit 3 UAPs:
  height = 70 + (3 * (28 + 10)) + 35
        = 70 + 114 + 35
        = 219px
```

## Rendering-Pipeline

### 1. Header (Zeitachse)

```svg
<!-- Background -->
<rect x="0" y="0" width={width} height={HEADER_HEIGHT} fill="#F9FAFB" />

<!-- Zeitachsen-Linie -->
<line
  x1={PADDING_LEFT}
  y1={HEADER_HEIGHT - 15}
  x2={width - PADDING_RIGHT}
  y2={HEADER_HEIGHT - 15}
  stroke="#3B82F6"
  strokeWidth="2"
/>

<!-- Ticks -->
{ticks.map((tick, i) => (
  <g key={i}>
    <!-- Grid-Linie -->
    <line x1={x} y1={HEADER_HEIGHT} x2={x} y2={height} />

    <!-- Tick-Marker -->
    <circle cx={x} cy={HEADER_HEIGHT - 15} r="3" />

    <!-- Label -->
    <text x={x} y={HEADER_HEIGHT - 35}>{formatTickLabel(tick)}</text>
  </g>
))}
```

**Tick-Formatierung**:
- `day`: "23. Dez"
- `week`: "KW 52"
- `month`: "Dez 2024"
- `quarter`: "Q4 2024"

### 2. AP-Container

```svg
<g filter="url(#softShadow)">
  <!-- Base Container -->
  <rect
    x={apX1}
    y={y + 8}
    width={apX2 - apX1}
    height={BAR_HEIGHT}
    fill="url(#apGradient)"  // Hellgrauer Gradient
    rx="8"
  />

  <!-- Border -->
  <rect
    fill="none"
    stroke="#CBD5E1"
    strokeWidth="1.5"
    ...
  />

  <!-- Left Accent Bar -->
  <rect
    x={apX1}
    width="4"
    fill="#64748B"  // Slate blue
    ...
  />
</g>

<!-- AP Title -->
<text x={apX1 + 14} y={...}>{ap.title}</text>
```

### 3. UAP-Cards (Moderne Design)

**Struktur**:
```svg
<g key={uap.id}>
  <!-- 1. Card Background (weiß) -->
  <rect fill="#FFFFFF" rx="10" filter="url(#softShadow)" />

  <!-- 2. Left Color Bar -->
  <rect x={uapX1} width="4" fill={uap.color} rx="10" />

  <!-- 3. Border -->
  <rect fill="none" stroke="#E5E7EB" strokeWidth="1" />

  <!-- 4. Interactive Layer (transparent, für Drag) -->
  <rect
    fill="transparent"
    onMouseDown={handleDrag}
    onMouseEnter={showTooltip}
    cursor="grab"
  />

  <!-- 5. Content via foreignObject -->
  <foreignObject x={uapX1 + 8} y={uapY + 2} width={...} height={...}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <!-- Left: Title + Category -->
      <div>
        <div>{uap.title}</div>
        {uap.category && <div>{uap.category}</div>}
      </div>

      <!-- Right: Avatars -->
      {assignedTo.map(person => (
        <div style={{ /* Avatar-Styling */ }}>
          {getInitials(person)}
        </div>
      ))}
    </div>
  </foreignObject>

  <!-- 6. Resize Handles (nur bei Hover sichtbar) -->
  <g opacity="0">
    <rect x={uapX1 - 3} ... cursor="ew-resize" />  <!-- Left -->
    <rect x={uapX2 - 3} ... cursor="ew-resize" />  <!-- Right -->
  </g>
</g>
```

**Wichtige Design-Entscheidungen**:
1. **Card Background zuerst**: Weiße Basis
2. **Color Bar darüber**: Farbiger Akzent links
3. **Border ganz oben**: Definition
4. **Transparent Layer**: Fängt Maus-Events, aber unsichtbar
5. **foreignObject**: Erlaubt moderne HTML/CSS-Layouts
6. **Resize Handles**: Separate Gruppe, opacity-gesteuert

### 4. Meilensteine

```svg
<!-- Vertical Line -->
<line
  x1={x}
  y1={HEADER_HEIGHT}
  x2={x}
  y2={y - 20}
  stroke="#3B82F6"
  strokeDasharray="6 4"
/>

<!-- Diamond Marker (rotiertes Rechteck) -->
<rect
  x={x - 7}
  y={y - 7}
  width="14"
  height="14"
  fill="#F59E0B"
  transform={`rotate(45 ${x} ${y})`}
  rx="2"
/>

<!-- Label -->
<text x={x + 22} y={y + 4}>{milestone.title}</text>
```

## Interaktivität

### Drag & Drop (Verschieben)

```typescript
// 1. Mouse Down → State setzen
const handleMouseDown = (e, type, apId, uapId, start, end) => {
  setDragState({
    type: 'move',
    apId,
    uapId,
    initialX: e.clientX,
    initialStart: start,
    initialEnd: end,
  });
};

// 2. Mouse Move → Neue Position berechnen
const handleMouseMove = (e: MouseEvent) => {
  const deltaX = e.clientX - dragState.initialX;
  const deltaDays = Math.round((deltaX / rect.width) * viewDays);

  const newStart = addDays(dragState.initialStart, deltaDays);
  const newEnd = addDays(dragState.initialEnd, deltaDays);

  onUpdateSubPackage(apId, uapId, { start: newStart, end: newEnd });
};

// 3. Mouse Up → State zurücksetzen
const handleMouseUp = () => {
  setDragState(null);
};
```

**Mathematik**:
```
User zieht 100px nach rechts
SVG-Breite: 2000px
viewDays: 90

deltaDays = round((100 / 2000) * 90) = round(4.5) = 5

Neues Start-Datum: 2025-01-15 + 5 = 2025-01-20
```

### Resize (Dauer ändern)

```typescript
if (type === 'resize-left') {
  newStart = addDays(initialStart, deltaDays);
  if (newStart > end) newStart = end;  // Start nicht nach End
} else if (type === 'resize-right') {
  newEnd = addDays(initialEnd, deltaDays);
  if (newEnd < start) newEnd = start;  // End nicht vor Start
}
```

### Clamping (UAP in AP begrenzen)

```typescript
const clampUap = (apId: string, start: string, end: string) => {
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
```

## SVG-Filter und Effekte

### Soft Shadow
```svg
<filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
  <feOffset dx="0" dy="2"/>
  <feComponentTransfer>
    <feFuncA type="linear" slope="0.1"/>
  </feComponentTransfer>
  <feMerge>
    <feMergeNode/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```

### Gradienten
```svg
<!-- AP-Container -->
<linearGradient id="apGradient">
  <stop offset="0%" stopColor="#F0F4F8" />
  <stop offset="100%" stopColor="#E8EDF3" />
</linearGradient>

<!-- Current Week Highlight -->
<linearGradient id="currentWeekGradient">
  <stop offset="0%" stopColor="#F0F4FF" stopOpacity="0.5" />
  <stop offset="100%" stopColor="#F0F4FF" stopOpacity="0.1" />
</linearGradient>
```

## Performance-Optimierungen

### 1. Viewport-Culling (zukünftig)
```typescript
// Nur sichtbare UAPs rendern
const visibleUaps = uaps.filter(uap => {
  const x1 = dateToX(uap.start);
  const x2 = dateToX(uap.end);
  return x2 >= scrollX && x1 <= scrollX + viewportWidth;
});
```

### 2. Memoization
```typescript
const dateToXMemo = useMemo(
  () => dateToX,
  [viewStart, viewDays, width]
);
```

### 3. Event-Delegation
- Nicht jedes UAP hat eigene Handler
- Stattdessen: Ein Handler auf SVG-Root, dann `event.target` prüfen

## Troubleshooting

### Problem: foreignObject funktioniert nicht

**Lösung**: Namespace prüfen
```typescript
<foreignObject xmlns="http://www.w3.org/1999/xhtml">
  <div>...</div>
</foreignObject>
```

### Problem: Drag & Drop ruckelt

**Lösung**: `requestAnimationFrame` verwenden
```typescript
const handleMouseMove = (e: MouseEvent) => {
  requestAnimationFrame(() => {
    // Update-Logik
  });
};
```

### Problem: Overflow bei kleinen UAPs

**Lösung**: Minimum-Breite setzen
```typescript
const uapWidth = Math.max(uapX2 - uapX1, 120);  // Min. 120px
```

## Erweiterungen

### Zoom mit Mausrad
```typescript
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const newViewDays = viewDays + delta * 7;
    setViewDays(clamp(newViewDays, 14, 365));
  }
};
```

### Virtuelles Scrollen
```typescript
// Bei sehr vielen APs (100+)
const visibleApIndices = getVisibleRange(scrollY, viewportHeight);
const visibleAps = workPackages.slice(
  visibleApIndices.start,
  visibleApIndices.end
);
```

### Snapping zu Grid
```typescript
// Snap zu Wochenbeginn
const snapToWeek = (date: Date) => {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;  // Montag
  return addDays(toIso(date), diff);
};
```

## Best Practices

1. **Koordinaten-Konsistenz**: Alle Positionen durch `dateToX()` berechnen
2. **Z-Index via Render-Reihenfolge**: Später gerendert = weiter vorne
3. **Filter sparsam einsetzen**: Performance-Impact beachten
4. **foreignObject für Komplexität**: HTML/CSS für komplexe Layouts
5. **Cursor-Feedback**: `cursor: grab/grabbing/ew-resize`
