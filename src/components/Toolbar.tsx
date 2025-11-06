import { useRef, useState } from 'react';
import { ZoomLevel } from '../types';
import { generatePdfFromSvg, generatePngFromSvg } from '../utils/pdfUtils';

interface ToolbarProps {
  projectName: string;
  zoomLevel: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onAddWorkPackage: () => void;
  onAddMilestone: () => void;
  onExportJson: () => void;
  onCopyJson: () => void;
  onImportJson: (json: string) => void;
  onExportPdf: () => void;
}

export function Toolbar({
  projectName,
  zoomLevel,
  onZoomChange,
  onAddWorkPackage,
  onAddMilestone,
  onExportJson,
  onCopyJson,
  onImportJson,
  onExportPdf,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      onImportJson(text);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextImport = () => {
    onImportJson(importText);
    setImportText('');
    setShowImportModal(false);
  };

  const handlePdfTimelineExport = async () => {
    const svgElement = document.querySelector('[data-timeline-svg="true"]') as SVGSVGElement;
    if (!svgElement) return;
    try {
      await generatePdfFromSvg(svgElement, `${projectName}-timeline.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
      alert('PDF-Export fehlgeschlagen');
    }
  };

  const handlePngExport = async () => {
    const svgElement = document.querySelector('[data-timeline-svg="true"]') as SVGSVGElement;
    if (!svgElement) return;
    try {
      await generatePngFromSvg(svgElement, `${projectName}-timeline.png`);
    } catch (error) {
      console.error('PNG export failed', error);
      alert('PNG-Export fehlgeschlagen');
    }
  };

  return (
    <>
      <div className="bg-white/95 backdrop-blur-xl border-b border-[#d1d1d6]/30 px-6 py-4 flex items-center gap-4 flex-wrap no-print shadow-soft">
        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Ansicht</label>
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
            <button
              onClick={() => onZoomChange('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                zoomLevel === 'week'
                  ? 'bg-white text-primary-700 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Woche
            </button>
            <button
              onClick={() => onZoomChange('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                zoomLevel === 'month'
                  ? 'bg-white text-primary-700 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monat
            </button>
            <button
              onClick={() => onZoomChange('quarter')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                zoomLevel === 'quarter'
                  ? 'bg-white text-primary-700 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quartal
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* Add Controls */}
        <div className="flex gap-2">
          <button onClick={onAddWorkPackage} className="btn-sm btn-primary">
            + Arbeitspaket
          </button>
          <button onClick={onAddMilestone} className="btn-sm btn-secondary">
            + Meilenstein
          </button>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* Export/Import */}
        <div className="flex gap-2">
          <button onClick={onExportJson} className="btn-sm btn-secondary">
            Export JSON
          </button>
          <button onClick={onCopyJson} className="btn-sm btn-secondary">
            Kopieren
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-sm btn-secondary">
            Import Datei
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-sm btn-secondary">
            Import Text
          </button>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* PDF/PNG Export */}
        <div className="flex gap-2">
          <button onClick={onExportPdf} className="btn-sm btn-success">
            PDF (Drucken)
          </button>
          <button onClick={handlePdfTimelineExport} className="btn-sm btn-success">
            PDF Timeline
          </button>
          <button onClick={handlePngExport} className="btn-sm btn-success">
            PNG
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Import Text Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-strong">
            <h2 className="text-2xl font-semibold mb-6">JSON importieren</h2>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="input w-full h-64 font-mono text-sm"
              placeholder="JSON hier einfügen..."
            />
            <div className="flex gap-3 mt-6">
              <button onClick={handleTextImport} className="btn-primary">
                Importieren
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
