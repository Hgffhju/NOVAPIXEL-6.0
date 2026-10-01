import React from 'react';
import {
  Layer,
  BlendMode,
  AdjustmentType,
} from '../types';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sliders,
  Layers,
  Sparkles,
  Type,
  Square,
  Blend,
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateBlendMode: (id: string, mode: BlendMode) => void;
  onAddLayer: () => void;
  onAddAdjustment: (type: 'curves' | 'levels' | 'hsl' | 'exposure' | 'color-balance') => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onUpdateOpacity,
  onUpdateBlendMode,
  onAddLayer,
  onAddAdjustment,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
}) => {
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  const blendModes: BlendMode[] = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'soft-light',
    'hard-light',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'difference',
    'exclusion',
    'add',
  ];

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs">
      {/* Blend Mode & Opacity Header Controls */}
      <div className="p-2 border-b border-[#252b3b] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-[#8692a7]">Blend</label>
          <select
            value={activeLayer?.blendMode || 'normal'}
            onChange={(e) =>
              activeLayer && onUpdateBlendMode(activeLayer.id, e.target.value as BlendMode)
            }
            className="flex-1 bg-[#202534] border border-[#2e374c] rounded px-2 py-1 text-white capitalize text-xs outline-none"
          >
            {blendModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode.replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-[#8692a7]">Opacity</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={activeLayer ? activeLayer.opacity : 1}
            onChange={(e) =>
              activeLayer && onUpdateOpacity(activeLayer.id, Number(e.target.value))
            }
            className="flex-1 cursor-pointer"
          />
          <span className="font-mono text-white text-[11px] w-8 text-right">
            {activeLayer ? Math.round(activeLayer.opacity * 100) : 100}%
          </span>
        </div>
      </div>

      {/* Layers List (Top of stack rendered first, like in Photoshop) */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1">
        {[...layers].reverse().map((layer, reverseIdx) => {
          const isSelected = layer.id === activeLayerId;
          const actualIndex = layers.length - 1 - reverseIdx;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center gap-2 p-1.5 rounded border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#293246] border-blue-500/80 text-white'
                  : 'bg-[#1e222e] border-[#262c3e] hover:bg-[#232838] text-[#c2cad8]'
              }`}
            >
              {/* Visibility eye toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className={`p-1 rounded hover:bg-[#2e364a] ${
                  layer.visible ? 'text-[#a2aebd]' : 'text-neutral-600'
                }`}
              >
                {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              {/* Layer Thumbnail Preview */}
              <div className="w-8 h-8 rounded bg-[#12141a] border border-[#30384c] overflow-hidden flex items-center justify-center shrink-0">
                {layer.kind === 'adjustment' ? (
                  <Sliders size={14} className="text-amber-400" />
                ) : layer.kind === 'text' ? (
                  <Type size={14} className="text-blue-400" />
                ) : (
                  <canvas
                    ref={(el) => {
                      if (el && layer.canvas) {
                        const ctx = el.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, 32, 32);
                          ctx.drawImage(layer.canvas, 0, 0, 32, 32);
                        }
                      }
                    }}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Layer Name & Tag */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate text-xs">{layer.name}</span>
                  {layer.kind === 'adjustment' && (
                    <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Adj
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#717b90] font-mono">
                  {layer.blendMode} · {Math.round(layer.opacity * 100)}%
                </div>
              </div>

              {/* Lock Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className={`p-1 rounded hover:bg-[#2e364a] ${
                  layer.locked ? 'text-amber-400' : 'text-[#6b758b]'
                }`}
              >
                {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Layer Operations Toolbar Footer */}
      <div className="p-2 border-t border-[#252b3b] bg-[#161821] flex items-center justify-between text-[#8d98ad]">
        <div className="flex items-center gap-1">
          {/* Reorder Up / Down */}
          <button
            onClick={() => onMoveLayer(activeLayerId, 'up')}
            title="Bring Layer Forward"
            className="p-1.5 rounded hover:bg-[#262c3e] hover:text-white"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => onMoveLayer(activeLayerId, 'down')}
            title="Send Layer Backward"
            className="p-1.5 rounded hover:bg-[#262c3e] hover:text-white"
          >
            <ChevronDown size={14} />
          </button>
          <span className="text-[#363f54] mx-0.5">|</span>
          {/* Duplicate Layer */}
          <button
            onClick={() => onDuplicateLayer(activeLayerId)}
            title="Duplicate Current Layer (⌘J)"
            className="p-1.5 rounded hover:bg-[#262c3e] hover:text-white"
          >
            <Copy size={13} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Add Adjustment Layer Menu */}
          <div className="relative group">
            <button
              title="Add Non-Destructive Adjustment Layer"
              className="p-1.5 rounded hover:bg-[#262c3e] text-amber-300"
            >
              <Sliders size={14} />
            </button>
            <div className="absolute bottom-full right-0 mb-1 w-44 bg-[#1b1f2b] border border-[#2b3348] rounded shadow-2xl py-1 hidden group-hover:block z-50 text-[11px]">
              <button
                onClick={() => onAddAdjustment('curves')}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white"
              >
                + Curves...
              </button>
              <button
                onClick={() => onAddAdjustment('levels')}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white"
              >
                + Levels...
              </button>
              <button
                onClick={() => onAddAdjustment('hsl')}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white"
              >
                + Hue / Saturation...
              </button>
              <button
                onClick={() => onAddAdjustment('exposure')}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white"
              >
                + Exposure & Tonemap...
              </button>
              <button
                onClick={() => onAddAdjustment('color-balance')}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white"
              >
                + Color Balance...
              </button>
            </div>
          </div>

          {/* New Layer */}
          <button
            onClick={onAddLayer}
            title="Create New Blank Layer (⇧⌘N)"
            className="p-1.5 rounded hover:bg-[#262c3e] text-blue-400"
          >
            <Plus size={15} />
          </button>

          {/* Delete Layer */}
          <button
            disabled={layers.length <= 1}
            onClick={() => onDeleteLayer(activeLayerId)}
            title="Delete Layer"
            className="p-1.5 rounded hover:bg-[#262c3e] text-red-400 disabled:opacity-30 disabled:hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
