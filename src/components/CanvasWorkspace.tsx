import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Layer,
  ToolType,
  BrushSettings,
  CloneSettings,
  SelectionArea,
  CollabUser,
  CanvasComment,
  BitDepth,
  ColorProfileName,
  EyedropperSettings,
  ColorSamplerPoint,
} from '../types';
import {
  buildCurveLUT,
  buildLevelsLUT,
  evaluateMonotoneSpline,
} from '../engine/colorProfiles';
import {
  solvePoisson,
  boxBlur,
  findSpotDonor,
} from '../engine/poissonSolver';
import { MessageSquare, Check, X } from 'lucide-react';

interface CanvasWorkspaceProps {
  documentWidth: number;
  documentHeight: number;
  layers: Layer[];
  activeLayerId: string;
  currentTool: ToolType;
  brushSettings: BrushSettings;
  cloneSettings: CloneSettings;
  onUpdateClone: (settings: Partial<CloneSettings>) => void;
  selection: SelectionArea | null;
  onSetSelection: (sel: SelectionArea | null) => void;
  collaborators: CollabUser[];
  comments: CanvasComment[];
  onAddComment: (comment: { x: number; y: number; text: string }) => void;
  onResolveComment: (commentId: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onColorSampled: (color: string) => void;
  onSnapshot: () => void;
  foregroundColor: string;
  backgroundColor: string;
  onBroadcastCursor?: (x: number, y: number) => void;
  onSelectLayer?: (layerId: string) => void;
  colorSamplers?: ColorSamplerPoint[];
  onSetColorSamplers?: (samplers: ColorSamplerPoint[]) => void;
  eyedropperSettings?: EyedropperSettings;
  onHoveredColorChange?: (color: string) => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  documentWidth,
  documentHeight,
  layers,
  activeLayerId,
  currentTool,
  brushSettings,
  cloneSettings,
  onUpdateClone,
  selection,
  onSetSelection,
  collaborators,
  comments,
  onAddComment,
  onResolveComment,
  zoom,
  onZoomChange,
  pan,
  onPanChange,
  onColorSampled,
  onSnapshot,
  foregroundColor,
  backgroundColor,
  onBroadcastCursor,
  onSelectLayer,
  colorSamplers = [],
  onSetColorSamplers,
  eyedropperSettings = { sampleSize: 1, sampleSource: 'all', showLoupe: true },
  onHoveredColorChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointerPos, setLastPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [activeCommentDraft, setActiveCommentDraft] = useState<{ x: number; y: number; text: string } | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // Precision color sampler helper
  const sampleColorAt = useCallback(
    (canvasX: number, canvasY: number, size = 1, source: 'all' | 'current' = 'all') => {
      let targetCtx: CanvasRenderingContext2D | null = null;
      if (source === 'current') {
        const active = layers.find((l) => l.id === activeLayerId);
        targetCtx = active ? active.ctx : null;
      } else {
        targetCtx = compositeCanvasRef.current ? compositeCanvasRef.current.getContext('2d') : null;
      }

      if (!targetCtx) return { r: 0, g: 0, b: 0, a: 0, hex: '#000000' };

      const half = Math.floor(size / 2);
      const startX = Math.max(0, Math.min(documentWidth - 1, Math.round(canvasX) - half));
      const startY = Math.max(0, Math.min(documentHeight - 1, Math.round(canvasY) - half));
      const w = Math.max(1, Math.min(documentWidth - startX, size));
      const h = Math.max(1, Math.min(documentHeight - startY, size));

      const imgData = targetCtx.getImageData(startX, startY, w, h).data;
      let totalR = 0;
      let totalG = 0;
      let totalB = 0;
      let totalA = 0;
      const count = w * h;

      for (let i = 0; i < imgData.length; i += 4) {
        totalR += imgData[i];
        totalG += imgData[i + 1];
        totalB += imgData[i + 2];
        totalA += imgData[i + 3];
      }

      const r = Math.round(totalR / count);
      const g = Math.round(totalG / count);
      const b = Math.round(totalB / count);
      const a = totalA / count;

      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      return { r, g, b, a, hex };
    },
    [layers, activeLayerId, documentWidth, documentHeight]
  );

  // Active stroke / tool execution state
  const strokeStateRef = useRef<{
    lastX: number;
    lastY: number;
    points: [number, number][];
    startPos: [number, number];
    cloneSource: [number, number] | null;
    cloneAnchor: [number, number] | null;
  }>({
    lastX: 0,
    lastY: 0,
    points: [],
    startPos: [0, 0],
    cloneSource: null,
    cloneAnchor: null,
  });

  // Calculate canvas coordinate from client mouse event
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left - pan.x;
      const rawY = clientY - rect.top - pan.y;
      return {
        x: rawX / zoom,
        y: rawY / zoom,
      };
    },
    [pan, zoom]
  );

  // Redraw the main composite canvas with all layers and non-destructive adjustments
  const renderComposite = useCallback(() => {
    const compCanvas = compositeCanvasRef.current;
    if (!compCanvas) return;
    const ctx = compCanvas.getContext('2d');
    if (!ctx) return;

    if (compCanvas.width !== documentWidth || compCanvas.height !== documentHeight) {
      compCanvas.width = documentWidth;
      compCanvas.height = documentHeight;
    }

    ctx.clearRect(0, 0, documentWidth, documentHeight);

    // Composite layers bottom-up
    for (const layer of layers) {
      if (!layer.visible || layer.opacity <= 0) continue;

      if (layer.kind === 'adjustment' && layer.adjustment) {
        // Apply adjustment to the accumulated canvas underneath
        const imgData = ctx.getImageData(0, 0, documentWidth, documentHeight);
        const data = imgData.data;

        if (layer.adjustment.type === 'curves') {
          const lut = buildCurveLUT(layer.adjustment.data);
          const op = layer.opacity;
          for (let i = 0; i < data.length; i += 4) {
            const rNew = lut.r[data[i]];
            const gNew = lut.g[data[i + 1]];
            const bNew = lut.b[data[i + 2]];
            data[i] = Math.round(data[i] * (1 - op) + rNew * op);
            data[i + 1] = Math.round(data[i + 1] * (1 - op) + gNew * op);
            data[i + 2] = Math.round(data[i + 2] * (1 - op) + bNew * op);
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (layer.adjustment.type === 'levels') {
          const lut = buildLevelsLUT(layer.adjustment.data);
          const op = layer.opacity;
          for (let i = 0; i < data.length; i += 4) {
            const rNew = lut.r[data[i]];
            const gNew = lut.g[data[i + 1]];
            const bNew = lut.b[data[i + 2]];
            data[i] = Math.round(data[i] * (1 - op) + rNew * op);
            data[i + 1] = Math.round(data[i + 1] * (1 - op) + gNew * op);
            data[i + 2] = Math.round(data[i + 2] * (1 - op) + bNew * op);
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (layer.adjustment.type === 'hsl') {
          const { hue, saturation, lightness } = layer.adjustment.data;
          const op = layer.opacity;
          const satMult = 1 + saturation / 100;
          const lightAdd = (lightness / 100) * 128;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Simple HSL approx
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + (r - gray) * satMult + lightAdd;
            g = gray + (g - gray) * satMult + lightAdd;
            b = gray + (b - gray) * satMult + lightAdd;

            data[i] = Math.min(255, Math.max(0, Math.round(data[i] * (1 - op) + r * op)));
            data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] * (1 - op) + g * op)));
            data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] * (1 - op) + b * op)));
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (layer.adjustment.type === 'exposure') {
          const { exposure, toneMap } = layer.adjustment.data;
          const mult = Math.pow(2, exposure);
          const op = layer.opacity;

          for (let i = 0; i < data.length; i += 4) {
            let rNorm = (data[i] / 255) * mult;
            let gNorm = (data[i + 1] / 255) * mult;
            let bNorm = (data[i + 2] / 255) * mult;

            if (toneMap === 'reinhard') {
              rNorm = rNorm / (1 + rNorm);
              gNorm = gNorm / (1 + gNorm);
              bNorm = bNorm / (1 + bNorm);
            }

            data[i] = Math.min(255, Math.max(0, Math.round(data[i] * (1 - op) + rNorm * 255 * op)));
            data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] * (1 - op) + gNorm * 255 * op)));
            data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] * (1 - op) + bNorm * 255 * op)));
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (layer.adjustment.type === 'color-balance') {
          const { cyanRed, magentaGreen, yellowBlue } = layer.adjustment.data;
          const op = layer.opacity;
          for (let i = 0; i < data.length; i += 4) {
            const rNew = Math.min(255, Math.max(0, data[i] + cyanRed * 0.7));
            const gNew = Math.min(255, Math.max(0, data[i + 1] + magentaGreen * 0.7));
            const bNew = Math.min(255, Math.max(0, data[i + 2] + yellowBlue * 0.7));

            data[i] = Math.round(data[i] * (1 - op) + rNew * op);
            data[i + 1] = Math.round(data[i + 1] * (1 - op) + gNew * op);
            data[i + 2] = Math.round(data[i + 2] * (1 - op) + bNew * op);
          }
          ctx.putImageData(imgData, 0, 0);
        }
        continue;
      }

      // Draw standard raster / vector / text layer
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation =
        layer.blendMode === 'normal'
          ? 'source-over'
          : layer.blendMode === 'multiply'
          ? 'multiply'
          : layer.blendMode === 'screen'
          ? 'screen'
          : layer.blendMode === 'overlay'
          ? 'overlay'
          : 'source-over';

      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }
  }, [layers, documentWidth, documentHeight]);

  // Redraw overlays (selection marching ants, brush crosshairs, peer cursors, clone markers)
  const renderOverlay = useCallback(() => {
    const ov = overlayCanvasRef.current;
    if (!ov || !containerRef.current) return;
    const ctx = ov.getContext('2d');
    if (!ctx) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    if (ov.width !== w || ov.height !== h) {
      ov.width = w;
      ov.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    const toScreen = (x: number, y: number) => ({
      sx: x * zoom + pan.x,
      sy: y * zoom + pan.y,
    });

    // 1. Selection Area Marching Ants
    if (selection) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);

      if (selection.type === 'rect') {
        const { sx, sy } = toScreen(selection.x, selection.y);
        ctx.strokeRect(sx, sy, selection.width * zoom, selection.height * zoom);
      } else if (selection.type === 'ellipse') {
        const { sx, sy } = toScreen(selection.x + selection.width / 2, selection.y + selection.height / 2);
        ctx.beginPath();
        ctx.ellipse(
          sx,
          sy,
          (selection.width / 2) * zoom,
          (selection.height / 2) * zoom,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (selection.type === 'polygon' && selection.points) {
        ctx.beginPath();
        selection.points.forEach(([px, py], idx) => {
          const { sx, sy } = toScreen(px, py);
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Brush / Retouching Reticle
    if (
      mouseCanvasPos &&
      ['brush', 'eraser', 'heal', 'spot', 'clone'].includes(currentTool)
    ) {
      const { sx, sy } = toScreen(mouseCanvasPos.x, mouseCanvasPos.y);
      const radius = (brushSettings.size / 2) * zoom;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // If Clone or Heal, draw donor source point if set
      if (
        (currentTool === 'clone' || currentTool === 'heal') &&
        cloneSettings.sourcePoint
      ) {
        const [sourceX, sourceY] = cloneSettings.sourcePoint;
        let activeSourceX = sourceX;
        let activeSourceY = sourceY;

        if (cloneSettings.anchorPoint && strokeStateRef.current.cloneAnchor) {
          const dx = mouseCanvasPos.x - strokeStateRef.current.cloneAnchor[0];
          const dy = mouseCanvasPos.y - strokeStateRef.current.cloneAnchor[1];
          activeSourceX += dx;
          activeSourceY += dy;
        }

        const srcScreen = toScreen(activeSourceX, activeSourceY);
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(srcScreen.sx, srcScreen.sy, radius, 0, Math.PI * 2);
        ctx.moveTo(srcScreen.sx - 8, srcScreen.sy);
        ctx.lineTo(srcScreen.sx + 8, srcScreen.sy);
        ctx.moveTo(srcScreen.sx, srcScreen.sy - 8);
        ctx.lineTo(srcScreen.sx, srcScreen.sy + 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Gradient Vector Preview Line
    if (isPointerDown && currentTool === 'gradient' && mouseCanvasPos) {
      const [startX, startY] = strokeStateRef.current.startPos;
      const p1 = toScreen(startX, startY);
      const p2 = toScreen(mouseCanvasPos.x, mouseCanvasPos.y);

      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();

      // Start color indicator dot
      ctx.fillStyle = foregroundColor;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p1.sx, p1.sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // End color indicator dot
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      ctx.arc(p2.sx, p2.sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Vector Shape Live Drag Preview
    if (
      isPointerDown &&
      ['shape-rect', 'shape-ellipse', 'shape-star'].includes(currentTool) &&
      mouseCanvasPos
    ) {
      const [startX, startY] = strokeStateRef.current.startPos;
      const x = Math.min(startX, mouseCanvasPos.x);
      const y = Math.min(startY, mouseCanvasPos.y);
      const w = Math.abs(mouseCanvasPos.x - startX);
      const h = Math.abs(mouseCanvasPos.y - startY);
      const p1 = toScreen(x, y);

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = `${foregroundColor}33`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      if (currentTool === 'shape-rect') {
        ctx.fillRect(p1.sx, p1.sy, w * zoom, h * zoom);
        ctx.strokeRect(p1.sx, p1.sy, w * zoom, h * zoom);
      } else if (currentTool === 'shape-ellipse') {
        const cx = p1.sx + (w * zoom) / 2;
        const cy = p1.sy + (h * zoom) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, (w * zoom) / 2, (h * zoom) / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (currentTool === 'shape-star') {
        ctx.fillRect(p1.sx, p1.sy, w * zoom, h * zoom);
        ctx.strokeRect(p1.sx, p1.sy, w * zoom, h * zoom);
      }
      ctx.restore();
    }

    // 5. Crop Tool 3x3 Grid Overlay
    if (currentTool === 'crop' && selection) {
      const p = toScreen(selection.x, selection.y);
      const w = selection.width * zoom;
      const h = selection.height * zoom;

      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.sx, p.sy, w, h);

      // Rule of thirds grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(p.sx + (w * i) / 3, p.sy);
        ctx.lineTo(p.sx + (w * i) / 3, p.sy + h);
        ctx.moveTo(p.sx, p.sy + (h * i) / 3);
        ctx.lineTo(p.sx + w, p.sy + (h * i) / 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Photoshop Eyedropper Sampling Ring & Magnifier Loupe
    if (currentTool === 'eyedropper' && mouseCanvasPos && eyedropperSettings.showLoupe) {
      const sampled = sampleColorAt(
        mouseCanvasPos.x,
        mouseCanvasPos.y,
        eyedropperSettings.sampleSize,
        eyedropperSettings.sampleSource === 'current' ? 'current' : 'all'
      );
      const p = toScreen(mouseCanvasPos.x, mouseCanvasPos.y);

      // Loupe center placed slightly above cursor
      const lx = p.sx;
      const ly = p.sy - 44;
      const outerR = 34;
      const innerR = 24;

      ctx.save();

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // Inner Magnified Grid background
      ctx.beginPath();
      ctx.arc(lx, ly, innerR, 0, Math.PI * 2);
      ctx.fillStyle = '#12141a';
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Draw magnified 7x7 pixel grid from composite canvas
      const comp = compositeCanvasRef.current;
      if (comp) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, innerR - 1, 0, Math.PI * 2);
        ctx.clip();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          comp,
          Math.round(mouseCanvasPos.x) - 3,
          Math.round(mouseCanvasPos.y) - 3,
          7,
          7,
          lx - innerR,
          ly - innerR,
          innerR * 2,
          innerR * 2
        );
        ctx.restore();
      }

      // Center crosshair target pixel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - 3, ly - 3, 6, 6);

      // Top Half Outer Ring: Current Sampled Color
      ctx.beginPath();
      ctx.arc(lx, ly, (outerR + innerR) / 2, Math.PI, 0);
      ctx.strokeStyle = sampled.hex;
      ctx.lineWidth = outerR - innerR;
      ctx.stroke();

      // Bottom Half Outer Ring: Previous Foreground Color
      ctx.beginPath();
      ctx.arc(lx, ly, (outerR + innerR) / 2, 0, Math.PI);
      ctx.strokeStyle = foregroundColor;
      ctx.lineWidth = outerR - innerR;
      ctx.stroke();

      // Dividing lines & boundaries
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(lx, ly, outerR, 0, Math.PI * 2);
      ctx.arc(lx, ly, innerR, 0, Math.PI * 2);
      ctx.moveTo(lx - outerR, ly);
      ctx.lineTo(lx - innerR, ly);
      ctx.moveTo(lx + innerR, ly);
      ctx.lineTo(lx + outerR, ly);
      ctx.stroke();

      // Readout badge below loupe
      const badgeText = `${sampled.hex.toUpperCase()} · R:${sampled.r} G:${sampled.g} B:${sampled.b}`;
      ctx.font = 'bold 9px "Plus Jakarta Sans", monospace';
      const bW = ctx.measureText(badgeText).width + 12;
      ctx.fillStyle = 'rgba(18, 20, 26, 0.95)';
      ctx.strokeStyle = '#3b4356';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(lx - bW / 2, ly + outerR + 4, bW, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(badgeText, lx - bW / 2 + 6, ly + outerR + 15);

      ctx.restore();
    }

    // 7. Color Sampler Target Points
    if (colorSamplers && colorSamplers.length > 0) {
      colorSamplers.forEach((s, idx) => {
        const p = toScreen(s.x, s.y);
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        // Target crosshair
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 8, 0, Math.PI * 2);
        ctx.moveTo(p.sx - 12, p.sy);
        ctx.lineTo(p.sx + 12, p.sy);
        ctx.moveTo(p.sx, p.sy - 12);
        ctx.lineTo(p.sx + 12, p.sy);
        ctx.stroke();

        // Color center
        ctx.fillStyle = s.hex;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Number Badge
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(p.sx + 12, p.sy - 12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(String(idx + 1), p.sx + 9.5, p.sy - 9);

        ctx.restore();
      });
    }

    // 8. Layer Pick Tool Reticle & Name
    if (currentTool === 'layer-picker' && mouseCanvasPos) {
      const p = toScreen(mouseCanvasPos.x, mouseCanvasPos.y);

      // Find top visible layer with pixel at this point
      let hoveredLayerName = 'No Layer';
      for (let i = layers.length - 1; i >= 0; i--) {
        const l = layers[i];
        if (!l.visible || l.kind === 'adjustment') continue;
        const pixel = l.ctx.getImageData(
          Math.max(0, Math.min(documentWidth - 1, Math.round(mouseCanvasPos.x))),
          Math.max(0, Math.min(documentHeight - 1, Math.round(mouseCanvasPos.y))),
          1,
          1
        ).data;
        if (pixel[3] > 5) {
          hoveredLayerName = l.name;
          break;
        }
      }

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.sx - 8, p.sy - 8, 16, 16);
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy - 12);
      ctx.lineTo(p.sx, p.sy + 12);
      ctx.moveTo(p.sx - 12, p.sy);
      ctx.lineTo(p.sx + 12, p.sy);
      ctx.stroke();

      const label = `Layer: ${hoveredLayerName}`;
      ctx.font = 'bold 10px sans-serif';
      const lw = ctx.measureText(label).width + 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(p.sx + 12, p.sy - 22, lw, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(label, p.sx + 17, p.sy - 9);
      ctx.restore();
    }

    // 3. Live Collaborators Cursors & Labels
    collaborators.forEach((user) => {
      if (!user.cursor) return;
      const { sx, sy } = toScreen(user.cursor.x, user.cursor.y);

      ctx.save();
      // Cursor pointer shape
      ctx.fillStyle = user.color || '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 14, sy + 14);
      ctx.lineTo(sx + 5, sy + 14);
      ctx.lineTo(sx, sy + 19);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Name & Tool Tag
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      const tagText = `${user.name} (${user.cursor.activeTool || 'tool'})`;
      const textWidth = ctx.measureText(tagText).width;

      ctx.fillStyle = user.color || '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(sx + 16, sy + 6, textWidth + 10, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagText, sx + 21, sy + 18);
      ctx.restore();
    });
  }, [
    selection,
    mouseCanvasPos,
    currentTool,
    brushSettings.size,
    cloneSettings,
    collaborators,
    zoom,
    pan,
  ]);

  // Initial and reactive render triggers
  useEffect(() => {
    renderComposite();
  }, [renderComposite]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  // Stroke Execution (Bresenham-like dab interpolation)
  const drawDab = (
    layer: Layer,
    x: number,
    y: number,
    color: string,
    size: number,
    hardness: number,
    flow: number,
    opacity: number,
    isEraser: boolean = false
  ) => {
    const ctx = layer.ctx;
    const r = size / 2;

    ctx.save();
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      const grad = ctx.createRadialGradient(x, y, r * hardness, x, y, r);
      grad.addColorStop(0, `rgba(0,0,0,${flow * opacity})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      const grad = ctx.createRadialGradient(x, y, r * hardness, x, y, r);
      grad.addColorStop(0, color);
      // Soft outer edge
      grad.addColorStop(1, 'transparent');

      ctx.globalAlpha = flow * opacity;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Perform continuous stroke interpolation between two points
  const drawStrokeSegment = (
    layer: Layer,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) => {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const step = Math.max(1, (brushSettings.size / 2) * 0.25);
    const steps = Math.ceil(dist / step);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 1 : i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;

      if (currentTool === 'brush') {
        drawDab(
          layer,
          x,
          y,
          brushSettings.color,
          brushSettings.size,
          brushSettings.hardness,
          brushSettings.flow,
          brushSettings.opacity,
          false
        );
      } else if (currentTool === 'eraser') {
        drawDab(
          layer,
          x,
          y,
          '#000000',
          brushSettings.size,
          brushSettings.hardness,
          brushSettings.flow,
          brushSettings.opacity,
          true
        );
      } else if (currentTool === 'clone' && cloneSettings.sourcePoint) {
        // Clone stamp dab
        const [srcX, srcY] = cloneSettings.sourcePoint;
        const anchor = strokeStateRef.current.cloneAnchor || [x, y];
        const dx = x - anchor[0];
        const dy = y - anchor[1];
        const currSrcX = srcX + dx;
        const currSrcY = srcY + dy;

        const r = brushSettings.size / 2;
        layer.ctx.save();
        layer.ctx.beginPath();
        layer.ctx.arc(x, y, r, 0, Math.PI * 2);
        layer.ctx.clip();
        layer.ctx.globalAlpha = brushSettings.flow * brushSettings.opacity;

        const comp = compositeCanvasRef.current;
        if (comp) {
          layer.ctx.drawImage(
            comp,
            currSrcX - r,
            currSrcY - r,
            brushSettings.size,
            brushSettings.size,
            x - r,
            y - r,
            brushSettings.size,
            brushSettings.size
          );
        }
        layer.ctx.restore();
      }
    }
  };

  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        isSpacePressedRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setIsPointerDown(true);
    setLastPointerPos({ x: e.clientX, y: e.clientY });

    // Middle-click or Space-pan
    if (e.button === 1 || currentTool === 'hand' || isSpacePressedRef.current) {
      setIsPanning(true);
      return;
    }

    if (e.button !== 0) return;

    // Alt+Click sets clone / heal source point
    if (e.altKey && (currentTool === 'clone' || currentTool === 'heal')) {
      onUpdateClone({
        sourcePoint: [coords.x, coords.y],
        anchorPoint: [coords.x, coords.y],
      });
      return;
    }

    // Eyedropper Color Picker Tool
    if (currentTool === 'eyedropper') {
      const sampled = sampleColorAt(
        coords.x,
        coords.y,
        eyedropperSettings.sampleSize,
        eyedropperSettings.sampleSource === 'current' ? 'current' : 'all'
      );
      onColorSampled(sampled.hex);
      onHoveredColorChange?.(sampled.hex);
      renderOverlay();
      return;
    }

    // Color Sampler Targets Tool
    if (currentTool === 'color-sampler') {
      const sampled = sampleColorAt(coords.x, coords.y, 1, 'all');
      const newPoint: ColorSamplerPoint = {
        id: 'samp-' + Date.now(),
        x: Math.round(coords.x),
        y: Math.round(coords.y),
        r: sampled.r,
        g: sampled.g,
        b: sampled.b,
        hex: sampled.hex,
      };
      const existing = colorSamplers || [];
      const updated = existing.length >= 4 ? [...existing.slice(1), newPoint] : [...existing, newPoint];
      onSetColorSamplers?.(updated);
      renderOverlay();
      return;
    }

    // Layer Picker Tool (Auto-Select Layer under point)
    if (currentTool === 'layer-picker') {
      for (let i = layers.length - 1; i >= 0; i--) {
        const l = layers[i];
        if (!l.visible || l.kind === 'adjustment') continue;
        const pixel = l.ctx.getImageData(
          Math.max(0, Math.min(documentWidth - 1, Math.round(coords.x))),
          Math.max(0, Math.min(documentHeight - 1, Math.round(coords.y))),
          1,
          1
        ).data;
        if (pixel[3] > 5) {
          onSelectLayer?.(l.id);
          break;
        }
      }
      renderOverlay();
      return;
    }

    // Spot healing execution
    if (currentTool === 'spot') {
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      const comp = compositeCanvasRef.current;
      if (activeLayer && comp) {
        const r = brushSettings.size / 2;
        const donor = findSpotDonor(comp, coords.x, coords.y, r);
        if (donor) {
          activeLayer.ctx.save();
          activeLayer.ctx.beginPath();
          activeLayer.ctx.arc(coords.x, coords.y, r, 0, Math.PI * 2);
          activeLayer.ctx.clip();
          activeLayer.ctx.drawImage(
            comp,
            coords.x + donor.ox - r,
            coords.y + donor.oy - r,
            brushSettings.size,
            brushSettings.size,
            coords.x - r,
            coords.y - r,
            brushSettings.size,
            brushSettings.size
          );
          activeLayer.ctx.restore();
          renderComposite();
          onSnapshot();
        }
      }
      return;
    }

    // Magic Wand / Color Range Selection
    if (currentTool === 'magic-wand') {
      const radius = Math.max(30, brushSettings.size * 2);
      const x0 = Math.max(0, Math.round(coords.x - radius));
      const y0 = Math.max(0, Math.round(coords.y - radius));
      const w0 = Math.min(documentWidth - x0, radius * 2);
      const h0 = Math.min(documentHeight - y0, radius * 2);

      onSetSelection({
        type: 'ellipse',
        x: x0,
        y: y0,
        width: w0,
        height: h0,
      });
      return;
    }

    // Text Tool: Stamp typographic layer
    if (currentTool === 'text') {
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      if (activeLayer && !activeLayer.locked) {
        activeLayer.ctx.save();
        activeLayer.ctx.font = `700 ${Math.max(24, brushSettings.size)}px "Syne", sans-serif`;
        activeLayer.ctx.fillStyle = foregroundColor;
        activeLayer.ctx.fillText('NovaPixel Studio', coords.x, coords.y);
        activeLayer.ctx.restore();
        renderComposite();
        onSnapshot();
      }
      return;
    }

    // Gradient / Vector Shapes / Crop Initialisation
    if (['gradient', 'shape-rect', 'shape-ellipse', 'shape-star', 'crop'].includes(currentTool)) {
      strokeStateRef.current.startPos = [coords.x, coords.y];
      return;
    }

    // Marquee / Lasso Selection Initialisation
    if (['marquee-rect', 'marquee-ellipse', 'lasso'].includes(currentTool)) {
      strokeStateRef.current.startPos = [coords.x, coords.y];
      strokeStateRef.current.points = [[coords.x, coords.y]];
      return;
    }

    // Standard brush / clone stroke
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    strokeStateRef.current.lastX = coords.x;
    strokeStateRef.current.lastY = coords.y;
    strokeStateRef.current.cloneAnchor = [coords.x, coords.y];

    drawStrokeSegment(activeLayer, coords.x, coords.y, coords.x, coords.y);
    renderComposite();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setMouseCanvasPos(coords);

    // Real-time cursor broadcasting for multi-user collaboration
    onBroadcastCursor?.(coords.x, coords.y);

    // Live continuous sampling while dragging or hovering with Eyedropper
    if (currentTool === 'eyedropper') {
      const sampled = sampleColorAt(
        coords.x,
        coords.y,
        eyedropperSettings.sampleSize,
        eyedropperSettings.sampleSource === 'current' ? 'current' : 'all'
      );
      onHoveredColorChange?.(sampled.hex);
      if (isPointerDown) {
        onColorSampled(sampled.hex);
      }
      renderOverlay();
      return;
    }

    // Layer Picker or Color Sampler hover reticle update
    if (currentTool === 'layer-picker' || currentTool === 'color-sampler') {
      renderOverlay();
      return;
    }

    if (isPanning && lastPointerPos) {
      const dx = e.clientX - lastPointerPos.x;
      const dy = e.clientY - lastPointerPos.y;
      onPanChange({ x: pan.x + dx, y: pan.y + dy });
      setLastPointerPos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isPointerDown) {
      renderOverlay();
      return;
    }

    // Gradient / Shapes / Crop Dragging
    if (['gradient', 'shape-rect', 'shape-ellipse', 'shape-star', 'crop'].includes(currentTool)) {
      renderOverlay();
      return;
    }

    // Selection Dragging
    if (['marquee-rect', 'marquee-ellipse', 'lasso'].includes(currentTool)) {
      const [startX, startY] = strokeStateRef.current.startPos;
      if (currentTool === 'lasso') {
        strokeStateRef.current.points.push([coords.x, coords.y]);
        onSetSelection({
          type: 'polygon',
          points: strokeStateRef.current.points,
          x: Math.min(...strokeStateRef.current.points.map((p) => p[0])),
          y: Math.min(...strokeStateRef.current.points.map((p) => p[1])),
          width: 0,
          height: 0,
        });
      } else {
        const x = Math.min(startX, coords.x);
        const y = Math.min(startY, coords.y);
        const width = Math.abs(coords.x - startX);
        const height = Math.abs(coords.y - startY);

        onSetSelection({
          type: currentTool === 'marquee-rect' ? 'rect' : 'ellipse',
          x,
          y,
          width,
          height,
        });
      }
      renderOverlay();
      return;
    }

    // Drawing
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    drawStrokeSegment(
      activeLayer,
      strokeStateRef.current.lastX,
      strokeStateRef.current.lastY,
      coords.x,
      coords.y
    );

    strokeStateRef.current.lastX = coords.x;
    strokeStateRef.current.lastY = coords.y;

    renderComposite();
    renderOverlay();
  };

  const handlePointerUp = () => {
    if (!isPointerDown) return;

    const activeLayer = layers.find((l) => l.id === activeLayerId);

    // Gradient Execution
    if (currentTool === 'gradient' && activeLayer && !activeLayer.locked && mouseCanvasPos) {
      const [startX, startY] = strokeStateRef.current.startPos;
      const ctx = activeLayer.ctx;
      ctx.save();
      ctx.globalAlpha = brushSettings.opacity;
      const grad = ctx.createLinearGradient(startX, startY, mouseCanvasPos.x, mouseCanvasPos.y);
      grad.addColorStop(0, foregroundColor);
      grad.addColorStop(1, backgroundColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, documentWidth, documentHeight);
      ctx.restore();
      renderComposite();
      onSnapshot();
    }

    // Vector Shapes Execution
    if (
      ['shape-rect', 'shape-ellipse', 'shape-star'].includes(currentTool) &&
      activeLayer &&
      !activeLayer.locked &&
      mouseCanvasPos
    ) {
      const [startX, startY] = strokeStateRef.current.startPos;
      const x = Math.min(startX, mouseCanvasPos.x);
      const y = Math.min(startY, mouseCanvasPos.y);
      const w = Math.abs(mouseCanvasPos.x - startX);
      const h = Math.abs(mouseCanvasPos.y - startY);

      if (w > 2 && h > 2) {
        const ctx = activeLayer.ctx;
        ctx.save();
        ctx.globalAlpha = brushSettings.opacity;
        ctx.fillStyle = foregroundColor;
        ctx.strokeStyle = backgroundColor;
        ctx.lineWidth = Math.max(1, brushSettings.size / 8);

        if (currentTool === 'shape-rect') {
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
        } else if (currentTool === 'shape-ellipse') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (currentTool === 'shape-star') {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const spikes = 5;
          const outerR = Math.min(w, h) / 2;
          const innerR = outerR * 0.45;
          let rot = (Math.PI / 2) * 3;
          const step = Math.PI / spikes;

          ctx.beginPath();
          ctx.moveTo(cx, cy - outerR);
          for (let i = 0; i < spikes; i++) {
            let sx = cx + Math.cos(rot) * outerR;
            let sy = cy + Math.sin(rot) * outerR;
            ctx.lineTo(sx, sy);
            rot += step;
            sx = cx + Math.cos(rot) * innerR;
            sy = cy + Math.sin(rot) * innerR;
            ctx.lineTo(sx, sy);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerR);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
        renderComposite();
        onSnapshot();
      }
    }

    // Crop Tool Drag Box
    if (currentTool === 'crop' && mouseCanvasPos) {
      const [startX, startY] = strokeStateRef.current.startPos;
      const x = Math.min(startX, mouseCanvasPos.x);
      const y = Math.min(startY, mouseCanvasPos.y);
      const w = Math.abs(mouseCanvasPos.x - startX);
      const h = Math.abs(mouseCanvasPos.y - startY);
      if (w > 10 && h > 10) {
        onSetSelection({
          type: 'rect',
          x,
          y,
          width: w,
          height: h,
        });
      }
    }

    if (['brush', 'eraser', 'clone', 'heal'].includes(currentTool)) {
      onSnapshot();
    }
    setIsPointerDown(false);
    setIsPanning(false);
    setLastPointerPos(null);
  };

  // Wheel zoom around cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(32, Math.max(0.05, zoom * zoomFactor));

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    onZoomChange(newZoom);
    onPanChange({ x: newPanX, y: newPanY });
  };

  // Drop annotation comment directly on canvas
  const handleStageClick = (e: React.MouseEvent) => {
    if (e.altKey && e.shiftKey) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setActiveCommentDraft({ x: Math.round(coords.x), y: Math.round(coords.y), text: '' });
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        setMouseCanvasPos(null);
        handlePointerUp();
      }}
      onClick={handleStageClick}
      className="flex-1 h-full w-full relative overflow-hidden bg-[#0d0f14] cursor-crosshair select-none"
    >
      {/* Centered Document Paper Container */}
      <div
        className="absolute transition-transform duration-75 ease-out shadow-2xl origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: documentWidth,
          height: documentHeight,
        }}
      >
        {/* Checkerboard Backdrop for Transparency */}
        <div className="absolute inset-0 canvas-checkerboard border border-[#2b3346] shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />

        {/* Main Composite Canvas */}
        <canvas
          ref={compositeCanvasRef}
          width={documentWidth}
          height={documentHeight}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Real-time Collaboration Pin Comments */}
        {comments.map((comment) => {
          const isSelected = selectedCommentId === comment.id;
          return (
            <div
              key={comment.id}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: comment.x, top: comment.y }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCommentId(isSelected ? null : comment.id);
              }}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg border transition-transform ${
                  comment.resolved
                    ? 'bg-neutral-700 border-neutral-500 text-neutral-300'
                    : 'bg-blue-600 border-white text-white hover:scale-125'
                }`}
              >
                <MessageSquare size={10} />
              </div>

              {/* Comment Tooltip Popup */}
              {isSelected && (
                <div
                  className="absolute left-6 top-0 w-64 bg-[#1b1f2b] border border-[#2e374c] rounded-lg shadow-2xl p-2.5 text-xs z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#293144] mb-2">
                    <span className="font-semibold text-white">{comment.userName}</span>
                    <button
                      onClick={() => onResolveComment(comment.id)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Check size={10} />
                      {comment.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                  </div>
                  <p className="text-[#c4ccd9] leading-relaxed mb-2">{comment.text}</p>
                  <div className="text-[9px] text-[#6d778d]">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Draft Comment Creator Box */}
        {activeCommentDraft && (
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-1/2 bg-[#1b1f2c] border border-blue-500/80 rounded-lg shadow-2xl p-3 w-64 text-xs"
            style={{ left: activeCommentDraft.x, top: activeCommentDraft.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-400">Add Team Pin</span>
              <button
                onClick={() => setActiveCommentDraft(null)}
                className="text-[#7d879d] hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
            <textarea
              autoFocus
              placeholder="Leave feedback or direction for the team..."
              value={activeCommentDraft.text}
              onChange={(e) =>
                setActiveCommentDraft({ ...activeCommentDraft, text: e.target.value })
              }
              className="w-full bg-[#12141a] border border-[#282f42] rounded p-2 text-white text-xs resize-none h-16 outline-none focus:border-blue-500 mb-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveCommentDraft(null)}
                className="px-2 py-1 rounded bg-[#242a3a] text-[#adb5c7] hover:text-white text-[11px]"
              >
                Cancel
              </button>
              <button
                disabled={!activeCommentDraft.text.trim()}
                onClick={() => {
                  onAddComment({
                    x: activeCommentDraft.x,
                    y: activeCommentDraft.y,
                    text: activeCommentDraft.text.trim(),
                  });
                  setActiveCommentDraft(null);
                }}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] disabled:opacity-40"
              >
                Post Pin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Screen-Space Overlays (Marching Ants, Brush Crosshairs, Peer Cursors) */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Viewport Info HUD */}
      <div className="absolute left-3 bottom-2 text-[10px] font-mono text-[#6c778e] pointer-events-none z-20 flex items-center gap-3 bg-[#14161f]/80 backdrop-blur-sm px-2.5 py-1 rounded border border-[#212636]">
        <span>
          {documentWidth} × {documentHeight} px
        </span>
        <span aria-hidden="true">·</span>
        <span>Zoom {Math.round(zoom * 100)}%</span>
        {mouseCanvasPos && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              X: {Math.round(mouseCanvasPos.x)} Y: {Math.round(mouseCanvasPos.y)}
            </span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span className="text-blue-400">Shift+Alt+Click to drop Pin</span>
      </div>
    </div>
  );
};
