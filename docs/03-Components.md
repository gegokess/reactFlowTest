# Komponenten-Übersicht

## Komponenten-Hierarchie

```
App
├── Toolbar
├── WorkPackageTree
│   └── SubPackageCard (für jedes UAP)
├── Timeline
│   ├── Header (Zeitachse)
│   ├── AP-Container (SVG)
│   └── UAP-Cards (SVG mit foreignObject)
```

## 1. App.tsx

**Hauptkomponente** - Layout und Datenfluss-Orchestrierung

### Verantwortlichkeiten
- Layout-Management (Toolbar, Seitenleiste, Timeline)
- Export/Import-Handler
- Drag & Drop für JSON-Import
- Integration aller Sub-Komponenten

### Props
Keine (Wurzel-Komponente)

### State
```typescript
const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
```

### Wichtige Funktionen
```typescript
// JSON Export als Datei
const handleExportJson = () => void

// JSON in Zwischenablage kopieren
const handleCopyJson = async () => void

// JSON Import
const handleImportJson = (json: string) => void

// PDF Export (druckt die Seite)
const handleExportPdf = () => void

// Drag & Drop Handler
const handleDrop = (e: React.DragEvent) => void
```

### Verwendung
```tsx
<App />
```

## 2. Toolbar.tsx

**Top-Navigation** - Projektname, Zoom-Level, Export/Import

### Props
```typescript
interface ToolbarProps {
  projectName: string;
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  onAddWorkPackage: () => void;
  onAddMilestone: () => void;
  onExportJson: () => void;
  onCopyJson: () => void;
  onImportJson: (json: string) => void;
  onExportPdf: () => void;
}
```

### Features
- Zoom-Level-Auswahl (Woche, Monat, Quartal, Jahr)
- "AP hinzufügen" Button
- "Meilenstein hinzufügen" Button
- Export-Dropdown (JSON, Copy, PDF)
- Import-Dialog

### Verwendung
```tsx
<Toolbar
  projectName={project.name}
  zoomLevel={zoomLevel}
  onZoomChange={setZoomLevel}
  onAddWorkPackage={addWorkPackage}
  onAddMilestone={addMilestone}
  onExportJson={handleExportJson}
  onCopyJson={handleCopyJson}
  onImportJson={handleImportJson}
  onExportPdf={handleExportPdf}
/>
```

## 3. WorkPackageTree.tsx

**Linke Seitenleiste** - Hierarchische Liste von APs und UAPs

### Props
```typescript
interface WorkPackageTreeProps {
  workPackages: WorkPackage[];
  milestones: Milestone[];
  onUpdateWorkPackage: (id: string, updates: Partial<WorkPackage>) => void;
  onDeleteWorkPackage: (id: string) => void;
  onAddSubPackage: (apId: string) => void;
  onUpdateSubPackage: (apId: string, uapId: string, updates: Partial<SubPackage>) => void;
  onDeleteSubPackage: (apId: string, uapId: string) => void;
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onDeleteMilestone: (id: string) => void;
}
```

### Interner State
```typescript
const [expandedAps, setExpandedAps] = useState<Set<string>>(
  new Set(workPackages.map(wp => wp.id))
);
```

### Features
- **AP-Cards**:
  - Expand/Collapse für UAP-Liste
  - Titel-Eingabe
  - Modus-Auswahl (Manual/Auto)
  - Start/End-Datum (nur bei Manual ohne UAPs)
  - "UAP hinzufügen" Button
  - Löschen-Button (mit Bestätigung)

- **UAP-Cards** (via SubPackageCard):
  - Moderne Card-Designs
  - Siehe SubPackageCard-Dokumentation

- **Milestones**:
  - Star-Icon
  - Titel-Eingabe
  - Datum-Auswahl
  - Löschen-Button

### Verwendung
```tsx
<WorkPackageTree
  workPackages={project.workPackages}
  milestones={project.milestones}
  onUpdateWorkPackage={updateWorkPackage}
  onDeleteWorkPackage={deleteWorkPackage}
  onAddSubPackage={addSubPackage}
  onUpdateSubPackage={updateSubPackage}
  onDeleteSubPackage={deleteSubPackage}
  onUpdateMilestone={updateMilestone}
  onDeleteMilestone={deleteMilestone}
/>
```

## 4. SubPackageCard.tsx

**Moderne UAP-Card** - Card-Design

### Props
```typescript
interface SubPackageCardProps {
  uap: SubPackage;
  onUpdate: (updates: Partial<SubPackage>) => void;
  onDelete: () => void;
}
```

### Interner State
```typescript
const [showMenu, setShowMenu] = useState(false);
```

### Features

- **Inhalt**:
  - Titel (editable inline)
  - Start/End-Datum

- **Menü** (Drei-Punkte):
  - Farbauswahl (7 vordefinierte Farben)
  - "Löschen"

### Konstanten
```typescript
const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
];
```

### Hilfsfunktionen
```typescript
// Initialen aus Namen extrahieren
function getInitials(name: string): string
```

### Verwendung
```tsx
<SubPackageCard
  uap={uap}
  onUpdate={(updates) => onUpdateSubPackage(apId, uap.id, updates)}
  onDelete={() => onDeleteSubPackage(apId, uap.id)}
/>
```

## 5. Timeline.tsx

**Gantt-Chart-Visualisierung** - SVG-basierte Timeline mit Interaktivität

Siehe detaillierte Dokumentation in [04-Timeline.md](./04-Timeline.md)

### Props
```typescript
interface TimelineProps {
  workPackages: WorkPackage[];
  milestones: Milestone[];
  zoomLevel: ZoomLevel;
  clampUapInsideManualAp: boolean;
  onUpdateSubPackage: (apId: string, uapId: string, updates: Partial<SubPackage>) => void;
  onDrop?: (e: React.DragEvent) => void;
}
```

### Wichtigste Features
- Zeitachsen-Header mit Grid
- AP-Container (graue Boxen)
- **UAP-Cards (modernes Design)**:
  - Weiße Cards mit foreignObject
  - Titel 
- Drag & Drop (Verschieben)
- Resize-Handles (Dauer ändern)
- Meilenstein-Marker (Diamonds)




## Komponenten-Best-Practices

### 1. Props-Validierung
Alle Props sollten typisiert sein:
```typescript
interface MyComponentProps {
  required: string;
  optional?: number;
  callback: (id: string) => void;
}
```

### 2. Callback-Konventionen
- Prefix `on` für Event-Handler: `onUpdate`, `onClick`, `onDelete`
- Aussagekräftige Namen: `onUpdateSubPackage` statt `onUpdate`

### 3. State-Management
- **Lokaler UI-State**: In Komponente (z.B. `showMenu`, `isExpanded`)
- **Business-Logic-State**: Im useProject Hook
- Keine Props für temporäre UI-Zustände

### 4. Wiederverwendbarkeit
```typescript
// Gut: Generische Komponente
function Card({ children, color, onDelete }) { ... }

// Schlecht: Zu spezifisch
function SubPackageCardWithBlueColorAndDeleteButton() { ... }
```

### 5. Komponenten-Größe
- Maximal 300-400 Zeilen pro Komponente
- Bei größeren Komponenten: In Sub-Komponenten aufteilen
- Eine Verantwortung pro Komponente

### 6. Error-Handling
```typescript
// Defensive Programming
if (!uap) return null;
if (assignedTo.length === 0) return <EmptyState />;
```

## Interaktions-Flows

### 1. UAP erstellen
```
User klickt "UAP hinzufügen"
  ↓
WorkPackageTree: onAddSubPackage(apId)
  ↓
useProject: Neues UAP mit Default-Werten
  ↓
State Update → Re-Render
  ↓
SubPackageCard wird gerendert
```

### 2. UAP im Timeline verschieben
```
User beginnt Drag in Timeline
  ↓
handleMouseDown: dragState setzen
  ↓
User bewegt Maus
  ↓
handleMouseMove: Neue Datumsberechnung
  ↓
onUpdateSubPackage: State Update
  ↓
Timeline + WorkPackageTree re-rendern
```

### 3. Farbe ändern
```
User öffnet Menü in SubPackageCard
  ↓
User wählt Farbe
  ↓
handleColorChange(newColor)
  ↓
onUpdate({ color: newColor })
  ↓
State Update
  ↓
SubPackageCard + Timeline UAP re-rendern
```
