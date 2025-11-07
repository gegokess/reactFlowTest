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
    <div className="h-screen flex flex-col bg-gradient-to-br from-sand-50 via-sand-200 to-sand-300">
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
      <div className="flex-1 flex overflow-hidden gap-8 p-8">
        {/* Left Panel: Work Package Tree */}
        <div className="w-[440px] bg-white rounded-3xl shadow-strong border-2 border-deepsea-200/40 overflow-hidden flex flex-col no-print">
          <div className="p-8 border-b-2 border-deepsea-100/60 bg-gradient-to-br from-deepsea-50/50 via-sand-100/30 to-transparent">
            <input
              type="text"
              value={project.name}
              onChange={e => updateProject({ name: e.target.value })}
              className="input w-full font-bold text-2xl border-0 px-0 focus:ring-0 bg-transparent text-mirage-600"
              placeholder="Projektname"
            />
            {project.description !== undefined && (
              <textarea
                value={project.description}
                onChange={e => updateProject({ description: e.target.value })}
                className="input w-full mt-5 text-sm resize-none border-deepsea-200 focus:border-deepsea-400"
                placeholder="Beschreibung (optional)"
                rows={2}
              />
            )}
            <div className="mt-6 flex items-center gap-3 p-4 bg-sand-100 rounded-xl border border-deepsea-100/30">
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
                className="rounded text-deepsea-500 focus:ring-deepsea-400 w-5 h-5"
              />
              <label htmlFor="clampUap" className="text-sm text-mirage-500 font-medium">
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
        <div className="flex-1 bg-white rounded-3xl shadow-strong border-2 border-blaze-200/40 overflow-hidden print-full-width">
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
