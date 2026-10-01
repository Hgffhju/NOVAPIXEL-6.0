import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Layer } from '../types';

interface ChannelsPanelProps {
  layers: Layer[];
  documentWidth: number;
  documentHeight: number;
  channelVisibility: {
    rgb: boolean;
    red: boolean;
    green: boolean;
    blue: boolean;
  };
  onToggleChannel: (channel: 'rgb' | 'red' | 'green' | 'blue') => void;
}

export const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channelVisibility,
  onToggleChannel,
}) => {
  const channels = [
    { id: 'rgb' as const, name: 'RGB', shortcut: '⌘2', color: '#e2e8f0', gradient: 'linear-gradient(135deg, #ef4444 33%, #22c55e 33% 66%, #3b82f6 66%)' },
    { id: 'red' as const, name: 'Red', shortcut: '⌘3', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #991b1b)' },
    { id: 'green' as const, name: 'Green', shortcut: '⌘4', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #166534)' },
    { id: 'blue' as const, name: 'Blue', shortcut: '⌘5', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1e40af)' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b8c2d2] p-1.5">
      <div className="flex flex-col gap-1">
        {channels.map((ch) => {
          const isVisible = channelVisibility[ch.id];
          return (
            <div
              key={ch.id}
              onClick={() => onToggleChannel(ch.id)}
              className={`flex items-center gap-2.5 p-2 rounded border cursor-pointer transition-colors ${
                isVisible
                  ? 'bg-[#222736] border-[#2f384d] text-white hover:bg-[#282f42]'
                  : 'bg-[#1a1d27] border-[#242938] text-[#6d778d] opacity-60'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleChannel(ch.id);
                }}
                className="p-1 rounded hover:bg-[#2e374c] text-[#a4aebd]"
              >
                {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              {/* Channel Mini Thumbnail */}
              <div
                className="w-9 h-7 rounded border border-[#30384d] shrink-0"
                style={{ background: ch.gradient }}
              />

              <div className="flex-1 min-w-0 flex items-center justify-between">
                <span className="font-medium text-xs truncate" style={{ color: isVisible ? ch.color : undefined }}>
                  {ch.name}
                </span>
                <span className="text-[10px] font-mono text-[#6c778c]">
                  {ch.shortcut}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
