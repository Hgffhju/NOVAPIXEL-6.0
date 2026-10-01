import React from 'react';
import { Info, Maximize2, Move, RotateCw } from 'lucide-react';
import { Layer, BitDepth, ColorProfileName } from '../types';

interface InfoPropertiesPanelProps {
  documentWidth: number;
  documentHeight: number;
  bitDepth: BitDepth;
  colorProfile: ColorProfileName;
  activeLayer: Layer | null;
  onUpdateTransform: (x: number, y: number, w: number, h: number, rot: number) => void;
}

export const InfoPropertiesPanel: React.FC<InfoPropertiesPanelProps> = ({
  documentWidth,
  documentHeight,
  bitDepth,
  colorProfile,
  activeLayer,
  onUpdateTransform,
}) => {
  const trans = activeLayer?.transform || {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  };

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b8c2d2] p-3 gap-3 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-[#252b3b] pb-2">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <Info size={14} className="text-blue-400" />
          <span>Properties & Document Info</span>
        </span>
      </div>

      {/* Document Specs */}
      <div className="flex flex-col gap-1.5 p-2 bg-[#12141a] rounded border border-[#272e40]">
        <span className="text-[10px] text-[#717b90] uppercase font-mono tracking-wider">Canvas Specs</span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-[#6d778c]">Dimensions:</span>
            <div className="font-mono text-white">{documentWidth} × {documentHeight} px</div>
          </div>
          <div>
            <span className="text-[#6d778c]">Resolution:</span>
            <div className="font-mono text-white">300 DPI (Print HDR)</div>
          </div>
          <div>
            <span className="text-[#6d778c]">Color Profile:</span>
            <div className="font-mono text-blue-300">{colorProfile}</div>
          </div>
          <div>
            <span className="text-[#6d778c]">Bit Depth:</span>
            <div className="font-mono text-emerald-300">{bitDepth}-bit float</div>
          </div>
        </div>
      </div>

      {/* Active Layer Properties */}
      {activeLayer && (
        <div className="flex flex-col gap-2 p-2 bg-[#12141a] rounded border border-[#272e40]">
          <span className="text-[10px] text-[#717b90] uppercase font-mono tracking-wider">
            Layer: {activeLayer.name}
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#6d778c]">Kind:</span>
              <div className="capitalize text-white">{activeLayer.kind}</div>
            </div>
            <div>
              <span className="text-[#6d778c]">Blend Mode:</span>
              <div className="capitalize text-white">{activeLayer.blendMode}</div>
            </div>
            <div>
              <span className="text-[#6d778c]">Opacity:</span>
              <div className="font-mono text-white">{Math.round(activeLayer.opacity * 100)}%</div>
            </div>
            <div>
              <span className="text-[#6d778c]">Fill:</span>
              <div className="font-mono text-white">{Math.round(activeLayer.fill * 100)}%</div>
            </div>
          </div>

          <div className="border-t border-[#232938] pt-2 mt-1 grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between text-[11px]">
              <span className="text-[#6d778c]">Pos X</span>
              <input
                type="number"
                value={Math.round(trans.x)}
                onChange={(e) =>
                  onUpdateTransform(Number(e.target.value), trans.y, trans.scaleX, trans.scaleY, trans.rotation)
                }
                className="w-16 bg-[#1a1d27] border border-[#2c3448] rounded px-1.5 py-0.5 text-white font-mono text-right"
              />
            </label>

            <label className="flex items-center justify-between text-[11px]">
              <span className="text-[#6d778c]">Pos Y</span>
              <input
                type="number"
                value={Math.round(trans.y)}
                onChange={(e) =>
                  onUpdateTransform(trans.x, Number(e.target.value), trans.scaleX, trans.scaleY, trans.rotation)
                }
                className="w-16 bg-[#1a1d27] border border-[#2c3448] rounded px-1.5 py-0.5 text-white font-mono text-right"
              />
            </label>

            <label className="flex items-center justify-between text-[11px]">
              <span className="text-[#6d778c]">Scale</span>
              <input
                type="number"
                step={0.05}
                value={trans.scaleX.toFixed(2)}
                onChange={(e) =>
                  onUpdateTransform(trans.x, trans.y, Number(e.target.value), Number(e.target.value), trans.rotation)
                }
                className="w-16 bg-[#1a1d27] border border-[#2c3448] rounded px-1.5 py-0.5 text-white font-mono text-right"
              />
            </label>

            <label className="flex items-center justify-between text-[11px]">
              <span className="text-[#6d778c]">Rotate</span>
              <input
                type="number"
                value={Math.round(trans.rotation)}
                onChange={(e) =>
                  onUpdateTransform(trans.x, trans.y, trans.scaleX, trans.scaleY, Number(e.target.value))
                }
                className="w-16 bg-[#1a1d27] border border-[#2c3448] rounded px-1.5 py-0.5 text-white font-mono text-right"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
