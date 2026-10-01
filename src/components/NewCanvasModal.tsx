import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { BitDepth, ColorProfileName } from '../types';

interface NewCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDocument: (
    name: string,
    width: number,
    height: number,
    bitDepth: BitDepth,
    profile: ColorProfileName,
    background: 'white' | 'black' | 'transparent'
  ) => void;
}

export const NewCanvasModal: React.FC<NewCanvasModalProps> = ({
  isOpen,
  onClose,
  onCreateDocument,
}) => {
  const [docName, setDocName] = useState('Untitled-1');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [bitDepth, setBitDepth] = useState<BitDepth>(16);
  const [profile, setProfile] = useState<ColorProfileName>('Display P3');
  const [background, setBackground] = useState<'white' | 'black' | 'transparent'>('transparent');

  if (!isOpen) return null;

  const presets = [
    { label: 'Full HD Web', w: 1920, h: 1080 },
    { label: '4K Cinema', w: 3840, h: 2160 },
    { label: 'Instagram Square', w: 1080, h: 1080 },
    { label: 'Instagram Portrait', w: 1080, h: 1350 },
    { label: 'Print A4 (300 DPI)', w: 2480, h: 3508 },
    { label: 'Studio Retouch 4:3', w: 2048, h: 1536 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm select-none p-4">
      <div className="w-[460px] bg-[#1a1e28] border border-[#2d3549] rounded-lg shadow-2xl p-4 flex flex-col gap-4 text-xs text-[#c2cbd9]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282f42] pb-2.5">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-blue-400" />
            <span className="font-semibold text-white">New Document</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#272e40] text-[#7f8a9e]">
            <X size={14} />
          </button>
        </div>

        {/* Document Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[#8490a6] font-medium">Document Name</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="bg-[#12141a] border border-[#282f42] rounded px-3 py-1.5 text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#717b90] uppercase font-mono tracking-wider">
            Standard Presets
          </span>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setWidth(p.w);
                  setHeight(p.h);
                }}
                className={`p-2 rounded border text-left flex flex-col transition-colors ${
                  width === p.w && height === p.h
                    ? 'bg-[#273044] border-blue-500 text-white'
                    : 'bg-[#1e2330] border-[#272e40] text-[#a4aebd] hover:bg-[#242b3b]'
                }`}
              >
                <span className="font-medium text-[11px] truncate">{p.label}</span>
                <span className="text-[9px] font-mono text-[#78849b]">
                  {p.w} × {p.h}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#8490a6]">Width (px)</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Math.max(64, Math.min(8192, Number(e.target.value))))}
              className="bg-[#12141a] border border-[#282f42] rounded px-3 py-1.5 text-white font-mono outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#8490a6]">Height (px)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Math.max(64, Math.min(8192, Number(e.target.value))))}
              className="bg-[#12141a] border border-[#282f42] rounded px-3 py-1.5 text-white font-mono outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Depth & Profile */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#8490a6]">Color Depth</label>
            <select
              value={bitDepth}
              onChange={(e) => setBitDepth(Number(e.target.value) as BitDepth)}
              className="bg-[#12141a] border border-[#282f42] rounded px-2.5 py-1.5 text-white outline-none"
            >
              <option value={8}>8 Bits/Channel (sRGB Standard)</option>
              <option value={16}>16 Bits/Channel (Pro Studio HDR)</option>
              <option value={32}>32 Bits/Channel (Float Linear)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#8490a6]">Color Profile</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as ColorProfileName)}
              className="bg-[#12141a] border border-[#282f42] rounded px-2.5 py-1.5 text-white outline-none"
            >
              <option value="Display P3">Display P3 (Wide Gamut)</option>
              <option value="sRGB">sRGB IEC61966-2.1</option>
              <option value="Adobe RGB">Adobe RGB (1998)</option>
              <option value="Rec.2020">Rec.2020 (Cinema)</option>
            </select>
          </div>
        </div>

        {/* Background Content */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[#8490a6]">Background Contents</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'transparent', label: 'Transparent' },
              { id: 'white', label: 'White' },
              { id: 'black', label: 'Black' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setBackground(b.id as any)}
                className={`py-1.5 rounded border text-center text-[11px] transition-colors ${
                  background === b.id
                    ? 'bg-[#273044] border-blue-500 text-white font-medium'
                    : 'bg-[#1e2330] border-[#272e40] text-[#a4aebd]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#282f42] pt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#212636] hover:bg-[#2b3246] text-[#b8c2d2]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onCreateDocument(docName, width, height, bitDepth, profile, background);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Create Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
