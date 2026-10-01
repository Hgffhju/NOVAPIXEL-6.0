import React, { useState, useRef, useEffect } from 'react';
import {
  Layer,
  AdjustmentType,
  CurvesAdjustment,
  LevelsAdjustment,
  HSLAdjustment,
  ExposureAdjustment,
  ColorBalanceAdjustment,
} from '../types';
import { evaluateMonotoneSpline } from '../engine/colorProfiles';

interface AdjustmentsPanelProps {
  activeLayer: Layer | null;
  onUpdateAdjustment: (adjustment: AdjustmentType) => void;
}

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  activeLayer,
  onUpdateAdjustment,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'RGB' | 'R' | 'G' | 'B'>('RGB');
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingPointIdx, setDraggingPointIdx] = useState<number | null>(null);

  const adjustment = activeLayer?.adjustment;

  // Redraw interactive Curves canvas
  useEffect(() => {
    if (!adjustment || adjustment.type !== 'curves') return;
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Grid lines (quarter divisions)
    ctx.strokeStyle = '#272d3e';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const pos = (i * size) / 4;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Diagonal reference line
    ctx.strokeStyle = '#323a4f';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Spline curve
    const pts = adjustment.data[selectedChannel].pts;
    const strokeColor =
      selectedChannel === 'R'
        ? '#ef4444'
        : selectedChannel === 'G'
        ? '#22c55e'
        : selectedChannel === 'B'
        ? '#3b82f6'
        : '#e2e8f0';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 2) {
      const normX = x / size;
      const normY = evaluateMonotoneSpline(pts, normX);
      const canvasY = size - normY * size;
      if (x === 0) ctx.moveTo(x, canvasY);
      else ctx.lineTo(x, canvasY);
    }
    ctx.stroke();

    // Control points
    pts.forEach(([px, py]) => {
      ctx.fillStyle = strokeColor;
      ctx.strokeStyle = '#181b24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px * size, size - py * size, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [adjustment, selectedChannel]);

  if (!activeLayer || !adjustment) {
    return (
      <div className="p-4 text-center text-[#737e93] text-xs flex flex-col items-center justify-center h-full">
        <span>No adjustment layer selected</span>
        <span className="text-[11px] mt-1 text-[#5b6477]">
          Add an adjustment layer from the Layers panel footer to edit live tone curves.
        </span>
      </div>
    );
  }

  // Handle Curves Pointer Events
  const handleCurvePointerDown = (e: React.PointerEvent) => {
    if (adjustment.type !== 'curves') return;
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));

    const pts = [...adjustment.data[selectedChannel].pts];
    // Check if clicked close to an existing point
    const hitIdx = pts.findIndex((p) => Math.hypot(p[0] - x, p[1] - y) < 0.08);

    if (hitIdx !== -1) {
      setDraggingPointIdx(hitIdx);
    } else {
      // Add new point and sort by x
      pts.push([x, y]);
      pts.sort((a, b) => a[0] - b[0]);
      const newIdx = pts.findIndex((p) => p[0] === x);
      setDraggingPointIdx(newIdx);

      const updated: CurvesAdjustment = {
        ...adjustment.data,
        [selectedChannel]: { pts },
      };
      onUpdateAdjustment({ type: 'curves', data: updated });
    }

    canvas.setPointerCapture(e.pointerId);
  };

  const handleCurvePointerMove = (e: React.PointerEvent) => {
    if (draggingPointIdx === null || adjustment.type !== 'curves') return;
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));

    const pts = [...adjustment.data[selectedChannel].pts];
    const isEndpoint = draggingPointIdx === 0 || draggingPointIdx === pts.length - 1;

    // Endpoints can only move vertically
    pts[draggingPointIdx] = [
      isEndpoint
        ? pts[draggingPointIdx][0]
        : Math.min(
            pts[draggingPointIdx + 1][0] - 0.01,
            Math.max(pts[draggingPointIdx - 1][0] + 0.01, x)
          ),
      y,
    ];

    const updated: CurvesAdjustment = {
      ...adjustment.data,
      [selectedChannel]: { pts },
    };
    onUpdateAdjustment({ type: 'curves', data: updated });
  };

  const handleCurvePointerUp = () => {
    setDraggingPointIdx(null);
  };

  const handleCurveDblClick = (e: React.MouseEvent) => {
    if (adjustment.type !== 'curves') return;
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;

    const pts = [...adjustment.data[selectedChannel].pts];
    const hitIdx = pts.findIndex((p) => Math.hypot(p[0] - x, p[1] - y) < 0.08);

    // Delete interior points on double click
    if (hitIdx > 0 && hitIdx < pts.length - 1) {
      pts.splice(hitIdx, 1);
      const updated: CurvesAdjustment = {
        ...adjustment.data,
        [selectedChannel]: { pts },
      };
      onUpdateAdjustment({ type: 'curves', data: updated });
    }
  };

  return (
    <div className="p-3 text-xs flex flex-col gap-3 select-none text-[#b4bece]">
      {/* Curves Adjustment Editor */}
      {adjustment.type === 'curves' && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Curves</span>
            <div className="flex items-center gap-1 bg-[#202534] p-0.5 rounded border border-[#2b3346]">
              {(['RGB', 'R', 'G', 'B'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    selectedChannel === ch
                      ? ch === 'R'
                        ? 'bg-red-600 text-white'
                        : ch === 'G'
                        ? 'bg-green-600 text-white'
                        : ch === 'B'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#3b82f6] text-white'
                      : 'text-[#8e99ae] hover:text-white'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Curve Graph Canvas */}
          <div className="bg-[#12141a] border border-[#2c3448] rounded-md p-1.5 flex items-center justify-center">
            <canvas
              ref={curveCanvasRef}
              width={200}
              height={200}
              onPointerDown={handleCurvePointerDown}
              onPointerMove={handleCurvePointerMove}
              onPointerUp={handleCurvePointerUp}
              onDoubleClick={handleCurveDblClick}
              className="cursor-crosshair w-full aspect-square max-w-[200px]"
            />
          </div>
          <span className="text-[10px] text-[#6d778c] text-center">
            Click to add control point · Drag to adjust · Double-click to remove
          </span>
        </div>
      )}

      {/* Levels Adjustment Editor */}
      {adjustment.type === 'levels' && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Levels</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as any)}
              className="bg-[#202534] border border-[#2b3346] rounded px-2 py-0.5 text-white text-[11px]"
            >
              <option value="RGB">RGB Composite</option>
              <option value="R">Red Channel</option>
              <option value="G">Green Channel</option>
              <option value="B">Blue Channel</option>
            </select>
          </div>

          {(() => {
            const chData = adjustment.data[selectedChannel];
            const updateChannel = (fields: Partial<typeof chData>) => {
              const updated = {
                ...adjustment.data,
                [selectedChannel]: { ...chData, ...fields },
              };
              onUpdateAdjustment({ type: 'levels', data: updated });
            };

            return (
              <div className="flex flex-col gap-2 bg-[#12141a] p-2.5 rounded border border-[#272e40]">
                <label className="flex items-center justify-between">
                  <span>Input Black</span>
                  <input
                    type="range"
                    min={0}
                    max={254}
                    value={chData.ib}
                    onChange={(e) => updateChannel({ ib: Number(e.target.value) })}
                    className="w-24 cursor-pointer"
                  />
                  <span className="font-mono text-white w-7 text-right">{chData.ib}</span>
                </label>

                <label className="flex items-center justify-between">
                  <span>Gamma</span>
                  <input
                    type="range"
                    min={0.1}
                    max={3.0}
                    step={0.01}
                    value={chData.g}
                    onChange={(e) => updateChannel({ g: Number(e.target.value) })}
                    className="w-24 cursor-pointer"
                  />
                  <span className="font-mono text-white w-7 text-right">
                    {chData.g.toFixed(2)}
                  </span>
                </label>

                <label className="flex items-center justify-between">
                  <span>Input White</span>
                  <input
                    type="range"
                    min={1}
                    max={255}
                    value={chData.iw}
                    onChange={(e) => updateChannel({ iw: Number(e.target.value) })}
                    className="w-24 cursor-pointer"
                  />
                  <span className="font-mono text-white w-7 text-right">{chData.iw}</span>
                </label>

                <div className="border-t border-[#252b3b] pt-2 mt-1 flex flex-col gap-2">
                  <label className="flex items-center justify-between">
                    <span>Output Black</span>
                    <input
                      type="range"
                      min={0}
                      max={254}
                      value={chData.ob}
                      onChange={(e) => updateChannel({ ob: Number(e.target.value) })}
                      className="w-24 cursor-pointer"
                    />
                    <span className="font-mono text-white w-7 text-right">{chData.ob}</span>
                  </label>

                  <label className="flex items-center justify-between">
                    <span>Output White</span>
                    <input
                      type="range"
                      min={1}
                      max={255}
                      value={chData.ow}
                      onChange={(e) => updateChannel({ ow: Number(e.target.value) })}
                      className="w-24 cursor-pointer"
                    />
                    <span className="font-mono text-white w-7 text-right">{chData.ow}</span>
                  </label>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* HSL Adjustment Editor */}
      {adjustment.type === 'hsl' && (
        <div className="flex flex-col gap-3">
          <span className="font-semibold text-white">Hue / Saturation</span>
          <div className="flex flex-col gap-2.5 bg-[#12141a] p-2.5 rounded border border-[#272e40]">
            <label className="flex items-center justify-between">
              <span>Hue</span>
              <input
                type="range"
                min={-180}
                max={180}
                value={adjustment.data.hue}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'hsl',
                    data: { ...adjustment.data, hue: Number(e.target.value) },
                  })
                }
                className="w-24 cursor-pointer"
              />
              <span className="font-mono text-white w-8 text-right">{adjustment.data.hue}°</span>
            </label>

            <label className="flex items-center justify-between">
              <span>Saturation</span>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustment.data.saturation}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'hsl',
                    data: { ...adjustment.data, saturation: Number(e.target.value) },
                  })
                }
                className="w-24 cursor-pointer"
              />
              <span className="font-mono text-white w-8 text-right">{adjustment.data.saturation}%</span>
            </label>

            <label className="flex items-center justify-between">
              <span>Lightness</span>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustment.data.lightness}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'hsl',
                    data: { ...adjustment.data, lightness: Number(e.target.value) },
                  })
                }
                className="w-24 cursor-pointer"
              />
              <span className="font-mono text-white w-8 text-right">{adjustment.data.lightness}%</span>
            </label>
          </div>
        </div>
      )}

      {/* Exposure & Tonemapping */}
      {adjustment.type === 'exposure' && (
        <div className="flex flex-col gap-3">
          <span className="font-semibold text-white">Exposure & Tone Mapping</span>
          <div className="flex flex-col gap-2.5 bg-[#12141a] p-2.5 rounded border border-[#272e40]">
            <label className="flex items-center justify-between">
              <span>Exposure</span>
              <input
                type="range"
                min={-4}
                max={4}
                step={0.1}
                value={adjustment.data.exposure}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'exposure',
                    data: { ...adjustment.data, exposure: Number(e.target.value) },
                  })
                }
                className="w-24 cursor-pointer"
              />
              <span className="font-mono text-white w-10 text-right">
                {adjustment.data.exposure > 0 ? '+' : ''}
                {adjustment.data.exposure.toFixed(1)} EV
              </span>
            </label>

            <label className="flex items-center justify-between">
              <span>Tone Map</span>
              <select
                value={adjustment.data.toneMap}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'exposure',
                    data: { ...adjustment.data, toneMap: e.target.value as any },
                  })
                }
                className="bg-[#202534] border border-[#2e374c] rounded px-2 py-0.5 text-white text-[11px]"
              >
                <option value="none">Linear Pass</option>
                <option value="reinhard">Reinhard Tonemap</option>
                <option value="aces">ACES Filmic</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Color Balance */}
      {adjustment.type === 'color-balance' && (
        <div className="flex flex-col gap-3">
          <span className="font-semibold text-white">Color Balance</span>
          <div className="flex flex-col gap-2.5 bg-[#12141a] p-2.5 rounded border border-[#272e40]">
            <label className="flex items-center justify-between">
              <span className="text-cyan-400">Cyan</span>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustment.data.cyanRed}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'color-balance',
                    data: { ...adjustment.data, cyanRed: Number(e.target.value) },
                  })
                }
                className="w-24 cursor-pointer"
              />
              <span className="text-red-400">Red</span>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-pink-400">Magenta</span>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustment.data.magentaGreen}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'color-balance',
                    data: { ...adjustment.data, magentaGreen: Number(e.target.value) },
                  })
                }
                className="w-24 cursor-pointer"
              />
              <span className="text-green-400">Green</span>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-yellow-400">Yellow</span>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustment.data.yellowBlue}
                onChange={(e) =>
                  onUpdateAdjustment({
                    type: 'color-balance',
                    data: { ...adjustment.data, yellowBlue: Number(e.target.value) },
                  })
                }
                className="w-24 cursor-pointer"
              />
              <span className="text-blue-400">Blue</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
