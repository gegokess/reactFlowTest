/**
 * App Component
 * Hauptkomponente mit Layout-Orchestrierung
 * Basierend auf docs/03-Components.md
 */

import React, { useState, useEffect } from 'react';
import { useProject } from './hooks/useProject';
import type { ZoomLevel } from './types';
import Toolbar from './components/Toolbar';
import WorkPackageTree from './components/WorkPackageTree';
import Timeline from './components/Timeline';
import ToastContainer from './components/ToastContainer';
import { exportTimelineToPDF, exportTimelineToPNG, initPDFExport, cleanupPDFExport } from './utils/pdfUtils';

const App: React.FC = () => {
  const {
    project,
    toasts,
    showToast,
    removeToast,
    updateProjectName,
    updateProjectDates,
    addWorkPackage,
    updateWorkPackage,
    deleteWorkPackage,
    addSubPackage,
    updateSubPackage,
    deleteSubPackage,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    exportToFile,
    copyToClipboard,
    importFromJSON,
  } = useProject();

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // PDF Export initialisieren
  useEffect(() => {
    initPDFExport();
    return () => cleanupPDFExport();
  }, []);

  // Drag & Drop für JSON-Import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          importFromJSON(text);
        }
      };
      reader.readAsText(file);
    } else {
      showToast('error', 'Bitte eine gültige JSON-Datei hochladen');
    }
  };

  return (
    <div
      className="flex flex-col h-screen bg-bg"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <Toolbar
        projectName={project.name}
        projectStart={project.start}
        projectEnd={project.end}
        zoomLevel={zoomLevel}
        onProjectNameChange={updateProjectName}
        onProjectDatesChange={updateProjectDates}
        onZoomChange={setZoomLevel}
        onAddWorkPackage={addWorkPackage}
        onAddMilestone={addMilestone}
        onExportJSON={exportToFile}
        onCopyJSON={copyToClipboard}
        onExportPDF={exportTimelineToPDF}
        onExportPNG={async () => {
          try {
            await exportTimelineToPNG();
            showToast('success', 'Timeline als PNG exportiert');
          } catch (error) {
            showToast('error', 'Fehler beim PNG-Export');
          }
        }}
        onImportJSON={importFromJSON}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* WorkPackage Tree Sidebar */}
        <WorkPackageTree
          workPackages={project.workPackages}
          milestones={project.milestones}
          onUpdateWorkPackage={updateWorkPackage}
          onDeleteWorkPackage={deleteWorkPackage}
          onAddSubPackage={addSubPackage}
          onUpdateSubPackage={updateSubPackage}
          onDeleteSubPackage={deleteSubPackage}
          onUpdateMilestone={updateMilestone}
          onDeleteMilestone={deleteMilestone}
        />

        {/* Timeline */}
        <Timeline
          workPackages={project.workPackages}
          milestones={project.milestones}
          zoomLevel={zoomLevel}
          clampingEnabled={project.settings.clampUapInsideManualAp}
          projectStart={project.start}
          projectEnd={project.end}
          onUpdateSubPackage={updateSubPackage}
          onUpdateMilestone={updateMilestone}
        />
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 bg-info bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-dashed border-info">
            <svg className="w-16 h-16 mx-auto mb-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-info">JSON-Datei hier ablegen</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
