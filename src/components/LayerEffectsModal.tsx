import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Layer, LayerEffects } from '../types';

interface LayerEffectsModalProps {
  isOpen: boolean;
  activeLayer: Layer | null;
  onClose: () => void;
  onUpdateEffects: (effects: LayerEffects) => void;
}

export const LayerEffectsModal: React.FC<LayerEffectsModalProps> = ({
  isOpen,
  activeLayer,
  onClose,
  onUpdateEffects,
}) => {
  const [effects, setEffects] = useState<LayerEffects>(
    activeLayer?.effects || {
      dropShadow: { enabled: true, color: 'rgba(0,0,0,0.6)', blur: 8, x: 2, y: 4, opacity: 0.6 },
      stroke: { enabled: false, color: '#000000', size: 2, opacity: 1 },
      colorOverlay: { enabled: false, color: '#3b82f6', opacity: 0.5 },
    }
  );

  if (!isOpen || !activeLayer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm select-none p-4">
      <div className="w-[460px] bg-[#1a1e28] border border-[#2d3549] rounded-lg shadow-2xl p-4 flex flex-col gap-4 text-xs text-[#c2cbd9]">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Layer Style — {activeLayer.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#272e40] text-[#7f8a9e]">
            <X size={14} />
          </button>
        </div>

        {/* Drop Shadow Setting */}
        <div className="flex flex-col gap-2 p-2.5 bg-[#12141a] rounded border border-[#262c3e]">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-white">
              <input
                type="checkbox"
                checked={!!effects.dropShadow?.enabled}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    dropShadow: {
                      ...(effects.dropShadow || { color: '#000000', blur: 6, x: 2, y: 4, opacity: 0.6 }),
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded bg-[#202534] border-[#313a50]"
              />
              <span>Drop Shadow</span>
            </label>
            <input
              type="color"
              value="#000000"
              onChange={(e) =>
                setEffects({
                  ...effects,
                  dropShadow: {
                    ...(effects.dropShadow || { enabled: true, blur: 6, x: 2, y: 4, opacity: 0.6 }),
                    color: e.target.value,
                  },
                })
              }
              className="w-5 h-5 bg-transparent border-0 cursor-pointer"
            />
          </div>

          {effects.dropShadow?.enabled && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between">
                <span>Blur</span>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={effects.dropShadow.blur}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      dropShadow: { ...effects.dropShadow!, blur: Number(e.target.value) },
                    })
                  }
                  className="w-20"
                />
                <span className="font-mono text-white text-[10px] w-6 text-right">
                  {effects.dropShadow.blur}
                </span>
              </label>

              <label className="flex items-center justify-between">
                <span>Distance</span>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={effects.dropShadow.y}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      dropShadow: {
                        ...effects.dropShadow!,
                        y: Number(e.target.value),
                        x: Math.round(Number(e.target.value) * 0.5),
                      },
                    })
                  }
                  className="w-20"
                />
                <span className="font-mono text-white text-[10px] w-6 text-right">
                  {effects.dropShadow.y}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Stroke Setting */}
        <div className="flex flex-col gap-2 p-2.5 bg-[#12141a] rounded border border-[#262c3e]">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-white">
              <input
                type="checkbox"
                checked={!!effects.stroke?.enabled}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    stroke: {
                      ...(effects.stroke || { color: '#000000', size: 2, opacity: 1 }),
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded bg-[#202534] border-[#313a50]"
              />
              <span>Stroke Outline</span>
            </label>
            <input
              type="color"
              value={effects.stroke?.color || '#ffffff'}
              onChange={(e) =>
                setEffects({
                  ...effects,
                  stroke: {
                    ...(effects.stroke || { enabled: true, size: 2, opacity: 1 }),
                    color: e.target.value,
                  },
                })
              }
              className="w-5 h-5 bg-transparent border-0 cursor-pointer"
            />
          </div>

          {effects.stroke?.enabled && (
            <label className="flex items-center justify-between pt-1">
              <span>Size (px)</span>
              <input
                type="range"
                min={1}
                max={30}
                value={effects.stroke.size}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    stroke: { ...effects.stroke!, size: Number(e.target.value) },
                  })
                }
                className="w-36"
              />
              <span className="font-mono text-white text-[10px] w-6 text-right">
                {effects.stroke.size}
              </span>
            </label>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#282f42] pt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#212636] hover:bg-[#2b3246] text-[#b8c2d2]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onUpdateEffects(effects);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            Apply Style
          </button>
        </div>
      </div>
    </div>
  );
};
