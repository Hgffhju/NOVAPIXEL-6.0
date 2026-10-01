import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Sliders,
  Palette,
  Check,
  Loader2,
  Layers,
  ArrowRight,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { SelectionArea, AdjustmentType, CurvesAdjustment, LevelsAdjustment } from '../types';

interface AIStudioPanelProps {
  selection: SelectionArea | null;
  onApplyGenerativeFill: (prompt: string) => Promise<void>;
  onApplyAIAdjustment: (adjustment: AdjustmentType, name: string) => void;
  onIsolateSubject: () => void;
  getCanvasSnapshot: () => string;
}

export const AIStudioPanel: React.FC<AIStudioPanelProps> = ({
  selection,
  onApplyGenerativeFill,
  onApplyAIAdjustment,
  onIsolateSubject,
  getCanvasSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'fill' | 'director' | 'grade'>('fill');
  const [fillPrompt, setFillPrompt] = useState('');
  const [isGeneratingFill, setIsGeneratingFill] = useState(false);

  // Art Director state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [critiqueData, setCritiqueData] = useState<any>(null);

  // Neural Grade state
  const [gradePrompt, setGradePrompt] = useState('Cinematic 35mm film grade with warm amber highlights and rich dark shadows');
  const [isGeneratingGrade, setIsGeneratingGrade] = useState(false);

  // Pre-built fill suggestions
  const fillPresets = [
    'Add soft golden hour studio rim light',
    'Minimalist architectural travertine backdrop',
    'Volumetric cinematic haze and neon reflections',
    'Pristine studio bokeh with neutral gradient',
  ];

  const handleRunFill = async () => {
    if (!fillPrompt.trim() && fillPresets.length > 0) return;
    setIsGeneratingFill(true);
    try {
      await onApplyGenerativeFill(fillPrompt || fillPresets[0]);
    } finally {
      setIsGeneratingFill(false);
    }
  };

  const handleRunCritique = async () => {
    setIsAnalyzing(true);
    try {
      const imageBase64 = getCanvasSnapshot();
      const res = await fetch('/api/ai/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (data.success) {
        setCritiqueData(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunGrade = async () => {
    if (!gradePrompt.trim()) return;
    setIsGeneratingGrade(true);
    try {
      const res = await fetch('/api/ai/prompt-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: gradePrompt }),
      });
      const data = await res.json();
      if (data.success && data.adjustment) {
        const adj = data.adjustment;
        const curvesData: CurvesAdjustment = {
          RGB: { pts: adj.curves?.RGB || [[0, 0], [1, 1]] },
          R: { pts: adj.curves?.R || [[0, 0], [1, 1]] },
          G: { pts: adj.curves?.G || [[0, 0], [1, 1]] },
          B: { pts: adj.curves?.B || [[0, 0], [1, 1]] },
        };
        onApplyAIAdjustment({ type: 'curves', data: curvesData }, `AI Grade: ${adj.title || 'Custom'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingGrade(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181b24] select-none text-xs text-[#b6c0d0]">
      {/* Sub-tab Navigation */}
      <div className="flex items-center border-b border-[#252b3b] bg-[#151720] p-1">
        <button
          onClick={() => setActiveTab('fill')}
          className={`flex-1 py-1.5 rounded font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'fill'
              ? 'bg-[#252c3e] text-white shadow-sm'
              : 'text-[#8590a4] hover:text-white'
          }`}
        >
          <Wand2 size={12} className="text-blue-400" />
          <span>Generative Fill</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('director');
            if (!critiqueData) handleRunCritique();
          }}
          className={`flex-1 py-1.5 rounded font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'director'
              ? 'bg-[#252c3e] text-white shadow-sm'
              : 'text-[#8590a4] hover:text-white'
          }`}
        >
          <Sparkles size={12} className="text-amber-400" />
          <span>Art Director</span>
        </button>

        <button
          onClick={() => setActiveTab('grade')}
          className={`flex-1 py-1.5 rounded font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'grade'
              ? 'bg-[#252c3e] text-white shadow-sm'
              : 'text-[#8590a4] hover:text-white'
          }`}
        >
          <Sliders size={12} className="text-indigo-400" />
          <span>Neural Grade</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* TAB 1: Generative Fill */}
        {activeTab === 'fill' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-white">Generative Inpainting & Synthesis</span>
              <p className="text-[11px] text-[#788398] leading-relaxed">
                {selection
                  ? 'Active selection detected. Describe what to synthesize inside the selected area.'
                  : 'Select an area using the Lasso (L) or Marquee (M) tool, or synthesize into a new layer.'}
              </p>
            </div>

            {/* Prompt input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#939eb2] font-medium">Prompt</label>
              <textarea
                value={fillPrompt}
                onChange={(e) => setFillPrompt(e.target.value)}
                placeholder="e.g. Add realistic sunlight beam with subtle volumetric dust..."
                className="w-full bg-[#12141a] border border-[#2b3346] rounded-md p-2 text-white text-xs outline-none focus:border-blue-500 h-20 resize-none"
              />
            </div>

            {/* Quick Inspiration Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#6d778c] uppercase font-mono tracking-wider">
                Studio Actions
              </span>
              <div className="flex flex-col gap-1">
                {fillPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFillPrompt(preset)}
                    className="text-left px-2 py-1 rounded bg-[#1e2330] hover:bg-[#272e40] text-[11px] text-[#c1c9d8] border border-[#293144] truncate transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              disabled={isGeneratingFill}
              onClick={handleRunFill}
              className="mt-1 w-full py-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isGeneratingFill ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Synthesizing Canvas...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Execute Generative Fill</span>
                </>
              )}
            </button>

            {/* Subject Cutout Button */}
            <div className="border-t border-[#252b3b] pt-3 mt-1 flex flex-col gap-1.5">
              <span className="font-semibold text-white">Semantic AI Segmentation</span>
              <button
                onClick={onIsolateSubject}
                className="w-full py-1.5 rounded bg-[#202534] hover:bg-[#2b3246] border border-[#30394f] text-blue-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Layers size={12} />
                <span>1-Click Isolate Subject to Layer</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Art Director Critique */}
        {activeTab === 'director' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Art Director Assessment</span>
              <button
                disabled={isAnalyzing}
                onClick={handleRunCritique}
                className="p-1 rounded bg-[#202534] hover:bg-[#2b3246] text-[#9ca6b9] hover:text-white"
                title="Re-analyze image"
              >
                <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
              </button>
            </div>

            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#79849a]">
                <Loader2 size={18} className="animate-spin text-blue-400" />
                <span>Evaluating composition & tonal curve...</span>
              </div>
            ) : critiqueData ? (
              <div className="flex flex-col gap-3">
                {/* Score & Tonal card */}
                <div className="bg-[#12141a] border border-[#272e40] rounded-md p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8692a7]">Harmony Score</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {critiqueData.overallScore}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-[#ccd3df] leading-relaxed">
                    {critiqueData.tonalBalance}
                  </p>
                </div>

                {/* Key Palette */}
                {critiqueData.palette && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-[#6d778c] uppercase font-mono tracking-wider">
                      Dominant Color Palette
                    </span>
                    <div className="flex h-5 rounded overflow-hidden border border-[#2d354a]">
                      {critiqueData.palette.map((hex: string, i: number) => (
                        <div
                          key={i}
                          className="flex-1 cursor-pointer"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#6d778c] uppercase font-mono tracking-wider">
                    Retouching Recommendations
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {critiqueData.recommendations?.map((rec: string, i: number) => (
                      <div
                        key={i}
                        className="bg-[#1a1e2a] border border-[#272f42] rounded p-2 text-[11px] text-[#c0c8d7] flex items-start gap-2"
                      >
                        <span className="text-blue-400 font-mono">0{i + 1}.</span>
                        <span className="flex-1">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#717b90]">
                Click refresh to run automated Art Director analysis.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Neural Prompt-to-Grade */}
        {activeTab === 'grade' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-white">Prompt-to-Adjustment</span>
              <p className="text-[11px] text-[#788398] leading-relaxed">
                Describe desired lighting, color grading, or film stock. Gemini generates exact mathematical Curves & Levels adjustment layers.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#939eb2] font-medium">Style / Look Description</label>
              <textarea
                value={gradePrompt}
                onChange={(e) => setGradePrompt(e.target.value)}
                className="w-full bg-[#12141a] border border-[#2b3346] rounded-md p-2 text-white text-xs outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#6d778c] uppercase font-mono tracking-wider">
                Popular Cinematic Grades
              </span>
              {[
                'Fincher Moody Teal & Amber with compressed blacks',
                'Vintage Kodachrome 64 warm highlights and faded shadows',
                'Scandinavian Minimalist desaturated cool neutrals',
                'High-Key Fashion Clean with bright specular roll-off',
              ].map((style, idx) => (
                <button
                  key={idx}
                  onClick={() => setGradePrompt(style)}
                  className="text-left px-2 py-1 rounded bg-[#1e2330] hover:bg-[#272e40] text-[11px] text-[#c1c9d8] border border-[#293144] truncate transition-colors"
                >
                  + {style}
                </button>
              ))}
            </div>

            <button
              disabled={isGeneratingGrade}
              onClick={handleRunGrade}
              className="mt-1 w-full py-2 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isGeneratingGrade ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Computing Curve Splines...</span>
                </>
              ) : (
                <>
                  <Sliders size={13} />
                  <span>Generate Adjustment Layer</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
