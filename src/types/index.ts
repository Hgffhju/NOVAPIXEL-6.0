export type ToolType =
  | 'move'
  | 'marquee-rect'
  | 'marquee-ellipse'
  | 'lasso'
  | 'magic-wand'
  | 'crop'
  | 'eyedropper'
  | 'brush'
  | 'eraser'
  | 'clone'
  | 'heal'
  | 'spot'
  | 'patch'
  | 'remove'
  | 'gradient'
  | 'pen'
  | 'text'
  | 'shape-rect'
  | 'shape-ellipse'
  | 'shape-star'
  | 'hand'
  | 'zoom';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'difference'
  | 'exclusion'
  | 'add';

export type BitDepth = 8 | 16 | 32;

export type ColorProfileName = 'sRGB' | 'Display P3' | 'Adobe RGB' | 'Rec.2020';

export interface CurvePoint {
  x: number;
  y: number;
}

export interface ChannelCurve {
  pts: [number, number][];
}

export interface CurvesAdjustment {
  RGB: ChannelCurve;
  R: ChannelCurve;
  G: ChannelCurve;
  B: ChannelCurve;
}

export interface LevelsChannel {
  ib: number; // Input Black (0-255)
  g: number;  // Gamma (0.1 - 4.0)
  iw: number; // Input White (0-255)
  ob: number; // Output Black (0-255)
  ow: number; // Output White (0-255)
}

export interface LevelsAdjustment {
  RGB: LevelsChannel;
  R: LevelsChannel;
  G: LevelsChannel;
  B: LevelsChannel;
}

export interface HSLAdjustment {
  hue: number;        // -180 to 180
  saturation: number; // -100 to 100
  lightness: number;  // -100 to 100
}

export interface ExposureAdjustment {
  exposure: number; // -5 to +5
  offset: number;   // -0.5 to +0.5
  gamma: number;    // 0.2 to 5.0
  toneMap: 'none' | 'reinhard' | 'aces';
}

export interface ColorBalanceAdjustment {
  cyanRed: number;      // -100 to 100
  magentaGreen: number; // -100 to 100
  yellowBlue: number;   // -100 to 100
  preserveLuminosity: boolean;
}

export type AdjustmentType =
  | { type: 'curves'; data: CurvesAdjustment }
  | { type: 'levels'; data: LevelsAdjustment }
  | { type: 'hsl'; data: HSLAdjustment }
  | { type: 'exposure'; data: ExposureAdjustment }
  | { type: 'color-balance'; data: ColorBalanceAdjustment }
  | { type: 'invert' }
  | { type: 'black-and-white' };

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0.0 to 1.0
  blendMode: BlendMode;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  maskCanvas?: HTMLCanvasElement;
  maskCtx?: CanvasRenderingContext2D;
  hasMask?: boolean;
  isMaskActive?: boolean;
  adjustment?: AdjustmentType;
  kind: 'raster' | 'adjustment' | 'vector' | 'text';
  textProps?: {
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    x: number;
    y: number;
  };
}

export interface SelectionArea {
  type: 'rect' | 'ellipse' | 'polygon';
  points?: [number, number][];
  x: number;
  y: number;
  width: number;
  height: number;
  mask?: Uint8Array; // 1 = inside, 0 = outside
}

export interface BrushSettings {
  size: number;
  hardness: number; // 0 to 1
  flow: number;     // 0 to 1
  opacity: number;  // 0 to 1
  smoothing: number;// 0 to 100
  color: string;
}

export interface CloneSettings {
  sourcePoint: [number, number] | null;
  anchorPoint: [number, number] | null;
  aligned: boolean;
  rotation: number; // degrees
  scale: number;    // percentage 25-200
  flipX: boolean;
}

export interface CollabUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  color: string;
  cursor?: { x: number; y: number; activeTool: string };
  lastSeen: number;
}

export interface CanvasComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  x: number;
  y: number;
  text: string;
  resolved: boolean;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  layerSnapshot?: {
    layerId: string;
    dataUrl: string;
  };
  docDescription?: string;
}
