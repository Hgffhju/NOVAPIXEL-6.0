import React, { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';

interface SwatchesPanelProps {
  currentColor: string;
  onSelectColor: (hex: string) => void;
}

export const SwatchesPanel: React.FC<SwatchesPanelProps> = ({
  currentColor,
  onSelectColor,
}) => {
  const [swatches, setSwatches] = useState<string[]>([
    '#000000', '#1c1917', '#44403c', '#78716c', '#a8a29e', '#d6d3d1', '#f5f5f4', '#ffffff',
    '#ef4444', '#dc2626', '#b91c1c', '#f97316', '#ea580c', '#c2410c', '#f59e0b', '#d97706',
    '#84cc16', '#65a30d', '#22c55e', '#16a34a', '#10b981', '#059669', '#14b8a6', '#0d9488',
    '#06b6d4', '#0891b2', '#0ea5e9', '#0284c7', '#3b82f6', '#2563eb', '#6366f1', '#4f46e5',
    '#8b5cf6', '#7c3aed', '#a855f7', '#9333ea', '#d946ef', '#c026d3', '#ec4899', '#db2777',
    '#f43f5e', '#e11d48', '#be123c', '#881337', '#7f1d1d', '#78350f', '#713f12', '#365314',
  ]);

  const handleAddCurrent = () => {
    if (!swatches.includes(currentColor.toLowerCase())) {
      setSwatches([currentColor.toLowerCase(), ...swatches]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b8c2d2] p-2">
      <div className="flex items-center justify-between pb-2 border-b border-[#252b3b] mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded border border-[#30384d]"
            style={{ backgroundColor: currentColor }}
          />
          <span className="font-mono text-[11px] text-white uppercase">{currentColor}</span>
        </div>
        <button
          onClick={handleAddCurrent}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#202534] hover:bg-[#2b3346] text-blue-300 border border-[#2d364c] text-[10px]"
        >
          <Plus size={11} />
          <span>Add Swatch</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1.5 p-0.5">
          {swatches.map((hex, idx) => (
            <button
              key={idx}
              onClick={() => onSelectColor(hex)}
              className="w-6 h-6 rounded border border-[#2d354b] hover:scale-115 hover:z-10 transition-transform relative group shadow-sm"
              style={{ backgroundColor: hex }}
              title={hex}
            >
              {currentColor.toLowerCase() === hex.toLowerCase() && (
                <Check size={10} className="text-white drop-shadow mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
