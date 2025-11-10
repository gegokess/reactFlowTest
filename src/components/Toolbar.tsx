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
      <div className="bg-white border-b border-gray-100 no-print px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Breadcrumb Navigation */}
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span className="text-gray-500 hover:text-gray-700 cursor-pointer font-medium">{projectName}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">Timeline</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Add Buttons */}
            <button onClick={onAddWorkPackage} className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              + Arbeitspaket
            </button>
            <button onClick={onAddMilestone} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              + Meilenstein
            </button>

            {/* More Actions */}
            <button onClick={onExportJson} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>

            {/* Share Button */}
            <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>
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
