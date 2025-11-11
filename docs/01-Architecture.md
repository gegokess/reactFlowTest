# Projekt Zeitplan - Systemarchitektur

## Übersicht

Projekt Zeitplan ist eine moderne React-Anwendung zur Verwaltung von Arbeitspaketen, Unterarbeitspaketen und Meilensteinen in einer interaktiven Gantt-Chart-Ansicht.

## Technologie-Stack

- **Framework**: React 18 mit TypeScript
- **Build-Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)
- **Visualisierung**: SVG mit foreignObject für moderne Card-Designs

## Architektur-Prinzipien

### 1. Komponentenbasierte Architektur
- **Modulare Komponenten**: Jede Komponente hat eine klar definierte Verantwortung
- **Props-basierte Kommunikation**: Parent → Child über Props, Child → Parent über Callbacks
- **Keine tief verschachtelten Props**: Maximale Verschachtelungstiefe: 2-3 Ebenen

### 2. Unidirektionaler Datenfluss
```
useProject Hook (Single Source of Truth)
        ↓
      App.tsx
        ↓
   ┌────┴────┐
   ↓         ↓
Toolbar  WorkPackageTree / Timeline
   ↓         ↓
Actions  Display + User Interactions
   ↓         ↓
useProject Hook (State Updates)
```

### 3. State Management
- **Zentral**: `useProject` Hook verwaltet den gesamten Projektstatus
- **Lokal**: UI-spezifischer State (z.B. expandierte Elemente, Tooltips) bleibt in Komponenten
- **Persistence**: localStorage für automatisches Speichern

### 4. Type Safety
- Vollständige TypeScript-Typisierung
- Strikte Typen für alle Props und State
- Interfaces für komplexe Datenstrukturen

## Schlüsselkonzepte

### 1. Arbeitspakete (AP / Work Packages)
- Container für Unterarbeitspakete
- Zwei Modi:
  - **Manual**: Benutzer legt Start/End-Daten fest
  - **Auto**: Automatische Berechnung aus UAPs (Rollup)

### 2. Unterarbeitspakete (UAP / Sub Packages)
- Konkrete Aufgaben mit Start-/End-Datum
- Moderne Card-Designs mit:
  - Farbigem Balken
  - Kategorie
  - Zugewiesenen Personen (Avatare)

### 3. Meilensteine (Milestones)
- Einzelne Ereignisse ohne Dauer
- Diamond-Icon im Timeline
- Vertikale Markierung im Gantt-Chart

### 4. Auto-Rollup
Wenn ein AP UAPs enthält:
- Start = frühestes UAP-Start-Datum
- End = spätestes UAP-End-Datum
- Modus wechselt automatisch zu "Auto"

## Rendering-Pipeline

### Timeline (SVG-basiert)
1. **Berechnung**:
   - Zeitachse basierend auf Zoom-Level
   - Y-Positionen für jedes AP (dynamisch nach UAP-Anzahl)
   - X-Positionen aus Datumswerten

2. **Rendering**:
   - Header mit Zeitachse
   - AP-Container (graue Boxen)
   - UAP-Cards (moderne weiße Cards mit foreignObject)
   - Meilenstein-Marker (Diamonds)
   - Interaktive Layer (Drag-Handles, Tooltips)

3. **Interaktivität**:
   - Drag: Verschieben von UAPs
   - Resize: Ändern der Dauer über Handles
   - Hover: Tooltips mit Details

## Performance-Überlegungen

- **SVG statt Canvas**: Bessere Zugänglichkeit und einfachere Interaktivität
- **foreignObject**: Ermöglicht HTML/CSS in SVG für moderne Card-Designs
- **Lokaler State**: UI-State bleibt in Komponenten, vermeidet unnötige Re-Renders

### Best Practices
- Typen zuerst definieren
- Single Responsibility Principle beachten
- Props explizit dokumentieren
- Callbacks für Aktionen verwenden
