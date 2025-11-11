# Projekt Zeitplan

Eine moderne React-Anwendung zur Verwaltung von Arbeitspaketen (AP), Unterarbeitspaketen (UAP) und Meilensteinen in einer interaktiven Gantt-Chart-Ansicht.

## Features

### Core-Funktionalität
- **Hierarchische Projektstruktur**: Arbeitspakete (AP) mit verschachtelten Unterarbeitspaketen (UAP)
- **Interaktive Timeline**: SVG-basierte Gantt-Chart-Visualisierung
- **Drag & Drop**: Verschieben von UAPs auf der Timeline
- **Resize-Funktionalität**: Ändern der Dauer durch Ziehen der Handles
- **Auto-Rollup-Logik**: Automatische Berechnung der AP-Daten aus UAPs
- **Meilensteine**: Visualisierung wichtiger Projekt-Events

### Moderne UI/UX
- **Design System**: Konsistente Farben, Typography und Spacing
- **Moderne UAP-Cards**: Farbige Balken, Kategorien, Avatar-System
- **4 Zoom-Levels**: Woche, Monat, Quartal, Jahr
- **Toast-Benachrichtigungen**: Feedback für Benutzeraktionen
- **Responsive Layout**: Toolbar, Sidebar und Timeline

### Datenverwaltung
- **localStorage Persistenz**: Automatisches Speichern
- **JSON Export/Import**: Download, Copy-to-Clipboard, File-Upload
- **PDF Export**: Über Browser-Print-Dialog
- **Drag & Drop Import**: JSON-Dateien direkt in die App ziehen

## Tech Stack

- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **Tailwind CSS** für Styling
- **SVG + foreignObject** für Timeline-Visualisierung
- **localStorage** für Persistenz

## Installation

```bash
# Dependencies installieren
npm install

# Development-Server starten
npm run dev

# Production-Build erstellen
npm run build

# TypeScript-Check
npm run lint
```

## Entwicklung

Der Dev-Server läuft standardmäßig auf `http://localhost:5173`

```bash
npm run dev
```

## Projektstruktur

```
src/
├── components/          # React-Komponenten
│   ├── App.tsx         # Hauptkomponente
│   ├── Toolbar.tsx     # Navigation und Actions
│   ├── WorkPackageTree.tsx  # Sidebar mit AP/UAP-Liste
│   ├── SubPackageCard.tsx   # Moderne UAP-Card
│   ├── Timeline.tsx    # SVG Gantt-Chart
│   └── ToastContainer.tsx   # Benachrichtigungen
├── hooks/
│   └── useProject.ts   # Zentrale State-Management
├── utils/
│   ├── dateUtils.ts    # Datums-Funktionen
│   ├── devChecks.ts    # Validierung
│   └── pdfUtils.ts     # PDF-Export
├── types.ts            # TypeScript-Definitionen
├── index.css           # Global Styles
├── main.tsx            # Entry Point
└── vite-env.d.ts       # Vite Type Definitions

docs/                   # Umfassende Dokumentation
├── 01-Architecture.md  # System-Architektur
├── 02-DataModel.md     # Datenmodell
├── 03-Components.md    # Komponenten-Spezifikation
├── 04-Timeline.md      # Timeline-Implementation
├── 05-DesignSystem.md  # Design System
└── 06-StateManagement.md  # State-Management
```

## Verwendung

### Arbeitspaket hinzufügen
1. Klicke auf "AP hinzufügen" in der Toolbar
2. Bearbeite Titel durch Klick
3. Wähle Modus (Auto/Manuell)
4. Füge UAPs hinzu

### Unterarbeitspaket verwalten
1. Klicke auf "UAP hinzufügen" im AP
2. Bearbeite Details in der Card
3. Wähle Farbe über Drei-Punkt-Menü
4. Weise Personen zu (optional)

### Timeline-Interaktion
- **Verschieben**: UAP auf Timeline ziehen
- **Dauer ändern**: An Handles links/rechts ziehen
- **Zoom**: Woche/Monat/Quartal/Jahr wählen
- **Details**: Mit Maus über UAP hovern

### Meilensteine
1. Klicke auf "Meilenstein" in der Toolbar
2. Bearbeite Titel und Datum
3. Meilenstein wird als Diamant mit Linie angezeigt

### Export/Import
- **JSON Download**: Export → JSON Download
- **JSON kopieren**: Export → JSON kopieren
- **PDF Export**: Export → PDF Export (öffnet Print-Dialog)
- **Import**: Import-Button → JSON einfügen oder Datei wählen
- **Drag & Drop**: JSON-Datei direkt in App ziehen

## Auto-Rollup-Logik

Im **Auto-Modus** werden AP-Daten automatisch berechnet:
- Start = frühestes UAP-Start-Datum
- Ende = spätestes UAP-End-Datum
- Wechsel zu Auto-Modus erfolgt automatisch beim Hinzufügen von UAPs

Im **Manual-Modus**:
- Benutzer setzt Start/End-Datum manuell
- UAPs können unabhängig sein
- Optional: Clamping aktivieren (UAPs innerhalb AP-Grenzen halten)

## Design System

### Farben
- **Neutrals**: White, Surface, Border, Text
- **Semantic**: Success, Warning, Danger, Info
- **Accents**: Violet, Pink, Apricot mit Gradient

### Typography
- **Font**: Inter
- **Sizes**: 12px-24px
- **Weights**: 400, 500, 600

### Spacing
8-Point Grid: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px

### Border Radius
- xs: 6px, sm: 10px, md: 14px, lg: 18px, full: 9999px

## Browser-Kompatibilität

- Chrome (empfohlen)
- Firefox
- Safari
- Edge

**Hinweis**: SVG `foreignObject` wird für moderne Layouts verwendet - funktioniert nur in aktuellen Browsern.

## Lizenz

MIT

## Dokumentation

Siehe `/docs` für detaillierte technische Dokumentation:
- Architektur-Prinzipien
- Datenmodell-Spezifikationen
- Komponenten-Details
- Timeline-Implementierung
- Design System Guide
- State-Management Patterns
