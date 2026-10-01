import React, { useState } from 'react';
import { X, Download, FileImage, Check } from 'lucide-react';
import { Layer } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentWidth: number;
  documentHeight: number;
  projectName: string;
  onExportImage: (format: 'png' | 'jpeg' | 'webp' | 'json', quality: number, scale: number) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  documentWidth,
  documentHeight,
  projectName,
  onExportImage,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'json'>('png');
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState(1);
  const [preserveAlpha, setPreserveAlpha] = useState(true);

  if (!isOpen) return null;

  const targetWidth = Math.round(documentWidth * scale);
  const targetHeight = Math.round(documentHeight * scale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm select-none p-4">
      <div className="w-[440px] bg-[#1a1e28] border border-[#2d3549] rounded-lg shadow-2xl p-4 flex flex-col gap-4 text-xs text-[#c2cbd9]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282f42] pb-2.5">
          <div className="flex items-center gap-2">
            <Download size={14} className="text-blue-400" />
            <span className="font-semibold text-white">Export Artwork</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#272e40] text-[#7f8a9e]">
            <X size={14} />
          </button>
        </div>

        {/* Format Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[#8490a6] font-medium">Format</label>
          <div className="grid grid-cols-4 gap-2">
            {(['png', 'jpeg', 'webp', 'json'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`py-2 px-1 rounded border text-center font-medium uppercase text-[11px] transition-colors ${
                  format === fmt
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-[#202534] border-[#2b3346] text-[#a4aebd] hover:bg-[#252c3c]'
                }`}
              >
                {fmt === 'json' ? '.novapix' : fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Export Quality slider for lossy formats */}
        {(format === 'jpeg' || format === 'webp') && (
          <div className="flex flex-col gap-1.5 bg-[#12141a] p-2.5 rounded border border-[#262c3e]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#939fb5]">Compression Quality</span>
              <span className="font-mono text-white font-medium">{quality}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
        )}

        {/* Scale Multiplier */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8490a6]">Scale Factor</span>
            <span className="font-mono text-[#cbd4e4]">
              {targetWidth} × {targetHeight} px
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '1x (Standard)', val: 1 },
              { label: '2x (HiDPI Retina)', val: 2 },
              { label: '4x (Ultra Print)', val: 4 },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => setScale(s.val)}
                className={`py-1.5 rounded border text-center text-[10px] transition-colors ${
                  scale === s.val
                    ? 'bg-[#2a3348] border-blue-400 text-white font-medium'
                    : 'bg-[#1e2330] border-[#272e40] text-[#919cb2] hover:bg-[#242b3b]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="p-2.5 rounded bg-[#13151c] border border-[#232938] text-[11px] text-[#7d889c] leading-relaxed">
          {format === 'json'
            ? 'Exports complete multi-layer project state with non-destructive adjustment layers, collaborative pins, and metadata.'
            : `Renders flattened ${targetWidth}×${targetHeight} raster output with wide-gamut Display P3 profile matching.`}
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
              onExportImage(format, quality, scale);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
