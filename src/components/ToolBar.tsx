import React from 'react';
import {
  Move,
  Square,
  Circle,
  Lasso,
  Wand2,
  Crop,
  Pipette,
  Bandage,
  Paintbrush,
  Stamp,
  Eraser,
  Blend,
  PenTool,
  Type,
  Shapes,
  Hand,
  Search,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolBarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  foregroundColor: string;
  backgroundColor: string;
  onOpenColorPicker: (isForeground: boolean) => void;
  onSwapColors: () => void;
  onResetColors: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  currentTool,
  onSelectTool,
  foregroundColor,
  backgroundColor,
  onOpenColorPicker,
  onSwapColors,
  onResetColors,
}) => {
  const tools: Array<{ id: ToolType; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'move', label: 'Move Tool', icon: <Move size={16} />, shortcut: 'V' },
    { id: 'marquee-rect', label: 'Rectangular Marquee', icon: <Square size={16} />, shortcut: 'M' },
    { id: 'lasso', label: 'Lasso Selection', icon: <Lasso size={16} />, shortcut: 'L' },
    { id: 'magic-wand', label: 'AI Magic Wand & Color Range', icon: <Wand2 size={16} />, shortcut: 'W' },
    { id: 'crop', label: 'Crop & Straighten Tool', icon: <Crop size={16} />, shortcut: 'C' },
    { id: 'eyedropper', label: 'Eyedropper & Color Loupe', icon: <Pipette size={16} />, shortcut: 'I' },
    { id: 'heal', label: 'Poisson Healing Brush', icon: <Bandage size={16} />, shortcut: 'J' },
    { id: 'spot', label: 'Spot Healing Tool', icon: <Sparkles size={16} />, shortcut: 'K' },
    { id: 'brush', label: 'Paintbrush Tool', icon: <Paintbrush size={16} />, shortcut: 'B' },
    { id: 'clone', label: 'Clone Stamp Tool', icon: <Stamp size={16} />, shortcut: 'S' },
    { id: 'eraser', label: 'Eraser Tool', icon: <Eraser size={16} />, shortcut: 'E' },
    { id: 'gradient', label: 'Gradient Fill Tool', icon: <Blend size={16} />, shortcut: 'G' },
    { id: 'pen', label: 'Vector Pen Tool', icon: <PenTool size={16} />, shortcut: 'P' },
    { id: 'text', label: 'Horizontal Type Tool', icon: <Type size={16} />, shortcut: 'T' },
    { id: 'shape-rect', label: 'Vector Shapes', icon: <Shapes size={16} />, shortcut: 'U' },
    { id: 'hand', label: 'Hand Tool (Pan Canvas)', icon: <Hand size={16} />, shortcut: 'H' },
    { id: 'zoom', label: 'Zoom Tool', icon: <Search size={16} />, shortcut: 'Z' },
  ];

  return (
    <aside className="w-11 bg-[#181a22] border-r border-[#242938] flex flex-col items-center py-2 z-20 shrink-0 select-none">
      <div className="flex flex-col gap-1 w-full px-1">
        {tools.map((t) => {
          const isActive = currentTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              title={`${t.label} (${t.shortcut})`}
              className={`relative w-8 h-8 rounded flex items-center justify-center transition-colors mx-auto ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#9ca6ba] hover:bg-[#232838] hover:text-white'
              }`}
            >
              {t.icon}
              <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono opacity-50">
                {t.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Color Swatch & Switcher */}
      <div className="flex flex-col items-center gap-1.5 py-3 border-t border-[#242938] w-full">
        {/* Reset colors to black/white */}
        <button
          onClick={onResetColors}
          title="Default Colors (D)"
          className="text-[9px] font-mono text-[#7b869d] hover:text-white p-0.5"
        >
          [D]
        </button>

        <div className="relative w-7 h-7">
          {/* Background color chip */}
          <button
            onClick={() => onOpenColorPicker(false)}
            title="Set Background Color"
            className="absolute bottom-0 right-0 w-4 h-4 rounded border border-[#3b4358] shadow-sm z-0"
            style={{ backgroundColor }}
          />
          {/* Foreground color chip */}
          <button
            onClick={() => onOpenColorPicker(true)}
            title="Set Foreground Color"
            className="absolute top-0 left-0 w-4 h-4 rounded border border-[#525d7a] shadow-md z-10 hover:scale-105 transition-transform"
            style={{ backgroundColor: foregroundColor }}
          />
          {/* Swap icon */}
          <button
            onClick={onSwapColors}
            title="Switch Foreground and Background Colors (X)"
            className="absolute -top-1.5 -right-1 text-[#8b95aa] hover:text-white transition-colors"
          >
            <RefreshCw size={9} />
          </button>
        </div>
      </div>
    </aside>
  );
};
