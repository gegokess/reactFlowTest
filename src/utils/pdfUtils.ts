/**
 * PDF Export Utilities
 * Funktionen für den PDF-Export über Print-Dialog
 */

/**
 * Öffnet den Print-Dialog für PDF-Export
 * Die Anwendung sollte bereits print-friendly Styles haben (@media print)
 */
export function exportToPDF(): void {
  window.print();
}

/**
 * Bereitet die Seite für den PDF-Export vor
 * Kann verwendet werden, um vor dem Drucken bestimmte Elemente zu verstecken/anzeigen
 */
export function preparePrintView(): void {
  // Füge eine Print-Klasse zum body hinzu
  document.body.classList.add('print-mode');
}

/**
 * Stellt die normale Ansicht nach dem Drucken wieder her
 */
export function restoreNormalView(): void {
  document.body.classList.remove('print-mode');
}

/**
 * Exportiert die Timeline als PDF
 * Nutzt den Browser's Print-Dialog mit optimierten Print-Styles
 */
export function exportTimelineToPDF(): void {
  // Bereite die Ansicht vor
  preparePrintView();

  // Kleine Verzögerung, damit die Styles angewendet werden können
  setTimeout(() => {
    window.print();

    // Stelle die normale Ansicht nach dem Drucken wieder her
    // (wird ausgeführt, wenn der Print-Dialog geschlossen wird)
    setTimeout(() => {
      restoreNormalView();
    }, 100);
  }, 100);
}

/**
 * Generiert Print-Styles für optimierten PDF-Export
 * Diese Funktion gibt einen CSS-String zurück, der in ein <style>-Tag eingefügt werden kann
 */
export function getPrintStyles(): string {
  return `
    @media print {
      /* Verstecke nicht-druckbare Elemente */
      .no-print,
      button,
      .toolbar-actions,
      .three-dot-menu {
        display: none !important;
      }

      /* Optimiere Layout für Druck */
      body {
        margin: 0;
        padding: 20px;
        background: white;
      }

      /* Timeline optimieren */
      .timeline-container {
        page-break-inside: avoid;
        width: 100%;
        overflow: visible;
      }

      /* Farben für Druck optimieren */
      svg text {
        fill: black !important;
      }

      /* Entferne Schatten für bessere Druckqualität */
      * {
        box-shadow: none !important;
      }

      /* Optimiere Schriftgröße */
      body {
        font-size: 10pt;
      }

      /* Seitenumbrüche kontrollieren */
      .work-package-tree,
      .timeline-row {
        page-break-inside: avoid;
      }
    }

    @page {
      size: A4 landscape;
      margin: 1cm;
    }
  `;
}

/**
 * Fügt Print-Styles dynamisch zum Document hinzu
 */
export function injectPrintStyles(): void {
  const styleId = 'print-styles';

  // Prüfe, ob die Styles bereits existieren
  if (document.getElementById(styleId)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = getPrintStyles();
  document.head.appendChild(styleElement);
}

/**
 * Initialisiert PDF-Export-Funktionalität
 * Sollte beim App-Start aufgerufen werden
 */
export function initPDFExport(): void {
  injectPrintStyles();

  // Event-Listener für beforeprint und afterprint
  window.addEventListener('beforeprint', preparePrintView);
  window.addEventListener('afterprint', restoreNormalView);
}

/**
 * Cleanup-Funktion für PDF-Export
 * Sollte beim App-Unmount aufgerufen werden
 */
export function cleanupPDFExport(): void {
  window.removeEventListener('beforeprint', preparePrintView);
  window.removeEventListener('afterprint', restoreNormalView);
}

/**
 * Exportiert die Timeline als PNG
 * Nutzt html-to-image library
 */
export async function exportTimelineToPNG(): Promise<void> {
  try {
    // Dynamischer Import von html-to-image
    const { toPng } = await import('html-to-image');

    // Finde das SVG-Element
    const svgElement = document.getElementById('gantt-chart-svg');
    if (!svgElement) {
      throw new Error('Timeline SVG nicht gefunden');
    }

    // Konvertiere zu PNG
    const dataUrl = await toPng(svgElement, {
      quality: 1.0,
      pixelRatio: 2, // Höhere Auflösung
      backgroundColor: '#ffffff',
    });

    // Download-Link erstellen
    const link = document.createElement('a');
    link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Fehler beim PNG-Export:', error);
    throw error;
  }
}
