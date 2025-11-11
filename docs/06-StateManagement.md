# State Management und Hooks

## Übersicht

Das Projekt verwendet einen **zentralisierten State** über den `useProject` Hook, kombiniert mit **lokalem UI-State** in einzelnen Komponenten.

## useProject Hook

### Verantwortlichkeiten
- Zentrale Projektverwaltung (Single Source of Truth)
- CRUD-Operationen für WorkPackages, SubPackages, Milestones
- Auto-Rollup-Logik für AP-Zeiträume
- Persistierung in localStorage
- Export/Import-Funktionalität

### Hook-Struktur

```typescript
export function useProject() {
  // 1. State
  const [project, setProject] = useState<Project>(() => loadFromStorage());
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 2. Persistence
  useEffect(() => {
    saveToStorage(project);
  }, [project]);

  // 3. CRUD-Operationen
  const addWorkPackage = () => { ... };
  const updateWorkPackage = (id: string, updates: Partial<WorkPackage>) => { ... };
  const deleteWorkPackage = (id: string) => { ... };
  // ... mehr Operationen

  // 4. Export
  return {
    project,
    updateProject,
    addWorkPackage,
    updateWorkPackage,
    deleteWorkPackage,
    // ... alle Operationen
    toasts,
    addToast,
    removeToast,
  };
}
```

## State-Operationen

### 1. WorkPackage CRUD

#### Create (Add)
```typescript
const addWorkPackage = () => {
  const newAp: WorkPackage = {
    id: `ap-${Date.now()}`,
    title: 'Neues Arbeitspaket',
    start: toIso(new Date()),
    end: toIso(addDays(new Date(), 30)),
    mode: 'manual',
    subPackages: [],
  };

  setProject(prev => ({
    ...prev,
    workPackages: [...prev.workPackages, newAp],
  }));
};
```

#### Update
```typescript
const updateWorkPackage = (id: string, updates: Partial<WorkPackage>) => {
  setProject(prev => ({
    ...prev,
    workPackages: prev.workPackages.map(wp =>
      wp.id === id ? { ...wp, ...updates } : wp
    ),
  }));
};
```

**Wichtig**: Auto-Rollup nach jedem Update prüfen!

#### Delete
```typescript
const deleteWorkPackage = (id: string) => {
  setProject(prev => ({
    ...prev,
    workPackages: prev.workPackages.filter(wp => wp.id !== id),
  }));

  addToast('Arbeitspaket gelöscht', 'success');
};
```

### 2. SubPackage CRUD

#### Add (zu bestehendem AP)
```typescript
const addSubPackage = (apId: string) => {
  const ap = project.workPackages.find(w => w.id === apId);
  if (!ap) return;

  const newUap: SubPackage = {
    id: `uap-${Date.now()}`,
    title: 'Neues Unterarbeitspaket',
    start: ap.start,
    end: ap.end,
    category: undefined,
    color: undefined,
    assignedTo: [],
  };

  setProject(prev => ({
    ...prev,
    workPackages: prev.workPackages.map(wp =>
      wp.id === apId
        ? { ...wp, subPackages: [...wp.subPackages, newUap] }
        : wp
    ),
  }));

  // Trigger Auto-Rollup
  rollupWorkPackageDates(apId);
};
```

#### Update
```typescript
const updateSubPackage = (
  apId: string,
  uapId: string,
  updates: Partial<SubPackage>
) => {
  setProject(prev => ({
    ...prev,
    workPackages: prev.workPackages.map(wp =>
      wp.id === apId
        ? {
            ...wp,
            subPackages: wp.subPackages.map(uap =>
              uap.id === uapId ? { ...uap, ...updates } : uap
            ),
          }
        : wp
    ),
  }));

  // Wichtig: Nach jedem Update Auto-Rollup prüfen
  if (updates.start || updates.end) {
    rollupWorkPackageDates(apId);
  }
};
```

#### Delete
```typescript
const deleteSubPackage = (apId: string, uapId: string) => {
  setProject(prev => ({
    ...prev,
    workPackages: prev.workPackages.map(wp =>
      wp.id === apId
        ? {
            ...wp,
            subPackages: wp.subPackages.filter(uap => uap.id !== uapId),
          }
        : wp
    ),
  }));

  rollupWorkPackageDates(apId);
  addToast('Unterarbeitspaket gelöscht', 'success');
};
```

### 3. Auto-Rollup-Logik

**Trigger**: Nach jedem UAP-Update (Add, Update, Delete)

```typescript
const rollupWorkPackageDates = (apId: string) => {
  setProject(prev => {
    const ap = prev.workPackages.find(w => w.id === apId);
    if (!ap || ap.subPackages.length === 0) return prev;

    // Berechne neuen Zeitraum
    const starts = ap.subPackages.map(uap => parseIso(uap.start));
    const ends = ap.subPackages.map(uap => parseIso(uap.end));

    const minStart = new Date(Math.min(...starts.map(d => d.getTime())));
    const maxEnd = new Date(Math.max(...ends.map(d => d.getTime())));

    return {
      ...prev,
      workPackages: prev.workPackages.map(wp =>
        wp.id === apId
          ? {
              ...wp,
              start: toIso(minStart),
              end: toIso(maxEnd),
              mode: 'auto',  // Automatisch auf Auto umstellen
            }
          : wp
      ),
    };
  });
};
```

**Edge Cases**:
- Wenn alle UAPs gelöscht → Modus bleibt Auto, aber Benutzer kann wieder Manual setzen
- Wenn UAP-Daten ungültig → Validierung vorher

### 4. Milestone CRUD

```typescript
const addMilestone = () => {
  const newMs: Milestone = {
    id: `ms-${Date.now()}`,
    title: 'Neuer Meilenstein',
    date: toIso(new Date()),
  };

  setProject(prev => ({
    ...prev,
    milestones: [...prev.milestones, newMs],
  }));
};

const updateMilestone = (id: string, updates: Partial<Milestone>) => {
  setProject(prev => ({
    ...prev,
    milestones: prev.milestones.map(ms =>
      ms.id === id ? { ...ms, ...updates } : ms
    ),
  }));
};

const deleteMilestone = (id: string) => {
  setProject(prev => ({
    ...prev,
    milestones: prev.milestones.filter(ms => ms.id !== id),
  }));
};
```

## Persistence (localStorage)

### Save
```typescript
const STORAGE_KEY = 'projekt-zeitplan';

const saveToStorage = (project: Project) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Automatisch bei jedem State-Update
useEffect(() => {
  saveToStorage(project);
}, [project]);
```

### Load
```typescript
const loadFromStorage = (): Project => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }

  // Fallback: Default-Projekt
  return createDefaultProject();
};
```

### Default-Projekt
```typescript
const createDefaultProject = (): Project => ({
  id: `proj-${Date.now()}`,
  name: 'Mein Projekt',
  description: '',
  settings: {
    clampUapInsideManualAp: false,
  },
  workPackages: [],
  milestones: [],
});
```

## Toast-System

### Add Toast
```typescript
const addToast = (message: string, type: 'success' | 'error' | 'info') => {
  const toast: Toast = {
    id: `toast-${Date.now()}`,
    message,
    type,
  };

  setToasts(prev => [...prev, toast]);

  // Auto-Remove nach 3 Sekunden
  setTimeout(() => {
    removeToast(toast.id);
  }, 3000);
};
```

### Remove Toast
```typescript
const removeToast = (id: string) => {
  setToasts(prev => prev.filter(t => t.id !== id));
};
```

### Verwendung
```typescript
// Erfolg
addToast('Gespeichert!', 'success');

// Fehler
addToast('Speichern fehlgeschlagen', 'error');

// Info
addToast('JSON in Zwischenablage kopiert', 'info');
```

## Export/Import

### Export
```typescript
const exportToJson = (): string => {
  return JSON.stringify(project, null, 2);
};
```

### Import
```typescript
const importFromJson = (json: string) => {
  try {
    const imported = JSON.parse(json);

    // Validierung
    if (!imported.id || !imported.name) {
      throw new Error('Invalid project structure');
    }

    setProject(imported);
    addToast('Projekt importiert', 'success');
  } catch (error) {
    addToast('Import fehlgeschlagen', 'error');
    console.error(error);
  }
};
```

## Lokaler UI-State

### WorkPackageTree
```typescript
// Expanded/Collapsed State für APs
const [expandedAps, setExpandedAps] = useState<Set<string>>(
  new Set(workPackages.map(wp => wp.id))
);

const toggleExpand = (id: string) => {
  setExpandedAps(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};
```

### SubPackageCard
```typescript
// Menü-Sichtbarkeit
const [showMenu, setShowMenu] = useState(false);

// Editing-Modi
const [isEditingCategory, setIsEditingCategory] = useState(false);
const [isEditingAssignees, setIsEditingAssignees] = useState(false);

// Temporäre Input-Werte
const [newAssignee, setNewAssignee] = useState('');
```

### Timeline
```typescript
// Drag & Drop State
const [dragState, setDragState] = useState<{
  type: 'move' | 'resize-left' | 'resize-right';
  apId: string;
  uapId: string;
  initialX: number;
  initialStart: string;
  initialEnd: string;
} | null>(null);

// Tooltip State
const [tooltip, setTooltip] = useState<{
  x: number;
  y: number;
  content: string;
} | null>(null);
```

## State-Update-Patterns

### 1. Immutability
**Immer** neue Objekte/Arrays erstellen:

```typescript
// ✅ Gut
setProject(prev => ({
  ...prev,
  workPackages: prev.workPackages.map(wp => /* ... */)
}));

// ❌ Schlecht
setProject(prev => {
  prev.workPackages[0].title = 'New Title';
  return prev;
});
```

### 2. Nested Updates
Bei verschachtelten Strukturen:

```typescript
setProject(prev => ({
  ...prev,
  workPackages: prev.workPackages.map(wp =>
    wp.id === apId
      ? {
          ...wp,
          subPackages: wp.subPackages.map(uap =>
            uap.id === uapId
              ? { ...uap, ...updates }
              : uap
          )
        }
      : wp
  )
}));
```

### 3. Partial Updates
Verwende `Partial<T>` für flexible Updates:

```typescript
type UpdateFn<T> = (id: string, updates: Partial<T>) => void;

const update: UpdateFn<SubPackage> = (id, updates) => {
  // Nur die übergebenen Felder werden aktualisiert
};

// Verwendung
update(uapId, { color: '#FF0000' });
update(uapId, { title: 'New', category: 'Dev' });
```

## Performance-Optimierungen

### 1. useMemo für teure Berechnungen
```typescript
const sortedWorkPackages = useMemo(
  () => workPackages.sort((a, b) => a.start.localeCompare(b.start)),
  [workPackages]
);
```

### 2. useCallback für Event-Handler
```typescript
const handleUpdate = useCallback(
  (id: string, updates: Partial<SubPackage>) => {
    updateSubPackage(apId, id, updates);
  },
  [apId, updateSubPackage]
);
```

### 3. State-Splitting
Nicht alles im useProject Hook:

```typescript
// ✅ Gut: UI-State lokal
const [showMenu, setShowMenu] = useState(false);

// ❌ Schlecht: UI-State im globalen State
project.ui.showMenus[cardId] = true;
```

## Debugging

### State-Logging
```typescript
useEffect(() => {
  console.log('Project State:', project);
}, [project]);
```

### Redux DevTools (optional)
```typescript
// Mit useReducer + Redux DevTools Extension
const [project, dispatch] = useReducer(
  projectReducer,
  initialState,
  // @ts-ignore
  window.__REDUX_DEVTOOLS_EXTENSION__?.()
);
```

### State-Snapshots
```typescript
const saveSnapshot = () => {
  const snapshot = JSON.stringify(project);
  sessionStorage.setItem('snapshot', snapshot);
};

const loadSnapshot = () => {
  const snapshot = sessionStorage.getItem('snapshot');
  if (snapshot) setProject(JSON.parse(snapshot));
};
```

## Best Practices

1. **Single Source of Truth**: Projekt-Daten nur in useProject
2. **Immutability**: Immer neue Objekte/Arrays erstellen
3. **Lokaler UI-State**: Menüs, Tooltips, etc. nicht im globalen State
4. **Validierung**: Vor jedem State-Update validieren
5. **Auto-Rollup**: Nach jedem UAP-Update prüfen
6. **Toasts**: Bei allen Erfolgs-/Fehler-Aktionen
7. **Error-Handling**: try/catch bei Import/Export
8. **Type Safety**: Partial<T> für flexible Updates
