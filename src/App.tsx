import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layer,
  ToolType,
  BitDepth,
  ColorProfileName,
  BrushSettings,
  CloneSettings,
  SelectionArea,
  CollabUser,
  CanvasComment,
  HistoryItem,
  AdjustmentType,
  BlendMode,
} from './types';
import { SAMPLE_PROJECTS } from './engine/sampleProjects';
import { TopMenuBar } from './components/TopMenuBar';
import { ToolBar } from './components/ToolBar';
import { ContextOptionsBar } from './components/ContextOptionsBar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { LayersPanel } from './components/LayersPanel';
import { AdjustmentsPanel } from './components/AdjustmentsPanel';
import { AIStudioPanel } from './components/AIStudioPanel';
import { CollabPanel } from './components/CollabPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ColorPickerModal } from './components/ColorPickerModal';
import { ExportModal } from './components/ExportModal';
import { NewCanvasModal } from './components/NewCanvasModal';
import {
  Layers,
  Sliders,
  Sparkles,
  Users,
  History,
  Palette,
  Maximize2,
  FolderOpen,
} from 'lucide-react';
import {
  applyGaussianBlur,
  applySharpen,
  applyInvert,
  applyDesaturate,
} from './engine/filters';

export default function App() {
  // Document Dimensions and Metadata
  const [docName, setDocName] = useState('Vogue Cover Retouch Session #04');
  const [docWidth, setDocWidth] = useState(1024);
  const [docHeight, setDocHeight] = useState(768);
  const [bitDepth, setBitDepth] = useState<BitDepth>(16);
  const [colorProfile, setColorProfile] = useState<ColorProfileName>('Display P3');
  const [linearLight, setLinearLight] = useState(true);

  // Active Tool & Settings
  const [currentTool, setCurrentTool] = useState<ToolType>('brush');
  const [foregroundColor, setForegroundColor] = useState('#3b82f6');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 40,
    hardness: 0.65,
    flow: 0.8,
    opacity: 1,
    smoothing: 30,
    color: '#3b82f6',
  });
  const [cloneSettings, setCloneSettings] = useState<CloneSettings>({
    sourcePoint: null,
    anchorPoint: null,
    aligned: true,
    rotation: 0,
    scale: 100,
    flipX: false,
  });

  // Layer Stack
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');

  // Selection & Transform
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [cropPreset, setCropPreset] = useState('original');

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 80, y: 40 });

  // Right Dock Active Panel
  const [activeRightTab, setActiveRightTab] = useState<'layers' | 'adjustments' | 'ai' | 'collab' | 'history'>('layers');

  // Modals
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isForegroundPick, setIsForegroundPick] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);

  // Undo / Redo History
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'h-0', name: 'Open Document', timestamp: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Real-time Collaborators & Presence
  const [collaborators, setCollaborators] = useState<CollabUser[]>([
    {
      id: 'user-elena',
      name: 'Elena Rostova',
      avatar: '/src/assets/images/collab_avatar_elena_1790856994108.jpg',
      role: 'Lead Art Director',
      color: '#3b82f6',
      cursor: { x: 380, y: 420, activeTool: 'heal' },
      lastSeen: Date.now(),
    },
    {
      id: 'user-marcus',
      name: 'Marcus Vance',
      avatar: '/src/assets/images/collab_avatar_marcus_1790857008485.jpg',
      role: 'Senior Colorist',
      color: '#10b981',
      cursor: { x: 640, y: 280, activeTool: 'curves' },
      lastSeen: Date.now(),
    },
    {
      id: 'user-ai',
      name: 'Nova AI Copilot',
      avatar: '',
      role: 'Generative Engine',
      color: '#8b5cf6',
      cursor: { x: 510, y: 560, activeTool: 'magic-wand' },
      lastSeen: Date.now(),
    },
  ]);

  const [comments, setComments] = useState<CanvasComment[]>([
    {
      id: 'c-1',
      userId: 'user-elena',
      userName: 'Elena Rostova',
      userAvatar: '/src/assets/images/collab_avatar_elena_1790856994108.jpg',
      x: 480,
      y: 340,
      text: 'Let us soften the micro-shadow under the cheekbone with the Poisson healing brush.',
      resolved: false,
      createdAt: Date.now() - 1000 * 60 * 18,
    },
    {
      id: 'c-2',
      userId: 'user-marcus',
      userName: 'Marcus Vance',
      userAvatar: '/src/assets/images/collab_avatar_marcus_1790857008485.jpg',
      x: 720,
      y: 190,
      text: 'Highlights on the hair look perfect with Display P3 gamut mapping!',
      resolved: true,
      createdAt: Date.now() - 1000 * 60 * 35,
    },
  ]);

  // Helper to create a new raster layer canvas
  const createLayerInstance = (
    name: string,
    width: number,
    height: number,
    kind: 'raster' | 'adjustment' | 'vector' | 'text' = 'raster',
    adjustment?: AdjustmentType
  ): Layer => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    return {
      id: 'layer-' + Math.random().toString(36).substring(2, 9),
      name,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      canvas,
      ctx,
      kind,
      adjustment,
    };
  };

  // Push new history state
  const pushHistory = (actionName: string) => {
    const newItem: HistoryItem = {
      id: 'h-' + Date.now(),
      name: actionName,
      timestamp: Date.now(),
    };
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newItem);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  // Load a starter project by ID
  const loadProject = useCallback((sampleId: string) => {
    const sample = SAMPLE_PROJECTS.find((p) => p.id === sampleId) || SAMPLE_PROJECTS[0];
    setDocName(sample.title);
    setDocWidth(sample.width);
    setDocHeight(sample.height);

    // Create Base Background Layer
    const baseLayer = createLayerInstance('Background (Original)', sample.width, sample.height);

    // Retouch overlay layer
    const retouchLayer = createLayerInstance('Retouch & Dodge/Burn', sample.width, sample.height);

    // Non-destructive Curves adjustment layer
    const curvesLayer = createLayerInstance(
      'Tone Curve (S-Contrast)',
      sample.width,
      sample.height,
      'adjustment',
      {
        type: 'curves',
        data: {
          RGB: {
            pts: [
              [0, 0.02],
              [0.25, 0.21],
              [0.75, 0.81],
              [1, 0.98],
            ],
          },
          R: { pts: [[0, 0], [0.5, 0.52], [1, 1]] },
          G: { pts: [[0, 0], [0.5, 0.5], [1, 1]] },
          B: { pts: [[0, 0.02], [0.5, 0.48], [1, 0.98]] },
        },
      }
    );

    // Load initial photographic image into base layer
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sample.imageSrc;
    img.onload = () => {
      baseLayer.ctx.drawImage(img, 0, 0, sample.width, sample.height);
      setLayers([baseLayer, retouchLayer, curvesLayer]);
      setActiveLayerId(retouchLayer.id);
      // Fit to view
      fitToScreen(sample.width, sample.height);
    };

    setHistory([{ id: 'h-0', name: `Open: ${sample.title}`, timestamp: Date.now() }]);
    setHistoryIndex(0);
  }, []);

  // Fit image to screen
  const fitToScreen = (w: number = docWidth, h: number = docHeight) => {
    const containerW = window.innerWidth - 380;
    const containerH = window.innerHeight - 90;
    const fitZ = Math.min(1.2, Math.max(0.2, Math.min(containerW / w, containerH / h) * 0.9));
    setZoom(fitZ);
    setPan({
      x: Math.max(20, (containerW - w * fitZ) / 2 + 30),
      y: Math.max(20, (containerH - h * fitZ) / 2 + 10),
    });
  };

  // Mount initial project on startup
  useEffect(() => {
    loadProject('fashion-editorial');
  }, [loadProject]);

  // Sync brush color when foreground color changes
  useEffect(() => {
    setBrushSettings((prev) => ({ ...prev, color: foregroundColor }));
  }, [foregroundColor]);

  // Simulate smooth peer cursor movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCollaborators((prev) =>
        prev.map((c) => {
          if (!c.cursor) return c;
          const wobbleX = (Math.random() - 0.5) * 6;
          const wobbleY = (Math.random() - 0.5) * 6;
          return {
            ...c,
            cursor: {
              ...c.cursor,
              x: Math.max(20, Math.min(docWidth - 20, c.cursor.x + wobbleX)),
              y: Math.max(20, Math.min(docHeight - 20, c.cursor.y + wobbleY)),
            },
          };
        })
      );
    }, 1200);
    return () => clearInterval(interval);
  }, [docWidth, docHeight]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs or textareas
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (isMeta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isMeta && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelection({
          type: 'rect',
          x: 0,
          y: 0,
          width: docWidth,
          height: docHeight,
        });
        return;
      }

      if (isMeta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setSelection(null);
        return;
      }

      if (isMeta && e.key.toLowerCase() === '0') {
        e.preventDefault();
        fitToScreen();
        return;
      }

      if (isMeta && e.key.toLowerCase() === '1') {
        e.preventDefault();
        setZoom(1);
        return;
      }

      // Single-key Tool Shortcuts
      const key = e.key.toLowerCase();
      if (!isMeta) {
        switch (key) {
          case 'v': setCurrentTool('move'); break;
          case 'm': setCurrentTool('marquee-rect'); break;
          case 'l': setCurrentTool('lasso'); break;
          case 'w': setCurrentTool('magic-wand'); break;
          case 'c': setCurrentTool('crop'); break;
          case 'i': setCurrentTool('eyedropper'); break;
          case 'j': setCurrentTool('heal'); break;
          case 'k': setCurrentTool('spot'); break;
          case 'b': setCurrentTool('brush'); break;
          case 's': setCurrentTool('clone'); break;
          case 'e': setCurrentTool('eraser'); break;
          case 'g': setCurrentTool('gradient'); break;
          case 'p': setCurrentTool('pen'); break;
          case 't': setCurrentTool('text'); break;
          case 'u': setCurrentTool('shape-rect'); break;
          case 'h': setCurrentTool('hand'); break;
          case 'z': setCurrentTool('zoom'); break;
          case 'x':
            // Swap colors
            setForegroundColor(backgroundColor);
            setBackgroundColor(foregroundColor);
            break;
          case 'd':
            // Default colors
            setForegroundColor('#000000');
            setBackgroundColor('#ffffff');
            break;
          case '[':
            setBrushSettings((prev) => ({
              ...prev,
              size: Math.max(2, prev.size - 5),
            }));
            break;
          case ']':
            setBrushSettings((prev) => ({
              ...prev,
              size: Math.min(300, prev.size + 5),
            }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Add Raster Layer
  const handleAddLayer = () => {
    const newL = createLayerInstance(
      `Layer ${layers.length + 1}`,
      docWidth,
      docHeight
    );
    setLayers((prev) => [...prev, newL]);
    setActiveLayerId(newL.id);
    pushHistory('New Layer');
  };

  // Add Non-Destructive Adjustment Layer
  const handleAddAdjustment = (
    type: 'curves' | 'levels' | 'hsl' | 'exposure' | 'color-balance'
  ) => {
    let adjData: AdjustmentType;
    let name = 'Adjustment';

    if (type === 'curves') {
      name = 'Curves';
      adjData = {
        type: 'curves',
        data: {
          RGB: { pts: [[0, 0], [1, 1]] },
          R: { pts: [[0, 0], [1, 1]] },
          G: { pts: [[0, 0], [1, 1]] },
          B: { pts: [[0, 0], [1, 1]] },
        },
      };
    } else if (type === 'levels') {
      name = 'Levels';
      adjData = {
        type: 'levels',
        data: {
          RGB: { ib: 0, g: 1.0, iw: 255, ob: 0, ow: 255 },
          R: { ib: 0, g: 1.0, iw: 255, ob: 0, ow: 255 },
          G: { ib: 0, g: 1.0, iw: 255, ob: 0, ow: 255 },
          B: { ib: 0, g: 1.0, iw: 255, ob: 0, ow: 255 },
        },
      };
    } else if (type === 'hsl') {
      name = 'Hue/Saturation';
      adjData = {
        type: 'hsl',
        data: { hue: 0, saturation: 0, lightness: 0 },
      };
    } else if (type === 'exposure') {
      name = 'Exposure';
      adjData = {
        type: 'exposure',
        data: { exposure: 0, offset: 0, gamma: 1.0, toneMap: 'reinhard' },
      };
    } else {
      name = 'Color Balance';
      adjData = {
        type: 'color-balance',
        data: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0, preserveLuminosity: true },
      };
    }

    const newL = createLayerInstance(
      `${name} ${layers.length + 1}`,
      docWidth,
      docHeight,
      'adjustment',
      adjData
    );

    setLayers((prev) => [...prev, newL]);
    setActiveLayerId(newL.id);
    setActiveRightTab('adjustments');
    pushHistory(`Add ${name}`);
  };

  // Reorder Layer
  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    const copy = [...layers];
    const [removed] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, removed);
    setLayers(copy);
    pushHistory(`Move Layer ${direction}`);
  };

  // Duplicate Layer
  const handleDuplicateLayer = (id: string) => {
    const source = layers.find((l) => l.id === id);
    if (!source) return;

    const dup = createLayerInstance(
      `${source.name} Copy`,
      docWidth,
      docHeight,
      source.kind,
      source.adjustment ? JSON.parse(JSON.stringify(source.adjustment)) : undefined
    );
    dup.opacity = source.opacity;
    dup.blendMode = source.blendMode;
    dup.ctx.drawImage(source.canvas, 0, 0);

    const idx = layers.findIndex((l) => l.id === id);
    const copy = [...layers];
    copy.splice(idx + 1, 0, dup);
    setLayers(copy);
    setActiveLayerId(dup.id);
    pushHistory(`Duplicate Layer`);
  };

  // Delete Layer
  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const filtered = layers.filter((l) => l.id !== id);
    setLayers(filtered);
    setActiveLayerId(filtered[filtered.length - 1].id);
    pushHistory('Delete Layer');
  };

  // Apply Pixel Filters
  const handleApplyFilter = (filterType: 'blur' | 'sharpen' | 'invert' | 'desaturate') => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (!active || active.kind === 'adjustment') return;

    if (filterType === 'blur') {
      applyGaussianBlur(active.ctx, docWidth, docHeight, 4);
    } else if (filterType === 'sharpen') {
      applySharpen(active.ctx, docWidth, docHeight, 0.7);
    } else if (filterType === 'invert') {
      applyInvert(active.ctx, docWidth, docHeight);
    } else if (filterType === 'desaturate') {
      applyDesaturate(active.ctx, docWidth, docHeight);
    }

    setLayers([...layers]);
    pushHistory(`Filter: ${filterType}`);
  };

  // AI Generative Fill execution
  const handleApplyGenerativeFill = async (prompt: string) => {
    // Spawns a newly synthesized generative layer with volumetric realism
    const aiLayer = createLayerInstance(`AI Fill: ${prompt.slice(0, 16)}...`, docWidth, docHeight);
    const ctx = aiLayer.ctx;

    const targetX = selection ? selection.x : docWidth * 0.2;
    const targetY = selection ? selection.y : docHeight * 0.2;
    const targetW = selection ? selection.width : docWidth * 0.6;
    const targetH = selection ? selection.height : docHeight * 0.6;

    // Create realistic volumetric lighting / atmosphere fill
    const grad = ctx.createRadialGradient(
      targetX + targetW / 2,
      targetY + targetH / 2,
      10,
      targetX + targetW / 2,
      targetY + targetH / 2,
      Math.max(targetW, targetH) / 1.5
    );

    if (prompt.toLowerCase().includes('sun') || prompt.toLowerCase().includes('golden')) {
      grad.addColorStop(0, 'rgba(255, 235, 180, 0.45)');
      grad.addColorStop(0.5, 'rgba(255, 180, 80, 0.2)');
      grad.addColorStop(1, 'rgba(255, 120, 0, 0)');
      aiLayer.blendMode = 'screen';
    } else if (prompt.toLowerCase().includes('neon') || prompt.toLowerCase().includes('haze')) {
      grad.addColorStop(0, 'rgba(60, 220, 255, 0.4)');
      grad.addColorStop(0.5, 'rgba(180, 80, 255, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      aiLayer.blendMode = 'screen';
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      aiLayer.blendMode = 'soft-light';
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, docWidth, docHeight);

    setLayers((prev) => [...prev, aiLayer]);
    setActiveLayerId(aiLayer.id);
    setSelection(null);
    pushHistory(`Generative Fill: ${prompt.slice(0, 20)}`);
  };

  // 1-Click Semantic Subject Isolator
  const handleIsolateSubject = () => {
    const base = layers[0];
    if (!base) return;

    const cutoutLayer = createLayerInstance('AI Subject Cutout', docWidth, docHeight);
    const ctx = cutoutLayer.ctx;

    // Draw copy of base
    ctx.drawImage(base.canvas, 0, 0);

    // Apply soft vignette mask around center to simulate portrait cutout
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    const grad = ctx.createRadialGradient(
      docWidth / 2,
      docHeight / 2,
      docWidth * 0.2,
      docWidth / 2,
      docHeight / 2,
      docWidth * 0.42
    );
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.95)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, docWidth, docHeight);
    ctx.restore();

    setLayers((prev) => [...prev, cutoutLayer]);
    setActiveLayerId(cutoutLayer.id);
    pushHistory('AI Subject Cutout');
  };

  // Get current flattened snapshot data URL for AI analysis
  const getCanvasSnapshot = (): string => {
    const snap = document.createElement('canvas');
    snap.width = 640;
    snap.height = Math.round(640 * (docHeight / docWidth));
    const sCtx = snap.getContext('2d')!;

    // Flatten layers
    layers.forEach((l) => {
      if (l.visible && l.opacity > 0) {
        sCtx.globalAlpha = l.opacity;
        sCtx.drawImage(l.canvas, 0, 0, snap.width, snap.height);
      }
    });

    return snap.toDataURL('image/jpeg', 0.85);
  };

  // Export Flattened Image
  const handleExportImage = (
    format: 'png' | 'jpeg' | 'webp' | 'json',
    quality: number,
    scale: number
  ) => {
    if (format === 'json') {
      const projectState = {
        name: docName,
        width: docWidth,
        height: docHeight,
        bitDepth,
        colorProfile,
        linearLight,
        layers: layers.map((l) => ({
          name: l.name,
          visible: l.visible,
          opacity: l.opacity,
          blendMode: l.blendMode,
          kind: l.kind,
          adjustment: l.adjustment,
        })),
        comments,
      };
      const blob = new Blob([JSON.stringify(projectState, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docName.replace(/\s+/g, '_').toLowerCase()}.novapix`;
      a.click();
      return;
    }

    // Raster Flatten & Scale
    const expCanvas = document.createElement('canvas');
    expCanvas.width = Math.round(docWidth * scale);
    expCanvas.height = Math.round(docHeight * scale);
    const expCtx = expCanvas.getContext('2d')!;

    // Render layers
    layers.forEach((l) => {
      if (l.visible && l.opacity > 0) {
        expCtx.globalAlpha = l.opacity;
        expCtx.drawImage(l.canvas, 0, 0, expCanvas.width, expCanvas.height);
      }
    });

    const mime =
      format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = expCanvas.toDataURL(mime, quality / 100);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${docName.replace(/\s+/g, '_').toLowerCase()}_${scale}x.${format}`;
    a.click();
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0] || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#12141a] text-[#e1e6f0]">
      {/* 1. Top Menu Bar (Photoshop Menu Bar) */}
      <TopMenuBar
        projectName={docName}
        zoom={zoom}
        bitDepth={bitDepth}
        colorProfile={colorProfile}
        linearLight={linearLight}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        collaborators={collaborators}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNew={() => setIsNewDocOpen(true)}
        onOpenSample={loadProject}
        onExport={() => setIsExportOpen(true)}
        onToggleCollab={() => setActiveRightTab('collab')}
        onToggleAI={() => setActiveRightTab('ai')}
        onFitScreen={() => fitToScreen()}
        onZoom100={() => setZoom(1)}
        onSetBitDepth={setBitDepth}
        onSetColorProfile={setColorProfile}
        onSetLinearLight={setLinearLight}
        onApplyFilter={handleApplyFilter}
        onSelectAll={() =>
          setSelection({ type: 'rect', x: 0, y: 0, width: docWidth, height: docHeight })
        }
        onDeselect={() => setSelection(null)}
        onAddLayer={handleAddLayer}
        onAddAdjustment={handleAddAdjustment}
      />

      {/* 2. Context Options Bar (Tool dynamic options) */}
      <ContextOptionsBar
        currentTool={currentTool}
        brushSettings={brushSettings}
        cloneSettings={cloneSettings}
        onUpdateBrush={(s) => setBrushSettings((prev) => ({ ...prev, ...s }))}
        onUpdateClone={(s) => setCloneSettings((prev) => ({ ...prev, ...s }))}
        onContentAwareFill={() => setActiveRightTab('ai')}
        onSelectSubjectAI={handleIsolateSubject}
        onApplyCrop={() => {
          if (selection) {
            setDocWidth(selection.width);
            setDocHeight(selection.height);
            setSelection(null);
            pushHistory('Crop Canvas');
          }
        }}
        onCancelCrop={() => setSelection(null)}
        hasSelection={!!selection}
        cropPreset={cropPreset}
        onSetCropPreset={setCropPreset}
      />

      {/* 3. Main Workspace Area: Left Tools + Center Stage Canvas + Right Dock */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Toolbar */}
        <ToolBar
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          onOpenColorPicker={(isFg) => {
            setIsForegroundPick(isFg);
            setIsColorPickerOpen(true);
          }}
          onSwapColors={() => {
            setForegroundColor(backgroundColor);
            setBackgroundColor(foregroundColor);
          }}
          onResetColors={() => {
            setForegroundColor('#000000');
            setBackgroundColor('#ffffff');
          }}
        />

        {/* Center Canvas Stage */}
        <main className="flex-1 h-full min-w-0 relative">
          <CanvasWorkspace
            documentWidth={docWidth}
            documentHeight={docHeight}
            layers={layers}
            activeLayerId={activeLayerId}
            currentTool={currentTool}
            brushSettings={brushSettings}
            cloneSettings={cloneSettings}
            onUpdateClone={(s) => setCloneSettings((prev) => ({ ...prev, ...s }))}
            selection={selection}
            onSetSelection={setSelection}
            collaborators={collaborators}
            comments={comments}
            onAddComment={(newComment) => {
              setComments((prev) => [
                ...prev,
                {
                  id: 'c-' + Date.now(),
                  userId: 'user-you',
                  userName: 'You',
                  userAvatar: '',
                  createdAt: Date.now(),
                  resolved: false,
                  ...newComment,
                },
              ]);
            }}
            onResolveComment={(cId) => {
              setComments((prev) =>
                prev.map((c) => (c.id === cId ? { ...c, resolved: !c.resolved } : c))
              );
            }}
            zoom={zoom}
            onZoomChange={setZoom}
            pan={pan}
            onPanChange={setPan}
            onColorSampled={setForegroundColor}
            onSnapshot={() => pushHistory(`Tool: ${currentTool}`)}
          />
        </main>

        {/* Right Dock: Tabs & Properties */}
        <aside className="w-80 bg-[#161821] border-l border-[#242938] flex flex-col z-20 shrink-0 select-none">
          {/* Right Dock Tabs Header */}
          <div className="h-9 bg-[#14161f] border-b border-[#252b3b] flex items-center px-1">
            <button
              onClick={() => setActiveRightTab('layers')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[11px] font-medium border-b-2 transition-colors ${
                activeRightTab === 'layers'
                  ? 'border-blue-500 text-white bg-[#191c26]'
                  : 'border-transparent text-[#7d889d] hover:text-[#c4cbda]'
              }`}
            >
              <Layers size={13} />
              <span>Layers</span>
            </button>

            <button
              onClick={() => setActiveRightTab('adjustments')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[11px] font-medium border-b-2 transition-colors ${
                activeRightTab === 'adjustments'
                  ? 'border-blue-500 text-white bg-[#191c26]'
                  : 'border-transparent text-[#7d889d] hover:text-[#c4cbda]'
              }`}
            >
              <Sliders size={13} />
              <span>Adjust</span>
            </button>

            <button
              onClick={() => setActiveRightTab('ai')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[11px] font-medium border-b-2 transition-colors ${
                activeRightTab === 'ai'
                  ? 'border-blue-500 text-white bg-[#191c26]'
                  : 'border-transparent text-[#7d889d] hover:text-[#c4cbda]'
              }`}
            >
              <Sparkles size={13} className="text-blue-400" />
              <span>AI</span>
            </button>

            <button
              onClick={() => setActiveRightTab('collab')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[11px] font-medium border-b-2 transition-colors ${
                activeRightTab === 'collab'
                  ? 'border-blue-500 text-white bg-[#191c26]'
                  : 'border-transparent text-[#7d889d] hover:text-[#c4cbda]'
              }`}
            >
              <Users size={13} className="text-emerald-400" />
              <span>Collab</span>
            </button>

            <button
              onClick={() => setActiveRightTab('history')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[11px] font-medium border-b-2 transition-colors ${
                activeRightTab === 'history'
                  ? 'border-blue-500 text-white bg-[#191c26]'
                  : 'border-transparent text-[#7d889d] hover:text-[#c4cbda]'
              }`}
            >
              <History size={13} />
            </button>
          </div>

          {/* Active Tab Panel Body */}
          <div className="flex-1 overflow-hidden">
            {activeRightTab === 'layers' && (
              <LayersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onSelectLayer={setActiveLayerId}
                onToggleVisibility={(id) => {
                  setLayers((prev) =>
                    prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
                  );
                }}
                onToggleLock={(id) => {
                  setLayers((prev) =>
                    prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
                  );
                }}
                onUpdateOpacity={(id, op) => {
                  setLayers((prev) =>
                    prev.map((l) => (l.id === id ? { ...l, opacity: op } : l))
                  );
                }}
                onUpdateBlendMode={(id, bm) => {
                  setLayers((prev) =>
                    prev.map((l) => (l.id === id ? { ...l, blendMode: bm } : l))
                  );
                }}
                onAddLayer={handleAddLayer}
                onAddAdjustment={handleAddAdjustment}
                onDuplicateLayer={handleDuplicateLayer}
                onDeleteLayer={handleDeleteLayer}
                onMoveLayer={handleMoveLayer}
              />
            )}

            {activeRightTab === 'adjustments' && (
              <AdjustmentsPanel
                activeLayer={activeLayer}
                onUpdateAdjustment={(adj) => {
                  if (activeLayer) {
                    activeLayer.adjustment = adj;
                    setLayers([...layers]);
                  }
                }}
              />
            )}

            {activeRightTab === 'ai' && (
              <AIStudioPanel
                selection={selection}
                onApplyGenerativeFill={handleApplyGenerativeFill}
                onApplyAIAdjustment={(adj, name) => {
                  const newL = createLayerInstance(name, docWidth, docHeight, 'adjustment', adj);
                  setLayers((prev) => [...prev, newL]);
                  setActiveLayerId(newL.id);
                  setActiveRightTab('adjustments');
                  pushHistory(name);
                }}
                onIsolateSubject={handleIsolateSubject}
                getCanvasSnapshot={getCanvasSnapshot}
              />
            )}

            {activeRightTab === 'collab' && (
              <CollabPanel
                collaborators={collaborators}
                comments={comments}
                onResolveComment={(cId) => {
                  setComments((prev) =>
                    prev.map((c) => (c.id === cId ? { ...c, resolved: !c.resolved } : c))
                  );
                }}
                onFocusComment={(x, y) => {
                  setPan({
                    x: window.innerWidth / 2 - x * zoom - 100,
                    y: window.innerHeight / 2 - y * zoom,
                  });
                }}
              />
            )}

            {activeRightTab === 'history' && (
              <HistoryPanel
                history={history}
                currentIndex={historyIndex}
                onJumpToHistory={setHistoryIndex}
                onTakeSnapshot={() => pushHistory(`Snapshot ${history.length + 1}`)}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Modals */}
      <ColorPickerModal
        isOpen={isColorPickerOpen}
        initialColor={isForegroundPick ? foregroundColor : backgroundColor}
        isForeground={isForegroundPick}
        onClose={() => setIsColorPickerOpen(false)}
        onApplyColor={(hex) => {
          if (isForegroundPick) setForegroundColor(hex);
          else setBackgroundColor(hex);
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        documentWidth={docWidth}
        documentHeight={docHeight}
        projectName={docName}
        onExportImage={handleExportImage}
      />

      <NewCanvasModal
        isOpen={isNewDocOpen}
        onClose={() => setIsNewDocOpen(false)}
        onCreateDocument={(name, w, h, depth, prof, bg) => {
          setDocName(name);
          setDocWidth(w);
          setDocHeight(h);
          setBitDepth(depth);
          setColorProfile(prof);

          const newBase = createLayerInstance('Background', w, h);
          if (bg === 'white') {
            newBase.ctx.fillStyle = '#ffffff';
            newBase.ctx.fillRect(0, 0, w, h);
          } else if (bg === 'black') {
            newBase.ctx.fillStyle = '#000000';
            newBase.ctx.fillRect(0, 0, w, h);
          }
          setLayers([newBase]);
          setActiveLayerId(newBase.id);
          fitToScreen(w, h);
          setHistory([{ id: 'h-0', name: `New: ${name}`, timestamp: Date.now() }]);
          setHistoryIndex(0);
        }}
      />
    </div>
  );
}
