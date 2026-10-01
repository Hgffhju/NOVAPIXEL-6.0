import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  Download,
  Share2,
  Undo2,
  Redo2,
  Sparkles,
  Users,
  Eye,
  Sliders,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  FileImage,
  ChevronDown,
  Check,
} from 'lucide-react';
import { BitDepth, ColorProfileName, CollabUser } from '../types';

interface TopMenuBarProps {
  projectName: string;
  zoom: number;
  bitDepth: BitDepth;
  colorProfile: ColorProfileName;
  linearLight: boolean;
  canUndo: boolean;
  canRedo: boolean;
  collaborators: CollabUser[];
  onUndo: () => void;
  onRedo: () => void;
  onNew: () => void;
  onOpenSample: (sampleId: string) => void;
  onExport: () => void;
  onToggleCollab: () => void;
  onToggleAI: () => void;
  onFitScreen: () => void;
  onZoom100: () => void;
  onSetBitDepth: (depth: BitDepth) => void;
  onSetColorProfile: (profile: ColorProfileName) => void;
  onSetLinearLight: (linear: boolean) => void;
  onApplyFilter: (filter: 'blur' | 'sharpen' | 'invert' | 'desaturate') => void;
  onSelectAll: () => void;
  onDeselect: () => void;
  onAddLayer: () => void;
  onAddAdjustment: (type: 'curves' | 'levels' | 'hsl' | 'exposure' | 'color-balance') => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  projectName,
  zoom,
  bitDepth,
  colorProfile,
  linearLight,
  canUndo,
  canRedo,
  collaborators,
  onUndo,
  onRedo,
  onNew,
  onOpenSample,
  onExport,
  onToggleCollab,
  onToggleAI,
  onFitScreen,
  onZoom100,
  onSetBitDepth,
  onSetColorProfile,
  onSetLinearLight,
  onApplyFilter,
  onSelectAll,
  onDeselect,
  onAddLayer,
  onAddAdjustment,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems: Record<string, Array<{ label: string; action?: () => void; shortcut?: string; divider?: boolean; disabled?: boolean }>> = {
    File: [
      { label: 'New Document...', action: onNew, shortcut: '⌘N' },
      { label: 'Sample: Vogue Editorial Portrait', action: () => onOpenSample('fashion-editorial') },
      { label: 'Sample: Neo-Tokyo Matte Painting', action: () => onOpenSample('cyberpunk-city') },
      { label: 'Sample: Minimalist Ceramic Product', action: () => onOpenSample('studio-product') },
      { divider: true, label: '' },
      { label: 'Export As (PNG / JPEG / WebP / SVG)...', action: onExport, shortcut: '⌘⌥W' },
      { label: 'Save Project Archive (.novapix)', action: onExport, shortcut: '⌘S' },
    ],
    Edit: [
      { label: 'Undo', action: onUndo, shortcut: '⌘Z', disabled: !canUndo },
      { label: 'Redo', action: onRedo, shortcut: '⇧⌘Z', disabled: !canRedo },
      { divider: true, label: '' },
      { label: 'Content-Aware Fill (Selection required)', action: () => onToggleAI() },
      { label: 'Purge History', action: () => {} },
    ],
    Image: [
      { label: 'Mode: 8 Bits/Channel', action: () => onSetBitDepth(8) },
      { label: 'Mode: 16 Bits/Channel (Pro HDR)', action: () => onSetBitDepth(16) },
      { label: 'Mode: 32 Bits/Channel (Float Linear)', action: () => onSetBitDepth(32) },
      { divider: true, label: '' },
      { label: 'Color Profile: Display P3 (Wide Gamut)', action: () => onSetColorProfile('Display P3') },
      { label: 'Color Profile: sRGB (Standard Web)', action: () => onSetColorProfile('sRGB') },
      { label: 'Color Profile: Adobe RGB (Print & Prepress)', action: () => onSetColorProfile('Adobe RGB') },
      { label: 'Color Profile: Rec.2020 (Cinema)', action: () => onSetColorProfile('Rec.2020') },
      { divider: true, label: '' },
      { label: linearLight ? '✓ Linear-Light Blending (Enabled)' : 'Linear-Light Blending', action: () => onSetLinearLight(!linearLight) },
    ],
    Layer: [
      { label: 'New Raster Layer', action: onAddLayer, shortcut: '⇧⌘N' },
      { divider: true, label: '' },
      { label: '+ Curves Adjustment Layer', action: () => onAddAdjustment('curves') },
      { label: '+ Levels Adjustment Layer', action: () => onAddAdjustment('levels') },
      { label: '+ Hue/Saturation/Lightness', action: () => onAddAdjustment('hsl') },
      { label: '+ Exposure & Tone Mapping', action: () => onAddAdjustment('exposure') },
      { label: '+ Color Balance', action: () => onAddAdjustment('color-balance') },
    ],
    Select: [
      { label: 'Select All', action: onSelectAll, shortcut: '⌘A' },
      { label: 'Deselect', action: onDeselect, shortcut: '⌘D' },
      { label: 'AI Select Subject (Auto-Mask)', action: onToggleAI },
    ],
    Filter: [
      { label: 'Gaussian Blur (Convolve)...', action: () => onApplyFilter('blur') },
      { label: 'Unsharp Mask / Sharpen...', action: () => onApplyFilter('sharpen') },
      { label: 'Invert Color Channels', action: () => onApplyFilter('invert'), shortcut: '⌘I' },
      { label: 'Desaturate (Rec. 709 Luminance)', action: () => onApplyFilter('desaturate'), shortcut: '⇧⌘U' },
    ],
    View: [
      { label: 'Fit on Screen', action: onFitScreen, shortcut: '⌘0' },
      { label: 'Actual Pixels (100%)', action: onZoom100, shortcut: '⌘1' },
      { label: 'Zoom In', action: () => {}, shortcut: '⌘+' },
      { label: 'Zoom Out', action: () => {}, shortcut: '⌘-' },
    ],
  };

  return (
    <header className="h-10 bg-[#16181f] border-b border-[#252a38] flex items-center justify-between px-3 text-xs select-none z-30 shrink-0">
      {/* Zone 1: Wordmark & Top Dropdown Menus */}
      <div className="flex items-center gap-4" ref={menuRef}>
        <div className="flex items-center gap-2 pr-2 border-r border-[#262c3c]">
          <span className="font-['Syne'] font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] inline-block"></span>
            NovaPixel
          </span>
          <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase font-mono">
            Pro
          </span>
        </div>

        {/* Application Menus */}
        <nav className="flex items-center gap-1">
          {Object.keys(menuItems).map((menuName) => (
            <div key={menuName} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === menuName ? null : menuName)}
                className={`px-2.5 py-1 rounded transition-colors text-[#c4cbda] hover:text-white ${
                  activeMenu === menuName ? 'bg-[#282f42] text-white' : 'hover:bg-[#1f2432]'
                }`}
              >
                {menuName}
              </button>

              {activeMenu === menuName && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-[#1b1f2b] border border-[#2b3347] rounded-md shadow-2xl py-1 z-50">
                  {menuItems[menuName].map((item, idx) =>
                    item.divider ? (
                      <div key={idx} className="my-1 border-t border-[#262c3e]" />
                    ) : (
                      <button
                        key={idx}
                        disabled={item.disabled}
                        onClick={() => {
                          item.action?.();
                          setActiveMenu(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition-colors ${
                          item.disabled
                            ? 'opacity-40 cursor-not-allowed text-[#7d879c]'
                            : 'hover:bg-blue-600 hover:text-white text-[#d4dae8]'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] font-mono opacity-60 ml-3">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Zone 2: Document State & Color Specs */}
      <div className="hidden lg:flex items-center gap-3 text-[#8b95aa] text-[11px] font-mono">
        <span className="text-[#d8dde9] font-sans font-medium">{projectName}</span>
        <span aria-hidden="true" className="text-[#3b4356]">·</span>
        <span>{Math.round(zoom * 100)}%</span>
        <span aria-hidden="true" className="text-[#3b4356]">·</span>
        <span className="px-1.5 py-0.5 rounded bg-[#1e2332] text-blue-300 border border-[#2a3246]">
          {bitDepth}-bit {colorProfile}
          {linearLight ? ' (Linear)' : ''}
        </span>
      </div>

      {/* Zone 3: Collaboration & Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo quick icons */}
        <div className="flex items-center border-r border-[#262c3c] pr-2 mr-1 gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-[#23293a] text-[#a4aebd] disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-[#23293a] text-[#a4aebd] disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Live Collaborators Avatar Pill */}
        <button
          onClick={onToggleCollab}
          title="Team Collaboration & Live Cursors"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1d2230] hover:bg-[#252b3d] border border-[#2d364c] transition-colors text-white"
        >
          <Users size={12} className="text-emerald-400" />
          <div className="flex -space-x-1.5 items-center">
            {collaborators.map((user) => (
              <img
                key={user.id}
                src={user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'}
                alt={user.name}
                className="w-4 h-4 rounded-full border border-[#16181f] object-cover"
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-emerald-300 ml-0.5">
            {collaborators.length + 1} live
          </span>
        </button>

        {/* AI Co-pilot Quick Toggle */}
        <button
          onClick={onToggleAI}
          title="AI Creative Assistant (Generative Fill, Style, Prompt Adjustments)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-sm transition-all text-xs"
        >
          <Sparkles size={12} />
          <span>AI Studio</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1 px-3 py-1 rounded bg-[#272e40] hover:bg-[#323b52] border border-[#38435d] text-white font-medium transition-colors text-xs"
        >
          <Download size={12} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
