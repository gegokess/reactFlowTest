# Projekt Zeitplan - Dokumentation

Eine moderne React-Anwendung zur Verwaltung von Arbeitspaketen, Unterarbeitspaketen und Meilensteinen mit interaktivem Gantt-Chart.

## 📚 Dokumentations-Übersicht

### Für neue Entwickler - Start hier:

1. **[01-Architecture.md](./01-Architecture.md)** - **START HIER**
   - Systemarchitektur und Projektstruktur
   - Technologie-Stack
   - Datenfluss und Komponenten-Hierarchie
   - Grundlegende Konzepte (AP, UAP, Meilensteine)

2. **[02-DataModel.md](./02-DataModel.md)**
   - Alle TypeScript-Interfaces und Typen
   - Datenvalidierung und Regeln
   - Auto-Rollup-Logik
   - Beispiel-Daten und Migration

3. **[03-Components.md](./03-Components.md)**
   - Detaillierte Komponentendokumentation
   - Props und APIs
   - Interaktions-Flows
   - Best Practices

### Für spezifische Features:

4. **[04-Timeline.md](./04-Timeline.md)**
   - SVG-basierte Gantt-Chart-Implementierung
   - Koordinatensystem und Rendering
   - Drag & Drop, Resize
   - Performance-Optimierungen

5. **[05-DesignSystem.md](./05-DesignSystem.md)**
   - Farbpalette und Typografie
   - Komponenten-Design-Spezifikationen
   - Moderne Card-Designs
   - Animationen und Accessibility

6. **[06-StateManagement.md](./06-StateManagement.md)**
   - useProject Hook (zentrale State-Verwaltung)
   - CRUD-Operationen
   - Persistence (localStorage)
   - Toast-System und Export/Import

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### TypeScript Check
```bash
npx tsc --noEmit
```

## 📁 Projekt-Struktur

```
reactFlowTest/
├── src/
│   ├── components/          # React-Komponenten
│   │   ├── Timeline.tsx     # Gantt-Chart (SVG)
│   │   ├── WorkPackageTree.tsx  # Linke Seitenleiste
│   │   ├── SubPackageCard.tsx   # Moderne UAP-Cards
│   │   ├── Toolbar.tsx      # Top-Navigation
│   │   └── ToastContainer.tsx   # Benachrichtigungen
│   ├── hooks/
│   │   └── useProject.ts    # Zentrale State-Verwaltung
│   ├── utils/
│   │   ├── dateUtils.ts     # Datum-Hilfsfunktionen
│   │   └── devChecks.ts     # Entwicklungs-Checks
│   ├── types.ts             # TypeScript-Typdefinitionen
│   ├── App.tsx              # Haupt-App-Komponente
│   └── main.tsx             # Einstiegspunkt
├── docs/                    # Diese Dokumentation
└── public/                  # Statische Assets
```

## 🎯 Kern-Features

### 1. Moderne UAP-Cards
- **Farbiger vertikaler Balken** (7 wählbare Farben)
- **Kategorie** unter dem Titel
- **Avatar-System** für zugewiesene Personen
- **Drei-Punkte-Menü** für alle Aktionen

### 2. Interaktive Timeline
- **Drag & Drop**: UAPs verschieben
- **Resize**: Dauer mit Handles ändern
- **Zoom-Level**: Tag, Woche, Monat, Quartal
- **Tooltips**: Details bei Hover

### 3. Auto-Rollup
- AP-Zeiträume automatisch aus UAPs berechnen
- Zwei Modi: Manual (fest) oder Auto (berechnet)

### 4. Persistence
- Automatisches Speichern in localStorage
- Export/Import als JSON
- PDF-Export (via Print)

## 🔧 Technologie-Stack

- **React 18** - UI-Framework
- **TypeScript** - Type Safety
- **Vite** - Build-Tool
- **Tailwind CSS** - Styling
- **SVG** - Gantt-Chart-Visualisierung

## 📖 Wichtige Konzepte

### Arbeitspaket (AP)
Container für UAPs mit zwei Modi:
- **Manual**: Benutzer legt Zeitraum fest
- **Auto**: Berechnet aus UAPs (Rollup)

### Unterarbeitspaket (UAP)
Konkrete Aufgaben mit:
- Start/End-Datum
- Titel und Kategorie
- Farbe (anpassbar)
- Zugewiesene Personen

### Meilensteine
Einzelne Ereignisse (ohne Dauer) mit Diamond-Icon.

## 🎨 Design-Highlights

### Farbpalette
```typescript
const DEFAULT_COLORS = [
  '#3B82F6',  // Blue
  '#10B981',  // Green
  '#F59E0B',  // Amber
  '#EF4444',  // Red
  '#8B5CF6',  // Purple
  '#EC4899',  // Pink
  '#06B6D4',  // Cyan
];
```

### Typografie
- **Schriftart**: Inter (optimiert für Screens)
- **Größen**: 8px (Avatare) bis 16px (Haupttitel)
- **Gewicht**: 400 (normal) bis 600 (semibold)

## 🔄 Datenfluss

```
User-Aktion
    ↓
Komponente (Event)
    ↓
useProject Hook
    ↓
State Update (immutable)
    ↓
Auto-Rollup (bei UAP-Änderungen)
    ↓
localStorage Persistence
    ↓
Re-Render (Timeline + Sidebar)
```

## 🐛 Debugging

### State anzeigen
```typescript
useEffect(() => {
  console.log('Current Project:', project);
}, [project]);
```

### localStorage löschen
```javascript
localStorage.removeItem('projekt-zeitplan');
```

### TypeScript-Fehler prüfen
```bash
npx tsc --noEmit
```

## 📝 Best Practices

### 1. Neue Features hinzufügen
1. **Datenmodell erweitern** in `types.ts`
2. **CRUD-Logik** in `useProject.ts`
3. **UI-Komponente** erstellen
4. **Timeline** bei Bedarf anpassen

### 2. State-Updates
Immer **immutable**:
```typescript
// ✅ Gut
setProject(prev => ({ ...prev, name: 'New' }));

// ❌ Schlecht
project.name = 'New';
setProject(project);
```

### 3. Props
- Prefix `on` für Callbacks: `onUpdate`, `onClick`
- `Partial<T>` für flexible Updates
- Typisierung für alle Props

## 🚨 Häufige Probleme

### Problem: Timeline rendert nicht
**Lösung**: Prüfe `viewStart` und `dateToX`-Berechnungen

### Problem: Drag & Drop funktioniert nicht
**Lösung**:
- `dragState` im State?
- Event-Listener registriert?
- `handleMouseMove` wird aufgerufen?

### Problem: Auto-Rollup aktualisiert nicht
**Lösung**: `rollupWorkPackageDates()` nach UAP-Update aufrufen

### Problem: foreignObject zeigt nichts
**Lösung**: Namespace prüfen und inline-styles verwenden

## 📚 Weiterführende Ressourcen

- **React Docs**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **SVG**: https://developer.mozilla.org/en-US/docs/Web/SVG

## 🤝 Beitragen

### Code-Style
- **Prettier** für Formatting
- **ESLint** für Linting
- **TypeScript strict mode**

### Commit-Messages
```
feat: Neue Feature-Beschreibung
fix: Bug-Fix-Beschreibung
docs: Dokumentations-Update
refactor: Code-Refactoring
style: Styling-Änderungen
```

## 📄 Lizenz

(Lizenz hier einfügen)

---

## 🗺️ Roadmap (zukünftige Features)

- [ ] Undo/Redo-Funktionalität
- [ ] Mehrere Projekte verwalten
- [ ] Kollaborations-Features (Echtzeit)
- [ ] Dark Mode
- [ ] Drag & Drop zwischen APs
- [ ] Abhängigkeiten zwischen UAPs
- [ ] Fortschritts-Tracking (%)
- [ ] Kommentare/Notizen
- [ ] Datei-Uploads
- [ ] Team-Management
- [ ] Benachrichtigungen
- [ ] Mobile App

---

**Version**: 1.0
**Letztes Update**: 2025-01-10
**Maintainer**: [Name hier einfügen]
