import { useState, useEffect } from 'react';
import { ZoomLevel } from './types';
import { useProject } from './hooks/useProject';
import { Toolbar } from './components/Toolbar';
import { WorkPackageTree } from './components/WorkPackageTree';
import { Timeline } from './components/Timeline';
import { ToastContainer } from './components/ToastContainer';
import { runDevChecks } from './utils/devChecks';

function App() {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');

  const {
    project,
    updateProject,
    addWorkPackage,
    updateWorkPackage,
    deleteWorkPackage,
    addSubPackage,
    updateSubPackage,
    deleteSubPackage,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    exportToJson,
    importFromJson,
    toasts,
    addToast,
    removeToast,
  } = useProject();

  // Run dev checks on mount
  useEffect(() => {
    runDevChecks();
  }, []);

  // Export handlers
  const handleExportJson = () => {
    const json = exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('JSON exportiert', 'success');
  };

  const handleCopyJson = async () => {
    const json = exportToJson();
    try {
      await navigator.clipboard.writeText(json);
      addToast('JSON in Zwischenablage kopiert', 'success');
    } catch (error) {
      addToast('Kopieren fehlgeschlagen', 'error');
    }
  };

  const handleImportJson = (json: string) => {
    importFromJson(json);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleImportJson(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <Toolbar
        projectName={project.name}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onAddWorkPackage={addWorkPackage}
        onAddMilestone={addMilestone}
        onExportJson={handleExportJson}
        onCopyJson={handleCopyJson}
        onImportJson={handleImportJson}
        onExportPdf={handleExportPdf}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Left Panel: Work Package Tree */}
        <div className="w-96 bg-white rounded-2xl shadow-soft overflow-hidden flex flex-col no-print">
          <div className="p-6 border-b border-gray-100">
            <input
              type="text"
              value={project.name}
              onChange={e => updateProject({ name: e.target.value })}
              className="input w-full font-semibold text-lg border-0 px-0 focus:ring-0 bg-transparent"
              placeholder="Projektname"
            />
            {project.description !== undefined && (
              <textarea
                value={project.description}
                onChange={e => updateProject({ description: e.target.value })}
                className="input w-full mt-3 text-sm resize-none"
                placeholder="Beschreibung (optional)"
                rows={2}
              />
            )}
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="clampUap"
                checked={project.settings.clampUapInsideManualAp}
                onChange={e =>
                  updateProject({
                    settings: {
                      ...project.settings,
                      clampUapInsideManualAp: e.target.checked,
                    },
                  })
                }
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="clampUap" className="text-sm text-gray-600">
                UAPs in manuellen APs begrenzen
              </label>
            </div>
          </div>

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
        </div>

        {/* Right Panel: Timeline */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft overflow-hidden print-full-width">
          <Timeline
            workPackages={project.workPackages}
            milestones={project.milestones}
            zoomLevel={zoomLevel}
            clampUapInsideManualAp={project.settings.clampUapInsideManualAp}
            onUpdateSubPackage={updateSubPackage}
            onDrop={handleDrop}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
