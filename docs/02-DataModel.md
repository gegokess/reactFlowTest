# Datenmodell und Typen

## Übersicht

Das Datenmodell folgt einer hierarchischen Struktur: Projekt → Arbeitspakete → Unterarbeitspakete

## Kern-Datenstrukturen

### 1. SubPackage (UAP - Unterarbeitspaket)

Repräsentiert eine konkrete Aufgabe mit definierten Start- und End-Daten.

```typescript
interface SubPackage {
  id: string;              // Eindeutige ID (UUID)
  title: string;           // Aufgabenname
  start: string;           // Start-Datum (ISO: YYYY-MM-DD)
  end: string;             // End-Datum (ISO: YYYY-MM-DD)
  color?: string;          // Optional: Farbe für linken Balken (Hex: #3B82F6)
}
```

**Wichtige Eigenschaften**:
- `start` und `end` müssen immer gültige ISO-Datumsstrings sein
- `color` sollte ein Hex-Code oder CSS-Farbe sein

**Beispiel**:
```json
{
  "id": "uap-001",
  "title": "Sales deck - iteration ver. 1",
  "start": "2025-01-15",
  "end": "2025-01-30",
  "color": "#212121ff",
}
```

### 2. WorkPackage (AP - Arbeitspaket)

Container für mehrere Unterarbeitspakete mit automatischer oder manueller Zeitplanung.

```typescript
interface WorkPackage {
  id: string;                    // Eindeutige ID
  title: string;                 // Paketname
  start: string;                 // Start-Datum (ISO)
  end: string;                   // End-Datum (ISO)
  mode: 'auto' | 'manual';       // Zeitplanungs-Modus
  subPackages: SubPackage[];     // Array von UAPs
}
```

**Modi-Logik**:

**Manual-Modus**:
- Benutzer legt `start` und `end` manuell fest
- UAPs können unabhängig platziert werden
- Optional: Clamping aktivieren (UAPs innerhalb AP-Grenzen)

**Auto-Modus**:
- Start = MIN(alle UAP.start)
- End = MAX(alle UAP.end)
- Wird automatisch aktiviert, sobald UAPs existieren
- `start` und `end` sind read-only (berechnet)

**Beispiel (Auto)**:
```json
{
  "id": "ap-001",
  "title": "Marketing Campaign Q1",
  "start": "2025-01-15",  // Auto-berechnet
  "end": "2025-03-31",    // Auto-berechnet
  "mode": "auto",
  "subPackages": [
    { "id": "uap-001", "start": "2025-01-15", "end": "2025-01-30", ... },
    { "id": "uap-002", "start": "2025-02-01", "end": "2025-03-31", ... }
  ]
}
```

### 3. Milestone (Meilenstein)

Einzelnes Ereignis ohne Dauer.

```typescript
interface Milestone {
  id: string;        // Eindeutige ID
  title: string;     // Meilenstein-Name
  date: string;      // Datum (ISO: YYYY-MM-DD)
}
```

**Beispiel**:
```json
{
  "id": "ms-001",
  "title": "Product Launch",
  "date": "2025-06-15"
}
```

### 4. Project (Projekt)

Wurzel-Objekt, das alle Daten enthält.

```typescript
interface Project {
  id: string;                          // Projekt-ID
  name: string;                        // Projektname
  description?: string;                // Optional: Beschreibung
  settings: ProjectSettings;           // Projekt-Einstellungen
  workPackages: WorkPackage[];         // Array von APs
  milestones: Milestone[];             // Array von Meilensteinen
}

interface ProjectSettings {
  clampUapInsideManualAp: boolean;    // UAPs in manuellen APs begrenzen
}
```

**Beispiel**:
```json
{
  "id": "proj-001",
  "name": "Website Relaunch 2025",
  "description": "Kompletter Relaunch der Unternehmenswebsite",
  "settings": {
    "clampUapInsideManualAp": true
  },
  "workPackages": [...],
  "milestones": [...]
}
```

## Hilfsdatentypen

### ZoomLevel
```typescript
type ZoomLevel = 'week' | 'month' | 'quarter' | 'year';
```
Bestimmt die Zeitachsen-Granularität in der Timeline.

### Toast
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
```
Für Benachrichtigungen im UI.

## Daten-Validierung

### Wichtige Regeln

1. **Datumsformat**: Immer (YYYY-MM-DD)
   ```typescript
   // Korrekt
   "2025-01-15"

   // Falsch
   "15.01.2025"
   "01/15/2025"
   ```

2. **Start vor End**: `start` muss immer ≤ `end` sein
   ```typescript
   if (start > end) {
     // Fehler oder automatische Korrektur
   }
   ```

3. **Auto-Rollup**: Bei APs mit UAPs
   ```typescript
   if (workPackage.subPackages.length > 0) {
     workPackage.mode = 'auto';
     workPackage.start = min(subPackages.map(s => s.start));
     workPackage.end = max(subPackages.map(s => s.end));
   }
   ```

4. **Clamping**: Wenn aktiviert und AP im Manual-Modus
   ```typescript
   if (settings.clampUapInsideManualAp && workPackage.mode === 'manual') {
     uap.start = max(uap.start, workPackage.start);
     uap.end = min(uap.end, workPackage.end);
   }
   ```


## Best Practices

### 1. Immutability
```typescript
// Gut: Neues Objekt erstellen
const updated = { ...uap, title: "Neuer Titel" };

// Schlecht: Direkte Mutation
uap.title = "Neuer Titel";
```

### 2. Type Guards
```typescript
function isWorkPackage(item: any): item is WorkPackage {
  return item &&
         typeof item.id === 'string' &&
         typeof item.title === 'string' &&
         Array.isArray(item.subPackages);
}
```

### 3. Partial Updates
```typescript
// Erlaubt partielle Updates ohne alle Felder
type UpdateSubPackage = (
  apId: string,
  uapId: string,
  updates: Partial<SubPackage>
) => void;

// Verwendung
updateSubPackage(apId, uapId, { color: "#FF0000" });
```

### 4. ID-Generierung
```typescript
// Konsistente ID-Struktur
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const apId = generateId('ap');   // "ap-1736457600000-k3j2h4i"
const uapId = generateId('uap'); // "uap-1736457600001-m8n3k1j"
```

## Daten-Export/Import

### JSON-Format
```json
{
  "version": "1.0",
  "project": {
    "id": "proj-001",
    "name": "Mein Projekt",
    "settings": {...},
    "workPackages": [...],
    "milestones": [...]
  }
}
```

### Kompatibilität
- Neue optionale Felder werden ignoriert von alten Versionen
- Required Felder dürfen nicht entfernt werden
- Version-Feld für Migration-Logic
