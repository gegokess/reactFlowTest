# Design System

Modernes, minimalistisches Design-System basierend auf dem aktuellen Interface-Design.
Alle Token/Code-Namen auf Englisch, Dokumentation auf Deutsch.

---

## Farbpalette

### Neutrals

Die Basis-Farbpalette für Hintergründe, Borders und Text.

```css
:root {
  /* Backgrounds */
  --color-bg: #FFFFFF;           /* Haupthintergrund */
  --color-surface: #F6F7F9;      /* Cards, erhöhte Flächen */

  /* Borders & Lines */
  --color-border: #E9ECF1;       /* Card-Borders, Dividers */
  --color-line: #EEF1F5;         /* Timeline-Grid, feine Linien */

  /* Text */
  --color-text: #1E2430;         /* Haupttext */
  --color-text-muted: #6B7280;   /* Sekundärer Text, Labels */
}
```

### Semantic Colors

Farben für Status, Feedback und wichtige UI-Elemente.

```css
:root {
  --color-success: #38C77A;      /* Erfolg, Abgeschlossen */
  --color-warning: #FF8A3D;      /* Warnung, Wichtig */
  --color-danger: #F05252;       /* Fehler, Löschen */
  --color-info: #4C6EF5;         /* Info, Links, Timeline */
}
```

### Accent Colors & Gradients

Für Highlights, aktive Elemente und moderne Akzente.

```css
:root {
  --color-accent-1: #8A7CF6;     /* Violett */
  --color-accent-2: #EA7AF6;     /* Pink */
  --color-accent-3: #FDB36A;     /* Apricot */

  /* Gradient für Timeline-Pills und Highlights */
  --gradient-accent: linear-gradient(90deg, #8A7CF6 0%, #EA7AF6 55%, #FDB36A 100%);
}
```

### Verwendung

```typescript
// Timeline Pill mit Gradient
<div style={{ background: 'var(--gradient-accent)' }}>
  {content}
</div>

// Status-Streifen
<div style={{ borderLeft: '3px solid var(--color-success)' }}>
  Completed Task
</div>

// Semantic Buttons
<button style={{ background: 'var(--color-info)' }}>
  Speichern
</button>
```

---

## Typografie

### Font Family

```css
:root {
  --font-primary: Inter, system-ui, -apple-system, BlinkMacSystemFont,
                  'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
```

**Warum Inter?**
- Optimiert für digitale Interfaces
- Ausgezeichnete Lesbarkeit bei kleinen Größen
- Moderne, professionelle Ästhetik
- Variable Font unterstützt (falls gewünscht)

### Font Sizes

```css
:root {
  --text-xs: 12px;     /* Captions, kleine Labels */
  --text-sm: 14px;     /* Body-Text, normale Labels */
  --text-base: 16px;   /* Größerer Body-Text */
  --text-lg: 18px;     /* Sub-Headings */
  --text-xl: 20px;     /* H2 */
  --text-2xl: 24px;    /* H1 */
}
```

### Font Weights

```css
:root {
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
}
```

### Typografie-Anwendungen

```css
/* H1 - Hauptüberschriften */
.h1 {
  font-size: var(--text-2xl);    /* 24px */
  font-weight: var(--font-semibold);
  line-height: 1.2;
  color: var(--color-text);
}

/* H2 - Sektionsüberschriften */
.h2 {
  font-size: var(--text-xl);     /* 20px */
  font-weight: var(--font-semibold);
  line-height: 1.2;
  color: var(--color-text);
}

/* Title/Label - UI-Elemente */
.title {
  font-size: var(--text-sm);     /* 14px */
  font-weight: var(--font-semibold);
  line-height: 1.3;
  color: var(--color-text);
}

/* Body - Standard-Text */
.body {
  font-size: var(--text-base);   /* 16px */
  font-weight: var(--font-normal);
  line-height: 1.5;
  color: var(--color-text);
}

/* Body Small */
.body-sm {
  font-size: var(--text-sm);     /* 14px */
  font-weight: var(--font-normal);
  line-height: 1.45;
  color: var(--color-text);
}

/* Caption - Kleinster Text */
.caption {
  font-size: var(--text-xs);     /* 12px */
  font-weight: var(--font-normal);
  line-height: 1.4;
  color: var(--color-text-muted);
}
```

---

## Spacing

8-Punkt-Grid-System für konsistente Abstände.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

### Anwendungsrichtlinien

```typescript
// Card Padding
padding: 'var(--space-4)'        // 16px - Standard
padding: 'var(--space-3)'        // 12px - Kompakt

// Gaps zwischen Elementen
gap: 'var(--space-2)'            // 8px - Eng
gap: 'var(--space-3)'            // 12px - Normal
gap: 'var(--space-4)'            // 16px - Großzügig

// Margins
margin: 'var(--space-6)'         // 24px - Sektionen
margin: 'var(--space-8)'         // 32px - Große Abstände
```

---

## Border Radius

```css
:root {
  --radius-xs: 6px;    /* Kleine Elemente, Inputs */
  --radius-sm: 10px;   /* Buttons, kleine Cards */
  --radius-md: 14px;   /* Standard-Cards */
  --radius-lg: 18px;   /* Große Cards, Container */
  --radius-full: 9999px; /* Pills, Avatare */
}
```

### Verwendung

```typescript
// Cards
borderRadius: 'var(--radius-md)'     // 14px

// Timeline Pills
borderRadius: 'var(--radius-full)'   // Vollständig rund

// Buttons
borderRadius: 'var(--radius-sm)'     // 10px

// Avatare
borderRadius: 'var(--radius-full)'   // Kreis
```

---

## Shadows

Sehr subtile Schatten für moderne, flat Ästhetik.

```css
:root {
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-md: 0 6px 24px rgba(16, 24, 40, 0.06);
  --shadow-lg: 0 12px 40px rgba(16, 24, 40, 0.08);
}
```

### Anwendung

```typescript
// Standard Card
boxShadow: 'var(--shadow-sm)'

// Elevated Card (Hover)
boxShadow: 'var(--shadow-md)'

// Modals, Dropdowns
boxShadow: 'var(--shadow-lg)'
```

---

## Komponenten

### 1. Card

Standard-Card mit subtiler Elevation.

```tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-4)',
    }}>
      {children}
    </div>
  );
}
```

**Mit Status-Streifen:**

```tsx
export function TaskCard({ status, children }: {
  status: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}) {
  const colors = {
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    info: 'var(--color-info)',
  };

  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderLeft: `3px solid ${colors[status]}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-4)',
    }}>
      {children}
    </div>
  );
}
```

### 2. Timeline Pill (Highlight)

Moderne Pill-Form mit Gradient für Timeline-Elemente.

```tsx
export function TimelinePill({
  title,
  avatars
}: {
  title: string;
  avatars?: string[];
}) {
  return (
    <div style={{
      background: 'var(--gradient-accent)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: 'var(--radius-full)',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
    }}>
      <span style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
      }}>
        {title}
      </span>

      {avatars && avatars.length > 0 && (
        <div style={{ display: 'flex', marginLeft: '8px' }}>
          {avatars.slice(0, 3).map((name, i) => (
            <Avatar key={i} name={name} overlap={i > 0} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Buttons

#### Primary Button

```tsx
export function ButtonPrimary({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--color-info)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {children}
    </button>
  );
}
```

#### Secondary Button

```tsx
export function ButtonSecondary({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        padding: '8px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-text-muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      {children}
    </button>
  );
}
```

### 4. Input Fields

```tsx
export function Input({
  value,
  onChange,
  placeholder
}: InputProps) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 12px',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text)',
        outline: 'none',
        transition: 'all 150ms ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-info)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76, 110, 245, 0.1)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}
```

### 5. Sidebar Navigation Item

```tsx
export function NavItem({
  label,
  active,
  icon
}: NavItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: '8px 12px',
      borderRadius: 'var(--radius-sm)',
      background: active ? 'var(--color-surface)' : 'transparent',
      borderLeft: active ? '2px solid var(--color-info)' : '2px solid transparent',
      color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
      fontWeight: active ? 'var(--font-medium)' : 'var(--font-normal)',
      fontSize: 'var(--text-sm)',
      cursor: 'pointer',
      transition: 'all 150ms ease',
    }}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  );
}
```

### 6. Tags/Chips

```tsx
export function Tag({
  label,
  variant = 'info'
}: TagProps) {
  const variants = {
    success: { bg: 'rgba(56, 199, 122, 0.1)', color: 'var(--color-success)' },
    warning: { bg: 'rgba(255, 138, 61, 0.1)', color: 'var(--color-warning)' },
    danger: { bg: 'rgba(240, 82, 82, 0.1)', color: 'var(--color-danger)' },
    info: { bg: 'rgba(76, 110, 245, 0.1)', color: 'var(--color-info)' },
  };

  const style = variants[variant];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: 'var(--radius-full)',
      background: style.bg,
      color: style.color,
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-medium)',
    }}>
      {label}
    </span>
  );
}
```

### 7. Avatar

```tsx
export function Avatar({
  name,
  size = 32,
  overlap = false
}: AvatarProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColor = (name: string) => {
    const colors = ['#8A7CF6', '#EA7AF6', '#4C6EF5', '#38C77A', '#FF8A3D'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: 'var(--radius-full)',
      background: getColor(name),
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size < 24 ? 'var(--text-xs)' : 'var(--text-sm)',
      fontWeight: 'var(--font-semibold)',
      border: '2px solid white',
      marginLeft: overlap ? '-8px' : '0',
    }}>
      {getInitials(name)}
    </div>
  );
}
```

---

## Layout-Prinzipien

1. **Viel Weißraum**: Großzügige Abstände zwischen Elementen
2. **Subtile Elevation**: Schatten sehr dezent einsetzen
3. **Klare Hierarchie**: Typografie und Spacing für visuelle Ordnung
4. **Farbige Akzente sparsam**: Nur für wichtige UI-Elemente
5. **Konsistente Borders**: `--color-border` für alle Trennlinien

---

## Accessibility

### Kontrast-Verhältnisse

- **Text auf Weiß**: Mindestens **4.5:1** (WCAG AA)
  - `--color-text` (#1E2430): ✅ 12.6:1
  - `--color-text-muted` (#6B7280): ✅ 4.6:1

- **Buttons auf Gradient**: White text mit Shadow für Lesbarkeit

### Focus States

Alle interaktiven Elemente benötigen sichtbare Focus-States:

```css
:focus-visible {
  outline: 2px solid var(--color-info);
  outline-offset: 2px;
  opacity: 0.3;
}
```

### ARIA-Labels

```tsx
<button aria-label="Löschen" title="Löschen">
  <TrashIcon />
</button>
```

---

## Tailwind CSS Integration

### tailwind.config.js

```javascript
export default {
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        surface: '#F6F7F9',
        border: '#E9ECF1',
        line: '#EEF1F5',
        text: '#1E2430',
        muted: '#6B7280',
        success: '#38C77A',
        warning: '#FF8A3D',
        danger: '#F05252',
        info: '#4C6EF5',
        'accent-1': '#8A7CF6',
        'accent-2': '#EA7AF6',
        'accent-3': '#FDB36A',
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '18px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16, 24, 40, 0.05)',
        md: '0 6px 24px rgba(16, 24, 40, 0.06)',
        lg: '0 12px 40px rgba(16, 24, 40, 0.08)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(90deg, #8A7CF6 0%, #EA7AF6 55%, #FDB36A 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### Verwendung mit Tailwind

```tsx
// Card
<div className="bg-surface border border-border shadow-sm rounded-md p-4">
  {children}
</div>

// Timeline Pill
<div className="bg-accent-gradient text-white px-4 py-2 rounded-full shadow-md">
  {title}
</div>

// Button
<button className="bg-info text-white px-4 py-2 rounded-sm shadow-sm hover:shadow-md">
  Speichern
</button>
```

---

## Dark Mode (Vorbereitung)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0F1419;
    --color-surface: #1A1F2E;
    --color-border: #2D3748;
    --color-line: #374151;
    --color-text: #F9FAFB;
    --color-text-muted: #9CA3AF;
  }
}
```

---

## Figma-Styles (Kurzreferenz)

- **Color Styles**: Alle CSS-Variablen als Figma-Farben
- **Text Styles**: H1-H2, Title, Body, Body-Sm, Caption
- **Effect Styles**: shadow-sm, shadow-md, shadow-lg
- **Corner Radius**: 6, 10, 14, 18
- **Grid**: 8pt Baseline Grid

---

**Version**: 2.0
**Letztes Update**: 2025-01-10
