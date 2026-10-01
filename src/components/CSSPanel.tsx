import React, { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import { Layer } from '../types';

interface CSSPanelProps {
  activeLayer: Layer | null;
}

export const CSSPanel: React.FC<CSSPanelProps> = ({ activeLayer }) => {
  const [copied, setCopied] = useState(false);

  if (!activeLayer) {
    return (
      <div className="p-4 text-center text-[#737e93] text-xs flex flex-col items-center justify-center h-full">
        <span>No layer selected</span>
      </div>
    );
  }

  const generateCSS = (): string => {
    const lines: string[] = [];
    lines.push(`/* Layer: ${activeLayer.name} */`);
    lines.push(`opacity: ${activeLayer.opacity};`);

    if (activeLayer.blendMode !== 'normal') {
      lines.push(`mix-blend-mode: ${activeLayer.blendMode};`);
    }

    if (activeLayer.kind === 'text' && activeLayer.textProps) {
      const t = activeLayer.textProps;
      lines.push(`font-family: '${t.fontFamily}', sans-serif;`);
      lines.push(`font-size: ${t.fontSize}px;`);
      lines.push(`font-weight: ${t.fontWeight};`);
      if (t.fontStyle === 'italic') lines.push(`font-style: italic;`);
      if (t.textDecoration === 'underline') lines.push(`text-decoration: underline;`);
      if (t.textTransform === 'uppercase') lines.push(`text-transform: uppercase;`);
      if (t.tracking) lines.push(`letter-spacing: ${t.tracking}px;`);
      if (t.leading) lines.push(`line-height: ${t.leading}px;`);
      if (t.textAlign) lines.push(`text-align: ${t.textAlign};`);
      lines.push(`color: ${t.color};`);
    }

    if (activeLayer.effects?.dropShadow?.enabled) {
      const ds = activeLayer.effects.dropShadow;
      lines.push(`filter: drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${ds.color});`);
    }

    return lines.join('\n');
  };

  const cssCode = generateCSS();

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b8c2d2] p-3 gap-3">
      <div className="flex items-center justify-between border-b border-[#252b3b] pb-2">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <Code2 size={14} className="text-blue-400" />
          <span>CSS Inspector</span>
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2b3346] text-blue-300 border border-[#2e374c] text-[10px] transition-colors"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy CSS'}</span>
        </button>
      </div>

      <div className="flex-1 bg-[#12141a] border border-[#282f42] rounded-md p-2.5 font-mono text-[11px] text-[#93c5fd] overflow-auto whitespace-pre leading-relaxed select-text">
        {cssCode}
      </div>
      <span className="text-[10px] text-[#6d778d]">
        Export styles directly into your web, mobile, or design system components.
      </span>
    </div>
  );
};
