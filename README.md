# Projekt Zeitplan

Eine leichtgewichtige, clientseitige Web-App zur Erstellung und Verwaltung dynamischer Projektzeitpläne mit Arbeitspaketen (AP), Unterarbeitspaketen (UAP) und Meilensteinen (MS).

## 🎯 Features

- **Dynamische Projektzeitpläne**: Erstellen Sie Arbeitspakete, Unterarbeitspakete und Meilensteine
- **Interaktive Timeline**: Drag & Drop und Resize-Funktionalität für UAPs
- **Auto-Rollup**: Arbeitspakete berechnen automatisch ihre Zeitspanne aus UAPs
- **Export/Import**: JSON-basierte Datenpersistenz mit Import/Export-Funktionen
- **PDF-Export**: Drucken oder Timeline als PDF exportieren (ohne externe Bibliotheken)
- **Responsive Zoom**: Woche, Monat oder Quartal-Ansicht
- **Lokale Persistenz**: Automatisches Speichern in localStorage
- **Keine Backend-Abhängigkeiten**: Rein clientseitig, ideal für GitHub Pages

## 🚀 Lokale Entwicklung

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn

### Installation und Start

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

### Build für Produktion

```bash
npm run build
```

Der Build-Output wird im `dist/` Verzeichnis erstellt.

### Lokale Vorschau des Production Builds

```bash
npm run preview
```

## 📦 Deployment auf GitHub Pages

### Schritt 1: Repository erstellen

1. Erstellen Sie ein neues GitHub Repository
2. Pushen Sie Ihren Code zum Repository

### Schritt 2: Base-Path konfigurieren

Öffnen Sie `vite.config.ts` und setzen Sie den `base` Pfad auf Ihren Repository-Namen:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/IHR-REPO-NAME/', // ⬅️ Hier Ihren Repository-Namen eintragen
})
```

### Schritt 3: GitHub Pages aktivieren

1. Gehen Sie zu Ihren Repository-Einstellungen
2. Navigieren Sie zu **Settings** → **Pages**
3. Warten Sie, bis der erste GitHub Actions Workflow durchgelaufen ist
4. Unter **Source** sollte automatisch `gh-pages` branch / `root` ausgewählt sein
5. Ihre App wird verfügbar sein unter: `https://IHR-USERNAME.github.io/IHR-REPO-NAME/`

### GitHub Actions Workflow

Der Workflow in `.github/workflows/deploy.yml` wird automatisch ausgeführt bei:
- Push auf den `main` Branch
- Manuellem Trigger über "Actions" → "Deploy to GitHub Pages" → "Run workflow"

Der Workflow:
1. Checkt den Code aus
2. Installiert Dependencies (`npm ci`)
3. Baut die App (`npm run build`)
4. Deployed den `dist/` Ordner nach GitHub Pages

## 🏗️ Projektstruktur

```
projekt-zeitplan/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions für Pages
├── src/
│   ├── components/
│   │   ├── Timeline.tsx        # SVG Timeline mit Drag/Resize
│   │   ├── Toolbar.tsx         # Toolbar mit Export/Import
│   │   ├── WorkPackageTree.tsx # Linke Baumliste
│   │   └── ToastContainer.tsx  # Toast-Benachrichtigungen
│   ├── hooks/
│   │   └── useProject.ts       # State Management Hook
│   ├── utils/
│   │   ├── dateUtils.ts        # Datums-Hilfsfunktionen
│   │   ├── pdfUtils.ts         # PDF-Generierung ohne Libs
│   │   └── devChecks.ts        # Development-Tests
│   ├── types.ts                # TypeScript Typen
│   ├── App.tsx                 # Hauptkomponente
│   ├── main.tsx                # Entry Point
│   └── index.css               # Tailwind + Custom Styles
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.cjs
└── README.md
```

## 📖 Verwendung

### Arbeitspakete (AP)

- **AP hinzufügen**: Klicken Sie auf "+ AP" in der Toolbar
- **AP bearbeiten**: Titel direkt in der linken Liste bearbeiten
- **Modus**:
  - `Manuell`: Start- und Enddatum sind editierbar
  - `Auto`: Wird automatisch gesetzt (wenn UAPs vorhanden)
- **UAP hinzufügen**: Klicken Sie auf "+ UAP hinzufügen" im AP

### Unterarbeitspakete (UAP)

- Werden innerhalb eines APs angezeigt
- Start und Ende sind immer editierbar
- **Drag & Drop**: UAP-Balken in der Timeline verschieben
- **Resize**: An den Kanten ziehen um Start/Ende zu ändern
- Wenn ein AP UAPs hat, wird das AP-Datum automatisch berechnet (Rollup)

### Meilensteine (MS)

- **MS hinzufügen**: Klicken Sie auf "+ Meilenstein" in der Toolbar
- Werden als Diamant-Symbol auf der Timeline angezeigt
- Mit gestrichelter vertikaler Linie

### Zoom-Stufen

- **Woche**: Ticks alle 1 Tag, Ansicht ~30 Tage
- **Monat**: Ticks alle 7 Tage, Ansicht ~90 Tage
- **Quartal**: Ticks alle 14 Tage, Ansicht ~180 Tage

### Export/Import

**JSON Export**:
- `📥 Export JSON`: Lädt eine JSON-Datei herunter
- `📋 Copy JSON`: Kopiert JSON in die Zwischenablage

**JSON Import**:
- `📤 Import Datei`: Wählen Sie eine JSON-Datei aus
- `📝 Import Text`: Fügen Sie JSON direkt ein
- **Drag & Drop**: Ziehen Sie eine JSON-Datei auf die Timeline

**PDF/PNG Export**:
- `🖨️ PDF (Drucken)`: Öffnet den Browser-Druckdialog (vektorisiertes PDF)
- `📄 PDF (Timeline)`: Exportiert nur die Timeline als PDF-Datei
- `🖼️ PNG`: Exportiert die Timeline als PNG-Bild

### Einstellungen

**UAPs in manuellen APs begrenzen**:
- Wenn aktiviert: UAPs können nicht außerhalb des AP-Zeitfensters verschoben/resized werden (nur bei manuellen APs)
- Wenn deaktiviert: UAPs können frei verschoben werden

## 🔬 Entwickler-Tests

Die App führt beim Start automatisch Dev-Checks aus (siehe Browser-Konsole):

1. ✅ Rollup-Berechnung (min/max von UAP-Daten)
2. ✅ AP-Datum Read-Only bei UAPs
3. ✅ `clampIso` gibt valides ISO-Datum zurück
4. ✅ Drag/Resize-Snapping auf ganze Tage
5. ✅ JSON Import/Export Roundtrip
6. ✅ PDF-Export erzeugt validen Blob

Bei erfolgreichen Tests sehen Sie: `✅ Dev-Tests OK`

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Vite** - Build Tool & Dev Server
- **Keine zusätzlichen Runtime-Dependencies** - Vanilla JS für PDF/Canvas/State

## 🌐 Browser-Support

- Chrome/Edge (empfohlen)
- Firefox
- Safari

Benötigt moderne Browser-Features:
- ES2020
- SVG
- Canvas API
- localStorage
- Clipboard API (für Copy-Funktion)

## 💾 Datenpersistenz

Alle Daten werden **ausschließlich im Browser** gespeichert:
- Automatisches Speichern in `localStorage`
- Kein Backend, keine Cloud
- Daten bleiben auf Ihrem Gerät
- **Wichtig**: Löschen Sie nicht die Browser-Daten, sonst gehen Projekte verloren
- **Empfehlung**: Regelmäßig JSON-Exports als Backup erstellen

## ⚠️ Bekannte Einschränkungen

1. **localStorage-Limit**: Browser haben typischerweise ein 5-10 MB Limit
2. **Keine Kollaboration**: Single-User, keine Echtzeit-Sync
3. **Browser-spezifisch**: Daten sind nicht zwischen Browsern/Geräten synchronisiert
4. **PDF-Qualität**: PDF-Timeline ist eine Raster-Konvertierung (JPEG), nicht vektorisiert
   - Für vektorisierte PDFs nutzen Sie "PDF (Drucken)"
5. **Keine Undo/Redo**: Änderungen sind sofort persistent

## 🐛 Troubleshooting

**App lädt nicht auf GitHub Pages**:
- Prüfen Sie, ob der `base` in `vite.config.ts` korrekt gesetzt ist
- Prüfen Sie GitHub Actions Logs auf Build-Fehler
- Stellen Sie sicher, dass GitHub Pages aktiviert ist (Settings → Pages)

**Build schlägt fehl**:
```bash
# Cache löschen und neu installieren
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Daten verloren**:
- Prüfen Sie localStorage (Browser DevTools → Application → Local Storage)
- Stellen Sie ein JSON-Backup wieder her (falls vorhanden)

**Timeline rendert nicht**:
- Prüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass mindestens ein AP existiert

## 📄 Lizenz

MIT - Frei verwendbar für private und kommerzielle Projekte.

## 🤝 Beiträge

Pull Requests sind willkommen! Für größere Änderungen öffnen Sie bitte zuerst ein Issue.

---

**Viel Erfolg mit Ihren Projektzeitplänen! 🚀**
