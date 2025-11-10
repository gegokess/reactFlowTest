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
    <div className="h-screen flex flex-col bg-[#FAFBFC]">
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
      <div className="flex-1 flex overflow-hidden px-6 py-6 gap-6">
        {/* Left Sidebar: Work Package Tree */}
        <div className="w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col no-print">
          <div className="px-5 py-5 border-b border-gray-100 bg-white">
            <input
              type="text"
              value={project.name}
              onChange={e => updateProject({ name: e.target.value })}
              className="w-full font-semibold text-base border-0 px-0 py-1 focus:ring-0 bg-transparent text-gray-900 placeholder:text-gray-400"
              placeholder="Projektname"
            />
            {project.description !== undefined && (
              <textarea
                value={project.description}
                onChange={e => updateProject({ description: e.target.value })}
                className="w-full mt-2 text-xs resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                placeholder="Beschreibung (optional)"
                rows={2}
              />
            )}
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
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
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <label htmlFor="clampUap" className="text-xs text-gray-600 font-medium">
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
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-full-width">
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
