import React from 'react';
import {
  ToolType,
  BrushSettings,
  CloneSettings,
  BlendMode,
  EyedropperSettings,
  ColorSamplerPoint,
} from '../types';
import {
  Sparkles,
  RotateCcw,
  Sliders,
  Maximize2,
  Check,
  X,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pipette,
  Target,
  MousePointerClick,
  Eye,
} from 'lucide-react';

interface ContextOptionsBarProps {
  currentTool: ToolType;
  brushSettings: BrushSettings;
  cloneSettings: CloneSettings;
  onUpdateBrush: (settings: Partial<BrushSettings>) => void;
  onUpdateClone: (settings: Partial<CloneSettings>) => void;
  onContentAwareFill: () => void;
  onSelectSubjectAI: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  hasSelection: boolean;
  cropPreset: string;
  onSetCropPreset: (preset: string) => void;
  eyedropperSettings?: EyedropperSettings;
  onUpdateEyedropper?: (settings: Partial<EyedropperSettings>) => void;
  sampledColor?: string;
  colorSamplers?: ColorSamplerPoint[];
  onClearColorSamplers?: () => void;
  activeLayerName?: string;
}

export const ContextOptionsBar: React.FC<ContextOptionsBarProps> = ({
  currentTool,
  brushSettings,
  cloneSettings,
  onUpdateBrush,
  onUpdateClone,
  onContentAwareFill,
  onSelectSubjectAI,
  onApplyCrop,
  onCancelCrop,
  hasSelection,
  cropPreset,
  onSetCropPreset,
  eyedropperSettings = { sampleSize: 1, sampleSource: 'all', showLoupe: true },
  onUpdateEyedropper,
  sampledColor,
  colorSamplers = [],
  onClearColorSamplers,
  activeLayerName,
}) => {
  return (
    <div className="h-8 bg-[#181a23] border-b border-[#242938] flex items-center px-3 text-[11px] text-[#adb5c7] gap-4 select-none shrink-0 overflow-x-auto">
      {/* Eyedropper / Color Picker Tool Controls */}
      {currentTool === 'eyedropper' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-blue-400 font-medium">
            <Pipette size={13} />
            <span>Color Sampler</span>
          </div>

          <label className="flex items-center gap-1.5">
            <span>Sample Size:</span>
            <select
              value={eyedropperSettings.sampleSize}
              onChange={(e) => onUpdateEyedropper?.({ sampleSize: Number(e.target.value) as any })}
              className="bg-[#202534] border border-[#313a50] rounded px-2 py-0.5 text-white outline-none"
            >
              <option value={1}>Point Sample (1×1)</option>
              <option value={3}>3 by 3 Average</option>
              <option value={5}>5 by 5 Average</option>
              <option value={11}>11 by 11 Average</option>
              <option value={31}>31 by 31 Average</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5">
            <span>Sample:</span>
            <select
              value={eyedropperSettings.sampleSource}
              onChange={(e) => onUpdateEyedropper?.({ sampleSource: e.target.value as any })}
              className="bg-[#202534] border border-[#313a50] rounded px-2 py-0.5 text-white outline-none"
            >
              <option value="all">All Layers (Composite)</option>
              <option value="current">Current Layer</option>
              <option value="current-below">Current & Below</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={eyedropperSettings.showLoupe}
              onChange={(e) => onUpdateEyedropper?.({ showLoupe: e.target.checked })}
              className="rounded bg-[#202534] border-[#313a50] text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span>Show Sampling Loupe</span>
          </label>

          {sampledColor && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#2e374c]">
              <span
                className="w-3.5 h-3.5 rounded border border-white/30 shrink-0"
                style={{ backgroundColor: sampledColor }}
              />
              <span className="font-mono text-white text-[10px]">{sampledColor.toUpperCase()}</span>
            </div>
          )}
        </div>
      )}

      {/* Color Sampler Targets Tool Controls */}
      {currentTool === 'color-sampler' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-blue-400 font-medium">
            <Target size={13} />
            <span>Target Points ({colorSamplers.length}/4)</span>
          </div>

          <span className="text-[#8490a6]">Click on canvas to drop reference target</span>

          {colorSamplers.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#202534] border border-[#2d374d]">
              <span className="font-bold text-blue-400 font-mono text-[10px]">#{idx + 1}</span>
              <span className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ backgroundColor: s.hex }} />
              <span className="font-mono text-[10px] text-white">R:{s.r} G:{s.g} B:{s.b}</span>
            </div>
          ))}

          {colorSamplers.length > 0 && (
            <button
              onClick={onClearColorSamplers}
              className="px-2 py-0.5 rounded bg-[#282f42] hover:bg-red-500/20 hover:text-red-300 text-[#a4afc2] transition-colors"
            >
              Clear Targets
            </button>
          )}
        </div>
      )}

      {/* Layer Picker Tool Controls */}
      {currentTool === 'layer-picker' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-blue-400 font-medium">
            <MousePointerClick size={13} />
            <span>Layer Pick Tool</span>
          </div>
          <span className="text-[#8490a6]">Click anywhere on canvas to select that layer</span>
          {activeLayerName && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#202534] border border-[#2d374d]">
              <span className="text-[10px] text-[#78849b]">Active:</span>
              <span className="text-white font-medium text-[11px]">{activeLayerName}</span>
            </div>
          )}
        </div>
      )}
      {/* Brush / Eraser / Paint Controls */}
      {['brush', 'eraser', 'heal', 'spot'].includes(currentTool) && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span>Size</span>
            <input
              type="range"
              min={1}
              max={300}
              value={brushSettings.size}
              onChange={(e) => onUpdateBrush({ size: Number(e.target.value) })}
              className="w-20 cursor-pointer"
            />
            <span className="font-mono text-[#d4dae8] w-7 text-right">{brushSettings.size}px</span>
          </label>

          <label className="flex items-center gap-2">
            <span>Hardness</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={brushSettings.hardness}
              onChange={(e) => onUpdateBrush({ hardness: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
            <span className="font-mono text-[#d4dae8] w-7 text-right">
              {Math.round(brushSettings.hardness * 100)}%
            </span>
          </label>

          <label className="flex items-center gap-2">
            <span>Opacity</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={brushSettings.opacity}
              onChange={(e) => onUpdateBrush({ opacity: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
            <span className="font-mono text-[#d4dae8] w-7 text-right">
              {Math.round(brushSettings.opacity * 100)}%
            </span>
          </label>

          <label className="flex items-center gap-2">
            <span>Flow</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={brushSettings.flow}
              onChange={(e) => onUpdateBrush({ flow: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
            <span className="font-mono text-[#d4dae8] w-7 text-right">
              {Math.round(brushSettings.flow * 100)}%
            </span>
          </label>

          <label className="flex items-center gap-2">
            <span>Smoothing</span>
            <input
              type="range"
              min={0}
              max={100}
              value={brushSettings.smoothing}
              onChange={(e) => onUpdateBrush({ smoothing: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
            <span className="font-mono text-[#d4dae8] w-7 text-right">
              {brushSettings.smoothing}%
            </span>
          </label>
        </div>
      )}

      {/* Clone Stamp Controls */}
      {currentTool === 'clone' && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={cloneSettings.aligned}
              onChange={(e) => onUpdateClone({ aligned: e.target.checked })}
              className="rounded bg-[#202534] border-[#313a50]"
            />
            <span>Aligned</span>
          </label>

          <label className="flex items-center gap-2">
            <span>Rotate</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={cloneSettings.rotation}
              onChange={(e) => onUpdateClone({ rotation: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
            <span className="font-mono text-[#d4dae8] w-7 text-right">{cloneSettings.rotation}°</span>
          </label>

          <label className="flex items-center gap-2">
            <span>Scale</span>
            <input
              type="range"
              min={25}
              max={200}
              value={cloneSettings.scale}
              onChange={(e) => onUpdateClone({ scale: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
            <span className="font-mono text-[#d4dae8] w-7 text-right">{cloneSettings.scale}%</span>
          </label>

          <span className="text-[10px] text-amber-300/80">
            {cloneSettings.sourcePoint
              ? `Source: [${Math.round(cloneSettings.sourcePoint[0])}, ${Math.round(cloneSettings.sourcePoint[1])}]`
              : 'Alt + Click to set clone source point'}
          </span>
        </div>
      )}

      {/* Selection / Marquee / Lasso Controls */}
      {['marquee-rect', 'marquee-ellipse', 'lasso', 'magic-wand'].includes(currentTool) && (
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectSubjectAI}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#252c3e] hover:bg-[#30394f] text-blue-300 border border-[#333d56] transition-colors"
          >
            <Sparkles size={11} />
            <span>Select Subject (AI)</span>
          </button>

          {hasSelection && (
            <button
              onClick={onContentAwareFill}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition-colors"
            >
              <span>Generative / Content-Aware Fill</span>
            </button>
          )}

          <span className="text-[#6d778d] text-[10px]">
            {hasSelection ? 'Active selection active' : 'Click & drag on canvas to select area'}
          </span>
        </div>
      )}

      {/* Crop Controls */}
      {currentTool === 'crop' && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span>Ratio</span>
            <select
              value={cropPreset}
              onChange={(e) => onSetCropPreset(e.target.value)}
              className="bg-[#202534] border border-[#313a50] rounded px-2 py-0.5 text-white"
            >
              <option value="original">Original Ratio</option>
              <option value="1:1">1:1 Square</option>
              <option value="4:3">4:3 Standard</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Story / Reel</option>
              <option value="custom">Freeform</option>
            </select>
          </label>

          <button
            onClick={onApplyCrop}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            <Check size={11} />
            <span>Apply Crop</span>
          </button>

          <button
            onClick={onCancelCrop}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#262c3e] hover:bg-[#323a50] text-[#c0c7d6]"
          >
            <X size={11} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Text Controls */}
      {currentTool === 'text' && (
        <div className="flex items-center gap-3">
          <span className="text-[#c5cde0] font-medium">Text Tool Active:</span>
          <span>Click on canvas to add or edit live typographic layer</span>
        </div>
      )}

      {/* Default Tool Context */}
      {['move', 'hand', 'zoom', 'gradient', 'pen', 'shape-rect'].includes(currentTool) && (
        <div className="flex items-center gap-3 text-[#79849b]">
          <span className="capitalize">{currentTool.replace('-', ' ')} Tool</span>
          <span aria-hidden="true" className="text-[#3b4356]">·</span>
          <span>Hold Space + Drag to pan canvas at any time</span>
          <span aria-hidden="true" className="text-[#3b4356]">·</span>
          <span>Scroll wheel to zoom</span>
        </div>
      )}
    </div>
  );
};
