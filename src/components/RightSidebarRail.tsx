import React from 'react';
import {
  Info,
  Type,
  AlignLeft,
  Paintbrush,
  Code2,
  Image as ImageIcon,
  Sparkles,
  Users,
  History,
  Palette,
  Sliders,
} from 'lucide-react';

export type RightRailTab =
  | 'layers'
  | 'history'
  | 'swatches'
  | 'character'
  | 'properties'
  | 'brush-settings'
  | 'css'
  | 'templates'
  | 'ai'
  | 'collab';

interface RightSidebarRailProps {
  activeTab: RightRailTab;
  onSelectTab: (tab: RightRailTab) => void;
}

export const RightSidebarRail: React.FC<RightSidebarRailProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs: Array<{ id: RightRailTab; label: string; icon: React.ReactNode }> = [
    { id: 'character', label: 'Character & Typography (Tt)', icon: <Type size={15} /> },
    { id: 'properties', label: 'Info & Document Properties', icon: <Info size={15} /> },
    { id: 'brush-settings', label: 'Brush Settings', icon: <Paintbrush size={15} /> },
    { id: 'css', label: 'CSS Code Inspector', icon: <Code2 size={15} /> },
    { id: 'templates', label: 'Templates & Sample Projects', icon: <ImageIcon size={15} /> },
    { id: 'ai', label: 'AI Generative Studio', icon: <Sparkles size={15} className="text-blue-400" /> },
    { id: 'collab', label: 'Real-Time Team Collab', icon: <Users size={15} className="text-emerald-400" /> },
  ];

  return (
    <div className="w-10 bg-[#14161f] border-r border-[#242938] flex flex-col items-center py-2 gap-1 z-10 shrink-0 select-none">
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            title={t.label}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8490a6] hover:bg-[#202534] hover:text-white'
            }`}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
};
