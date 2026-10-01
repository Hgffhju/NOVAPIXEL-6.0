import React from 'react';
import { X, Image as ImageIcon, Sparkles, FolderOpen, ArrowRight } from 'lucide-react';
import { SAMPLE_PROJECTS, SampleProject } from '../engine/sampleProjects';

interface TemplatesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (id: string) => void;
}

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4">
      <div className="w-[680px] max-h-[85vh] bg-[#1a1e28] border border-[#2d3549] rounded-lg shadow-2xl p-4 flex flex-col gap-4 text-xs text-[#c2cbd9] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-2.5">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-blue-400" />
            <span className="font-semibold text-white text-sm">Professional Project Templates & Verification Docs</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#272e40] text-[#7f8a9e]">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {SAMPLE_PROJECTS.map((proj) => (
            <div
              key={proj.id}
              onClick={() => {
                onSelectProject(proj.id);
                onClose();
              }}
              className="p-3 rounded-lg border border-[#262c3e] bg-[#141620] hover:bg-[#1e2332] hover:border-blue-500/80 cursor-pointer transition-all flex gap-3 group"
            >
              {/* Thumbnail or Badge */}
              <div className="w-28 h-20 rounded bg-[#1c202d] border border-[#2c3448] overflow-hidden shrink-0 flex items-center justify-center relative">
                {proj.imageSrc ? (
                  <img
                    src={proj.imageSrc}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center text-[#707c93]">
                    <ImageIcon size={20} className="text-blue-400 mb-1" />
                    <span className="text-[9px] font-mono leading-tight">PSD Template</span>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/70 text-white px-1 rounded">
                  {proj.width}×{proj.height}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                      {proj.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50">
                      {proj.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8692a8] mt-0.5">{proj.subtitle}</div>
                  <p className="text-[11px] text-[#b0bbcd] mt-1 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#202534] mt-2">
                  <div className="flex items-center gap-1">
                    {proj.suggestedTools.map((tool) => (
                      <span
                        key={tool}
                        className="text-[9px] font-mono uppercase px-1 rounded bg-[#202534] text-[#828ea3]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                  <span className="text-blue-400 text-xs flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform">
                    <span>Open Template</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
