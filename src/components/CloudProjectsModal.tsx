import React, { useState, useEffect } from 'react';
import { X, Cloud, FolderOpen, Trash2, Clock, Layers, Sparkles, Plus } from 'lucide-react';
import { fetchCloudProjects, deleteProjectFromFirestore, CloudProject } from '../services/firebaseSync';

interface CloudProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (project: CloudProject) => void;
  onNewDocument: () => void;
}

export const CloudProjectsModal: React.FC<CloudProjectsModalProps> = ({
  isOpen,
  onClose,
  onOpenProject,
  onNewDocument,
}) => {
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCloudProjects()
        .then((list) => setProjects(list))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteProjectFromFirestore(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4">
      <div className="w-[560px] max-w-full bg-[#181b24] border border-[#2d354a] rounded-xl shadow-2xl p-5 flex flex-col gap-4 text-xs text-[#c2cbd9]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262c3e] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cloud size={15} />
            </div>
            <div>
              <span className="font-semibold text-white text-sm">Cloud Firestore Projects</span>
              <div className="text-[10px] text-[#717b90] font-mono">
                Region: europe-west2 · Database: Active
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[#252b3c] text-[#7d879c] hover:text-white">
            <X size={15} />
          </button>
        </div>

        {/* Project List */}
        <div className="flex-1 max-h-[380px] overflow-y-auto flex flex-col gap-2 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#79849a]">
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Fetching cloud projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#79849a] text-center">
              <FolderOpen size={28} className="text-[#3b4356]" />
              <span className="text-[#a4aebd]">No cloud projects saved yet.</span>
              <p className="text-[11px] text-[#6d778d] max-w-xs">
                Save your current artwork via <b>File &gt; Save to Cloud Firestore</b> or start a new project.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNewDocument();
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  onOpenProject(proj);
                  onClose();
                }}
                className="p-3 rounded-lg bg-[#1e222e] border border-[#272e40] hover:border-blue-500/80 hover:bg-[#222736] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-[#12141a] border border-[#2c3448] flex items-center justify-center text-blue-400 font-bold shrink-0">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs truncate group-hover:text-blue-300 transition-colors">
                      {proj.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#717b90] font-mono mt-0.5">
                      <span>{proj.width} × {proj.height} px</span>
                      <span>·</span>
                      <span className="text-blue-400">{proj.bitDepth}-bit {proj.colorProfile}</span>
                      <span>·</span>
                      <span>{proj.layersCount} layers</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#6b758b] font-mono hidden sm:inline">
                    {new Date(proj.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, proj.id)}
                    title="Delete from Cloud"
                    className="p-1.5 rounded hover:bg-red-500/20 text-[#6d778d] hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#262c3e] pt-3 text-[11px]">
          <span className="text-[#6d778d]">
            Projects are saved to Google Cloud Firestore with real-time sync.
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#222736] hover:bg-[#2b3346] text-[#c2cbd9] font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
