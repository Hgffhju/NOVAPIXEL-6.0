import React from 'react';
import { HistoryItem } from '../types';
import { History, Camera, RotateCcw, Clock } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  currentIndex: number;
  onJumpToHistory: (index: number) => void;
  onTakeSnapshot: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onJumpToHistory,
  onTakeSnapshot,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b4bece]">
      <div className="p-2.5 border-b border-[#252b3b] bg-[#151720] flex items-center justify-between">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <History size={13} className="text-blue-400" />
          <span>History & Snapshots</span>
        </span>
        <button
          onClick={onTakeSnapshot}
          className="px-2 py-0.5 rounded bg-[#202534] hover:bg-[#2b3346] text-blue-300 border border-[#2d364c] flex items-center gap-1 text-[10px]"
        >
          <Camera size={11} />
          <span>New Snapshot</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
        {history.map((item, idx) => {
          const isCurrent = idx === currentIndex;
          const isUndone = idx > currentIndex;

          return (
            <div
              key={item.id}
              onClick={() => onJumpToHistory(idx)}
              className={`px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer transition-colors ${
                isCurrent
                  ? 'bg-blue-600/90 text-white font-medium'
                  : isUndone
                  ? 'text-[#5f697d] hover:bg-[#1f2330]'
                  : 'text-[#ccd4e2] hover:bg-[#222736]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Clock size={11} className={isCurrent ? 'text-white' : 'text-[#6b758b]'} />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="text-[9px] font-mono opacity-60 ml-2">
                #{idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
