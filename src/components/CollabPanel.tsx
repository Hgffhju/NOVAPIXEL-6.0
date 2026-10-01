import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  MessageSquare,
  Activity,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { CollabUser, CanvasComment } from '../types';

interface CollabPanelProps {
  collaborators: CollabUser[];
  comments: CanvasComment[];
  onResolveComment: (commentId: string) => void;
  onFocusComment: (x: number, y: number) => void;
  currentUser?: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const CollabPanel: React.FC<CollabPanelProps> = ({
  collaborators,
  comments,
  onResolveComment,
  onFocusComment,
  currentUser,
  onSignIn,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'pins' | 'activity'>('team');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const activities = [
    { user: 'Elena Rostova', action: 'tuned Levels highlight gamma (+0.08)', time: '4m ago' },
    { user: 'Marcus Vance', action: 'calibrated Display P3 32-bit linear-light pipeline', time: '12m ago' },
    { user: 'Nova AI Copilot', action: 'synthesized Poisson content-aware background patch', time: '18m ago' },
    { user: 'Elena Rostova', action: 'added Curves adjustment layer [Cinematic Fincher]', time: '25m ago' },
  ];

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredComments = comments.filter((c) => (showResolved ? true : !c.resolved));

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b8c2d2]">
      {/* Collab Header */}
      <div className="p-3 border-b border-[#252b3b] bg-[#151720] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">Cloud Collab</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
            Firestore Live
          </span>
        </div>

        {/* User Account / Auth Card */}
        <div className="flex items-center justify-between p-2 rounded bg-[#1c212e] border border-[#2b3447]">
          {currentUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 truncate">
                <img
                  src={currentUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={currentUser.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-blue-400 object-cover shrink-0"
                />
                <div className="truncate">
                  <div className="text-[11px] font-semibold text-white truncate">
                    {currentUser.displayName || 'Authenticated Artist'}
                  </div>
                  <div className="text-[9px] text-[#717c91] truncate font-mono">
                    {currentUser.email || 'Google Account'}
                  </div>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="text-[10px] text-red-400 hover:text-red-300 ml-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#8490a6]">Sign in to sync your edits</span>
              <button
                onClick={onSignIn}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[10px]"
              >
                Sign In (Google)
              </button>
            </div>
          )}
        </div>

        {/* Share Invite button */}
        <button
          onClick={handleCopyInvite}
          className="w-full py-1.5 rounded bg-[#202534] hover:bg-[#2a3144] border border-[#2f384d] text-white flex items-center justify-center gap-1.5 transition-colors text-[11px]"
        >
          {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Real-Time Invite Link'}</span>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center border-b border-[#252b3b] p-1 bg-[#161821]">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
            activeTab === 'team' ? 'bg-[#252c3e] text-white' : 'text-[#7d889c] hover:text-white'
          }`}
        >
          Team ({collaborators.length + 1})
        </button>
        <button
          onClick={() => setActiveTab('pins')}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
            activeTab === 'pins' ? 'bg-[#252c3e] text-white' : 'text-[#7d889c] hover:text-white'
          }`}
        >
          Pins ({comments.filter((c) => !c.resolved).length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
            activeTab === 'activity' ? 'bg-[#252c3e] text-white' : 'text-[#7d889c] hover:text-white'
          }`}
        >
          Activity
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="flex flex-col gap-2.5">
            {/* You (Host) */}
            <div className="flex items-center gap-2.5 p-2 rounded bg-[#1e2330] border border-[#283144]">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[11px]">
                You
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white truncate">You (Master Artist)</span>
                  <span className="text-[9px] text-blue-400 font-mono">Host</span>
                </div>
                <div className="text-[10px] text-[#717b90]">Desktop Studio App</div>
              </div>
            </div>

            {/* Team Peers */}
            {collaborators.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2.5 p-2 rounded bg-[#1b1f2b] border border-[#242b3b]"
              >
                <div className="relative">
                  <img
                    src={user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#2d364c]"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#1b1f2b]"
                    style={{ backgroundColor: user.color || '#3b82f6' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#d3dae8] truncate">{user.name}</span>
                    <span className="text-[9px] font-mono text-emerald-400">Online</span>
                  </div>
                  <div className="text-[10px] text-[#717b90] flex items-center justify-between">
                    <span>{user.role}</span>
                    <span className="text-[9px] font-mono text-amber-300">
                      Tool: {user.cursor?.activeTool || 'viewing'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Cross-Platform Ecosystem note */}
            <div className="mt-2 p-2.5 rounded bg-[#13151b] border border-[#232938] flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Laptop size={11} className="text-blue-400" />
                <span>Seamless Cross-Platform</span>
              </span>
              <p className="text-[11px] text-[#78849b] leading-relaxed">
                Connect your iPad, mobile stylus, or remote monitor instantly. Changes, brushes, and AI workflows sync with zero latency.
              </p>
            </div>
          </div>
        )}

        {/* PINS TAB */}
        {activeTab === 'pins' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] text-[#7d889d]">
                Tip: Shift+Alt+Click on canvas to drop new pin
              </span>
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="text-[10px] text-blue-400 hover:text-blue-300"
              >
                {showResolved ? 'Hide Resolved' : 'Show All'}
              </button>
            </div>

            {filteredComments.length === 0 ? (
              <div className="text-center py-8 text-[#6d778d]">
                No pins here. Drop annotations on canvas to discuss edits with your team.
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  onClick={() => onFocusComment(comment.x, comment.y)}
                  className={`p-2 rounded border cursor-pointer transition-colors flex flex-col gap-1.5 ${
                    comment.resolved
                      ? 'bg-[#161820] border-[#222634] opacity-60'
                      : 'bg-[#1b202c] border-[#2b354a] hover:border-blue-500/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-[11px] truncate">
                      {comment.userName}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolveComment(comment.id);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Check size={10} />
                      {comment.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#ccd4e2] leading-relaxed">{comment.text}</p>
                  <div className="text-[9px] text-[#6d778d] font-mono">
                    Coord: [{comment.x}, {comment.y}]
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="flex flex-col gap-2">
            {activities.map((act, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-[#1a1e28] border border-[#242b3a] flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-white">{act.user}</span>
                  <span className="text-[9px] text-[#6b758b] font-mono">{act.time}</span>
                </div>
                <p className="text-[11px] text-[#a9b4c7]">{act.action}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
