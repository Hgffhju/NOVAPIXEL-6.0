import React, { useState } from 'react';
import {
  Layer,
  BlendMode,
  LayerColorLabel,
} from '../types';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Sliders,
  Sparkles,
  Type,
  Square,
  Blend,
  Link,
  Paintbrush,
  Move,
  Grid,
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateFill: (id: string, fill: number) => void;
  onUpdateBlendMode: (id: string, mode: BlendMode) => void;
  onSetColorLabel: (id: string, color: LayerColorLabel) => void;
  onToggleFolderCollapse: (id: string) => void;
  onAddLayer: () => void;
  onAddFolder: () => void;
  onAddLayerMask: (id: string) => void;
  onOpenLayerEffects: (id: string) => void;
  onAddAdjustment: (type: 'curves' | 'levels' | 'hsl' | 'exposure' | 'color-balance') => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  activeSubTab: 'layers' | 'channels' | 'paths';
  onSetSubTab: (tab: 'layers' | 'channels' | 'paths') => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onUpdateOpacity,
  onUpdateFill,
  onUpdateBlendMode,
  onSetColorLabel,
  onToggleFolderCollapse,
  onAddLayer,
  onAddFolder,
  onAddLayerMask,
  onOpenLayerEffects,
  onAddAdjustment,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
  activeSubTab,
  onSetSubTab,
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');
  const [showColorPickerForId, setShowColorPickerForId] = useState<string | null>(null);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showFillSlider, setShowFillSlider] = useState(false);

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

  const colorLabels: Array<{ id: LayerColorLabel; color: string; label: string }> = [
    { id: 'none', color: 'transparent', label: 'None' },
    { id: 'red', color: '#dc2626', label: 'Red' },
    { id: 'green', color: '#16a34a', label: 'Green' },
    { id: 'blue', color: '#2563eb', label: 'Blue' },
    { id: 'orange', color: '#ea580c', label: 'Orange' },
    { id: 'yellow', color: '#ca8a04', label: 'Yellow' },
    { id: 'violet', color: '#9333ea', label: 'Violet' },
    { id: 'gray', color: '#4b5563', label: 'Gray' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs">
      {/* 1. Header Tabs: Layers | Channels | Paths */}
      <div className="flex items-center justify-between border-b border-[#252b3b] bg-[#141620] px-2 h-7">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSetSubTab('layers')}
            className={`font-medium text-[11px] pb-1 border-b-2 transition-colors ${
              activeSubTab === 'layers'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-[#7e8aa0] hover:text-white'
            }`}
          >
            Layers
          </button>
          <button
            onClick={() => onSetSubTab('channels')}
            className={`font-medium text-[11px] pb-1 border-b-2 transition-colors ${
              activeSubTab === 'channels'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-[#7e8aa0] hover:text-white'
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => onSetSubTab('paths')}
            className={`font-medium text-[11px] pb-1 border-b-2 transition-colors ${
              activeSubTab === 'paths'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-[#7e8aa0] hover:text-white'
            }`}
          >
            Paths
          </button>
        </div>
        <span className="text-[#596378] text-[10px] cursor-pointer hover:text-white">≡</span>
      </div>

      {/* 2. Blend Mode & Opacity Row (Photoshop Standard) */}
      <div className="px-2 py-1.5 border-b border-[#242938] flex flex-col gap-1.5 bg-[#171a23]">
        <div className="flex items-center justify-between gap-2">
          {/* Blend Mode Dropdown */}
          <select
            value={activeLayer?.blendMode || 'normal'}
            onChange={(e) =>
              activeLayer && onUpdateBlendMode(activeLayer.id, e.target.value as BlendMode)
            }
            className="flex-1 bg-[#202534] border border-[#2e374c] rounded px-2 py-0.5 text-white capitalize text-[11px] outline-none"
          >
            {blendModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode === 'normal' && activeLayer?.isGroup ? 'Pass Through' : mode.replace('-', ' ')}
              </option>
            ))}
          </select>

          {/* Opacity with Quick Scrub Dropdown */}
          <div className="relative flex items-center gap-1">
            <span className="text-[11px] text-[#8692a7]">Opacity:</span>
            <button
              onClick={() => setShowOpacitySlider(!showOpacitySlider)}
              className="bg-[#202534] border border-[#2e374c] rounded px-1.5 py-0.5 text-white font-mono text-[11px] flex items-center gap-1"
            >
              <span>{activeLayer ? Math.round(activeLayer.opacity * 100) : 100}%</span>
              <span className="text-[8px] opacity-60">▼</span>
            </button>

            {showOpacitySlider && (
              <div className="absolute right-0 top-full mt-1 bg-[#1e2332] border border-[#2f384d] p-2 rounded shadow-2xl z-50 w-36 flex flex-col gap-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={activeLayer?.opacity || 1}
                  onChange={(e) =>
                    activeLayer && onUpdateOpacity(activeLayer.id, Number(e.target.value))
                  }
                  className="w-full cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Lock Icons & Fill Row (Matches exact Photopea screenshot!) */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1 text-[#78849b]">
            <span className="text-[10px] text-[#6d778d] mr-1">Lock:</span>
            <button
              onClick={() => activeLayer && onToggleLock(activeLayer.id)}
              className={`p-1 rounded hover:bg-[#252b3d] transition-colors ${
                activeLayer?.lockedTypes?.transparency ? 'text-blue-400 bg-[#242b3d]' : 'hover:text-white'
              }`}
              title="Lock transparent pixels"
            >
              <Grid size={11} />
            </button>
            <button
              onClick={() => activeLayer && onToggleLock(activeLayer.id)}
              className={`p-1 rounded hover:bg-[#252b3d] transition-colors ${
                activeLayer?.lockedTypes?.brush ? 'text-blue-400 bg-[#242b3d]' : 'hover:text-white'
              }`}
              title="Lock image pixels / brush"
            >
              <Paintbrush size={11} />
            </button>
            <button
              onClick={() => activeLayer && onToggleLock(activeLayer.id)}
              className={`p-1 rounded hover:bg-[#252b3d] transition-colors ${
                activeLayer?.lockedTypes?.position ? 'text-blue-400 bg-[#242b3d]' : 'hover:text-white'
              }`}
              title="Lock position"
            >
              <Move size={11} />
            </button>
            <button
              onClick={() => activeLayer && onToggleLock(activeLayer.id)}
              className={`p-1 rounded hover:bg-[#252b3d] transition-colors ${
                activeLayer?.locked ? 'text-amber-400 bg-[#242b3d]' : 'hover:text-white'
              }`}
              title="Lock all"
            >
              {activeLayer?.locked ? <Lock size={11} /> : <Unlock size={11} />}
            </button>
          </div>

          {/* Fill Scrub Slider */}
          <div className="relative flex items-center gap-1">
            <span className="text-[10px] text-[#8692a7]">Fill:</span>
            <button
              onClick={() => setShowFillSlider(!showFillSlider)}
              className="bg-[#202534] border border-[#2e374c] rounded px-1.5 py-0.5 text-white font-mono text-[10px] flex items-center gap-1"
            >
              <span>{activeLayer?.fill ? Math.round(activeLayer.fill * 100) : 100}%</span>
              <span className="text-[7px] opacity-60">▼</span>
            </button>

            {showFillSlider && (
              <div className="absolute right-0 top-full mt-1 bg-[#1e2332] border border-[#2f384d] p-2 rounded shadow-2xl z-50 w-36 flex flex-col gap-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={activeLayer?.fill || 1}
                  onChange={(e) =>
                    activeLayer && onUpdateFill(activeLayer.id, Number(e.target.value))
                  }
                  className="w-full cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Layer Tree Items */}
      <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-0.5">
        {[...layers].reverse().map((layer) => {
          const isSelected = layer.id === activeLayerId;
          const isInsideFolder = !!layer.groupId;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              onDoubleClick={() => onOpenLayerEffects(layer.id)}
              className={`relative flex items-center gap-1.5 px-1 py-1 rounded transition-colors cursor-pointer border ${
                isSelected
                  ? 'bg-[#293246] border-blue-500/80 text-white'
                  : 'bg-[#1b1e2a] border-[#222736] hover:bg-[#202434] text-[#c2cad8]'
              } ${isInsideFolder ? 'ml-4 border-l-2 border-l-[#3b4764]' : ''}`}
            >
              {/* Layer Color Badge (Left indicator stripe) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPickerForId(showColorPickerForId === layer.id ? null : layer.id);
                }}
                className="w-2.5 h-6 rounded-sm shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor:
                    layer.colorLabel === 'green'
                      ? '#16a34a'
                      : layer.colorLabel === 'red'
                      ? '#dc2626'
                      : layer.colorLabel === 'blue'
                      ? '#2563eb'
                      : layer.colorLabel === 'orange'
                      ? '#ea580c'
                      : layer.colorLabel === 'yellow'
                      ? '#ca8a04'
                      : layer.colorLabel === 'violet'
                      ? '#9333ea'
                      : 'transparent',
                  border: layer.colorLabel && layer.colorLabel !== 'none' ? 'none' : '1px dashed #343c50',
                }}
                title="Change color label"
              />

              {/* Color Label Popup */}
              {showColorPickerForId === layer.id && (
                <div
                  className="absolute left-6 top-0 bg-[#1e2332] border border-[#2f384d] rounded-md shadow-2xl p-1.5 flex gap-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {colorLabels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSetColorLabel(layer.id, c.id);
                        setShowColorPickerForId(null);
                      }}
                      className="w-4 h-4 rounded border border-white/20 hover:scale-125 transition-transform"
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              )}

              {/* Eye Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className={`p-0.5 rounded hover:bg-[#2e364a] shrink-0 ${
                  layer.visible ? 'text-[#a2aebd]' : 'text-neutral-600 opacity-40'
                }`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              {/* Folder Expand/Collapse Arrow */}
              {layer.isGroup ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFolderCollapse(layer.id);
                  }}
                  className="p-0.5 text-[#8692a8] hover:text-white"
                >
                  {layer.collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                </button>
              ) : null}

              {/* Thumbnail / Icon */}
              <div className="w-7 h-7 rounded bg-[#101218] border border-[#2c3448] overflow-hidden flex items-center justify-center shrink-0">
                {layer.isGroup ? (
                  layer.collapsed ? (
                    <Folder size={13} className="text-amber-400" />
                  ) : (
                    <FolderOpen size={13} className="text-amber-400" />
                  )
                ) : layer.kind === 'adjustment' ? (
                  <Sliders size={13} className="text-amber-400" />
                ) : layer.kind === 'text' ? (
                  <Type size={13} className="text-blue-400 font-bold" />
                ) : (
                  <canvas
                    ref={(el) => {
                      if (el && layer.canvas) {
                        const ctx = el.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, 28, 28);
                          ctx.drawImage(layer.canvas, 0, 0, 28, 28);
                        }
                      }
                    }}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Layer Mask Thumbnail (if mask exists) */}
              {layer.hasMask && (
                <div
                  className="w-6 h-6 rounded bg-white border border-[#2c3448] flex items-center justify-center shrink-0 cursor-pointer"
                  title="Layer Mask Thumbnail"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-black" />
                </div>
              )}

              {/* Layer Name & Inline Edit */}
              <div className="flex-1 min-w-0 flex items-center justify-between">
                {editingLayerId === layer.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editNameText}
                    onChange={(e) => setEditNameText(e.target.value)}
                    onBlur={() => {
                      if (editNameText.trim()) layer.name = editNameText.trim();
                      setEditingLayerId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editNameText.trim()) layer.name = editNameText.trim();
                        setEditingLayerId(null);
                      }
                    }}
                    className="bg-[#12141a] border border-blue-500 rounded px-1 text-white text-xs w-full outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingLayerId(layer.id);
                      setEditNameText(layer.name);
                    }}
                    className="truncate text-xs font-normal"
                  >
                    {layer.name}
                  </span>
                )}

                {/* Layer Effects tag `eff ▶` if active */}
                {layer.effects?.dropShadow?.enabled || layer.effects?.stroke?.enabled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLayerEffects(layer.id);
                    }}
                    className="text-[9px] font-mono text-blue-300 hover:text-white px-1 rounded bg-blue-900/40 border border-blue-700/50 shrink-0 ml-1"
                  >
                    eff ▶
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Bottom Toolbar of Layer Panel (Matches Photopea / Photoshop icons!) */}
      <div className="px-2 py-1 border-t border-[#252b3b] bg-[#141620] flex items-center justify-between text-[#8592a8]">
        {/* Link Layers */}
        <button
          onClick={() => {}}
          title="Link / Unlink layers"
          className="p-1 rounded hover:bg-[#242b3b] hover:text-white transition-colors"
        >
          <Link size={12} />
        </button>

        {/* Layer Style Effects */}
        <button
          onClick={() => activeLayer && onOpenLayerEffects(activeLayer.id)}
          title="Add a layer style (Effects)"
          className="p-1 rounded hover:bg-[#242b3b] hover:text-white font-serif text-[11px] italic transition-colors"
        >
          eff
        </button>

        {/* Add Layer Mask */}
        <button
          onClick={() => activeLayer && onAddLayerMask(activeLayer.id)}
          title="Add raster mask"
          className="p-1 rounded hover:bg-[#242b3b] hover:text-white transition-colors"
        >
          <div className="w-3.5 h-3.5 border border-current rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
          </div>
        </button>

        {/* New Adjustment Layer */}
        <div className="relative group">
          <button
            title="Create new fill or adjustment layer"
            className="p-1 rounded hover:bg-[#242b3b] text-amber-300 hover:text-white transition-colors"
          >
            <div className="w-3.5 h-3.5 rounded-full border border-current overflow-hidden flex">
              <div className="w-1/2 h-full bg-current" />
            </div>
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

        {/* New Group / Folder */}
        <button
          onClick={onAddFolder}
          title="Create a new folder group"
          className="p-1 rounded hover:bg-[#242b3b] hover:text-amber-400 transition-colors"
        >
          <Folder size={12} />
        </button>

        {/* New Layer */}
        <button
          onClick={onAddLayer}
          title="Create a new layer"
          className="p-1 rounded hover:bg-[#242b3b] hover:text-blue-400 transition-colors"
        >
          <Plus size={14} />
        </button>

        {/* Delete Layer */}
        <button
          disabled={layers.length <= 1}
          onClick={() => onDeleteLayer(activeLayerId)}
          title="Delete layer or group"
          className="p-1 rounded hover:bg-[#242b3b] hover:text-red-400 disabled:opacity-30 disabled:hover:text-current transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
