import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  initialColor: string;
  isForeground: boolean;
  onClose: () => void;
  onApplyColor: (hex: string) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  initialColor,
  isForeground,
  onClose,
  onApplyColor,
}) => {
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [hue, setHue] = useState(215); // 0-360
  const [sat, setSat] = useState(80); // 0-100
  const [val, setVal] = useState(90); // 0-100

  useEffect(() => {
    setCurrentColor(initialColor);
  }, [initialColor]);

  if (!isOpen) return null;

  // Convert HSV to Hex
  const hsvToHex = (h: number, s: number, v: number): string => {
    s /= 100;
    v /= 100;
    const i = Math.floor((h / 60) % 6);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r = 0, g = 0, b = 0;
    switch (i) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const hex = hsvToHex(newHue, sat, val);
    setCurrentColor(hex);
  };

  const paletteSwatches = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#78716c',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4">
      <div className="w-[380px] bg-[#1a1e28] border border-[#2d3549] rounded-lg shadow-2xl p-4 flex flex-col gap-3 text-xs text-[#c4ccd9]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282f42] pb-2">
          <span className="font-semibold text-white">
            Color Picker ({isForeground ? 'Foreground' : 'Background'})
          </span>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#272e40] text-[#7f8a9e]">
            <X size={14} />
          </button>
        </div>

        {/* 2D Palette Box Simulation */}
        <div className="flex gap-3">
          <div
            className="w-48 h-48 rounded border border-[#2d364c] relative cursor-crosshair overflow-hidden"
            style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const s = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const v = Math.round((1 - (e.clientY - rect.top) / rect.height) * 100);
              setSat(s);
              setVal(v);
              setCurrentColor(hsvToHex(hue, s, v));
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow"
              style={{ left: `${sat}%`, top: `${100 - val}%` }}
            />
          </div>

          {/* 1D Hue Vertical Slider */}
          <div className="flex flex-col items-center">
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => handleHueChange(Number(e.target.value))}
              className="h-48 w-4 [writing-mode:vertical-lr] cursor-pointer"
            />
          </div>

          {/* Preview & Current vs Old */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#717b90]">Preview</span>
              <div className="h-14 rounded border border-[#2d364c] overflow-hidden flex flex-col">
                <div className="flex-1" style={{ backgroundColor: currentColor }} title="New" />
                <div className="flex-1" style={{ backgroundColor: initialColor }} title="Current" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#78849b]">Hex Code</label>
              <input
                type="text"
                value={currentColor.toUpperCase()}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="bg-[#12141a] border border-[#282f42] rounded px-2 py-1 text-white font-mono text-center outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Quick Swatches */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#717b90]">Swatches</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {paletteSwatches.map((hex) => (
              <button
                key={hex}
                onClick={() => setCurrentColor(hex)}
                style={{ backgroundColor: hex }}
                className="w-5 h-5 rounded border border-[#2f384d] hover:scale-110 transition-transform"
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-[#282f42] pt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#212636] hover:bg-[#2b3246] text-[#b8c2d2]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApplyColor(currentColor);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
