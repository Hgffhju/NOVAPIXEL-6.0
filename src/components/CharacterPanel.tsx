import React from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { Layer } from '../types';

interface CharacterPanelProps {
  activeLayer: Layer | null;
  onUpdateTextProps: (props: Partial<NonNullable<Layer['textProps']>>) => void;
  foregroundColor: string;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  activeLayer,
  onUpdateTextProps,
  foregroundColor,
}) => {
  const textProps = activeLayer?.textProps || {
    text: 'Sample Text',
    fontSize: 28,
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '600',
    fontStyle: 'normal',
    textDecoration: 'none',
    textTransform: 'none',
    tracking: 0,
    leading: 34,
    textAlign: 'left',
    color: foregroundColor,
    x: 100,
    y: 100,
  };

  const isTextLayer = activeLayer?.kind === 'text';

  const fonts = [
    'Plus Jakarta Sans',
    'Syne',
    'JetBrains Mono',
    'Arial',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Impact',
    'Trebuchet MS',
    'Verdana',
  ];

  const fontWeights = ['300', '400', '500', '600', '700', '800'];

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b8c2d2] p-3 gap-3 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-[#252b3b] pb-2">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <Type size={14} className="text-blue-400" />
          <span>Character & Typography</span>
        </span>
        {isTextLayer ? (
          <span className="text-[10px] font-mono text-emerald-400">Text Layer Active</span>
        ) : (
          <span className="text-[10px] font-mono text-[#6c778d]">Default Style</span>
        )}
      </div>

      {/* Font Family */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-[#8490a6]">Font Family</label>
        <select
          value={textProps.fontFamily}
          onChange={(e) => onUpdateTextProps({ fontFamily: e.target.value })}
          className="bg-[#202534] border border-[#2e374c] rounded px-2.5 py-1.5 text-white text-xs outline-none"
        >
          {fonts.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Font Weight & Size */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#8490a6]">Font Weight</label>
          <select
            value={textProps.fontWeight}
            onChange={(e) => onUpdateTextProps({ fontWeight: e.target.value })}
            className="bg-[#202534] border border-[#2e374c] rounded px-2 py-1 text-white text-xs outline-none"
          >
            {fontWeights.map((w) => (
              <option key={w} value={w}>
                {w === '400' ? 'Regular' : w === '600' ? 'SemiBold' : w === '700' ? 'Bold' : w}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#8490a6]">Size (px)</label>
          <input
            type="number"
            min={6}
            max={300}
            value={textProps.fontSize}
            onChange={(e) => onUpdateTextProps({ fontSize: Number(e.target.value) })}
            className="bg-[#202534] border border-[#2e374c] rounded px-2 py-1 text-white text-xs font-mono outline-none"
          />
        </div>
      </div>

      {/* Tracking & Leading */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#8490a6]">Tracking (px)</label>
          <input
            type="number"
            min={-10}
            max={50}
            value={textProps.tracking || 0}
            onChange={(e) => onUpdateTextProps({ tracking: Number(e.target.value) })}
            className="bg-[#202534] border border-[#2e374c] rounded px-2 py-1 text-white text-xs font-mono outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#8490a6]">Leading (Line Height)</label>
          <input
            type="number"
            min={10}
            max={400}
            value={textProps.leading || 34}
            onChange={(e) => onUpdateTextProps({ leading: Number(e.target.value) })}
            className="bg-[#202534] border border-[#2e374c] rounded px-2 py-1 text-white text-xs font-mono outline-none"
          />
        </div>
      </div>

      {/* Formatting Toggles (Faux Bold, Italic, All Caps, Underline) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-[#8490a6]">Styling</span>
        <div className="flex items-center gap-1.5 bg-[#14161f] p-1 rounded border border-[#272e40]">
          <button
            onClick={() =>
              onUpdateTextProps({
                fontWeight: textProps.fontWeight === '700' ? '400' : '700',
              })
            }
            className={`p-1.5 rounded transition-colors ${
              textProps.fontWeight === '700'
                ? 'bg-blue-600 text-white'
                : 'text-[#8490a6] hover:text-white'
            }`}
            title="Bold"
          >
            <Bold size={13} />
          </button>

          <button
            onClick={() =>
              onUpdateTextProps({
                fontStyle: textProps.fontStyle === 'italic' ? 'normal' : 'italic',
              })
            }
            className={`p-1.5 rounded transition-colors ${
              textProps.fontStyle === 'italic'
                ? 'bg-blue-600 text-white'
                : 'text-[#8490a6] hover:text-white'
            }`}
            title="Italic"
          >
            <Italic size={13} />
          </button>

          <button
            onClick={() =>
              onUpdateTextProps({
                textTransform: textProps.textTransform === 'uppercase' ? 'none' : 'uppercase',
              })
            }
            className={`px-2 py-1 rounded font-bold text-[10px] transition-colors ${
              textProps.textTransform === 'uppercase'
                ? 'bg-blue-600 text-white'
                : 'text-[#8490a6] hover:text-white'
            }`}
            title="All Caps"
          >
            TT
          </button>

          <button
            onClick={() =>
              onUpdateTextProps({
                textDecoration: textProps.textDecoration === 'underline' ? 'none' : 'underline',
              })
            }
            className={`p-1.5 rounded transition-colors ${
              textProps.textDecoration === 'underline'
                ? 'bg-blue-600 text-white'
                : 'text-[#8490a6] hover:text-white'
            }`}
            title="Underline"
          >
            <Underline size={13} />
          </button>
        </div>
      </div>

      {/* Paragraph Alignment */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-[#8490a6]">Paragraph Alignment</span>
        <div className="flex items-center gap-1 bg-[#14161f] p-1 rounded border border-[#272e40]">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onUpdateTextProps({ textAlign: align })}
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors ${
                textProps.textAlign === align
                  ? 'bg-blue-600 text-white'
                  : 'text-[#8490a6] hover:text-white'
              }`}
            >
              {align === 'left' ? (
                <AlignLeft size={13} />
              ) : align === 'center' ? (
                <AlignCenter size={13} />
              ) : (
                <AlignRight size={13} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live Text Content Input if Active Layer is Text */}
      {isTextLayer && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#252b3b]">
          <label className="text-[11px] text-[#8490a6]">Layer Text Content</label>
          <textarea
            value={textProps.text}
            onChange={(e) => onUpdateTextProps({ text: e.target.value })}
            className="w-full bg-[#12141a] border border-[#2b3346] rounded p-2 text-white text-xs outline-none focus:border-blue-500 resize-none h-20"
          />
        </div>
      )}
    </div>
  );
};
