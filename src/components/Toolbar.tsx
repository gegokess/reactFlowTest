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
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap no-print">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Zoom:</label>
          <div className="flex gap-1">
            <button
              onClick={() => onZoomChange('week')}
              className={`px-3 py-1 text-sm rounded ${
                zoomLevel === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Woche
            </button>
            <button
              onClick={() => onZoomChange('month')}
              className={`px-3 py-1 text-sm rounded ${
                zoomLevel === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monat
            </button>
            <button
              onClick={() => onZoomChange('quarter')}
              className={`px-3 py-1 text-sm rounded ${
                zoomLevel === 'quarter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quartal
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* Add Controls */}
        <button onClick={onAddWorkPackage} className="btn-sm btn-primary">
          + AP
        </button>
        <button onClick={onAddMilestone} className="btn-sm btn-primary">
          + Meilenstein
        </button>

        <div className="w-px h-8 bg-gray-300" />

        {/* Export/Import */}
        <div className="flex gap-2">
          <button onClick={onExportJson} className="btn-sm btn-secondary">
            📥 Export JSON
          </button>
          <button onClick={onCopyJson} className="btn-sm btn-secondary">
            📋 Copy JSON
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-sm btn-secondary">
            📤 Import Datei
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-sm btn-secondary">
            📝 Import Text
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* PDF/PNG Export */}
        <div className="flex gap-2">
          <button onClick={onExportPdf} className="btn-sm btn-success">
            🖨️ PDF (Drucken)
          </button>
          <button onClick={handlePdfTimelineExport} className="btn-sm btn-success">
            📄 PDF (Timeline)
          </button>
          <button onClick={handlePngExport} className="btn-sm btn-success">
            🖼️ PNG
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">JSON importieren</h2>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="input w-full h-64 font-mono text-sm"
              placeholder="JSON hier einfügen..."
            />
            <div className="flex gap-3 mt-4">
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
