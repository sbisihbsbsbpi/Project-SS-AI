/**
 * Advanced Annotation Types
 * Defines types for canvas drawing tools, layers, and annotation templates
 */

// Drawing tool types
export enum DrawingToolType {
  FREEHAND = 'freehand',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  LINE = 'line',
  ARROW = 'arrow',
  TEXT = 'text',
  MEASUREMENT = 'measurement',
  BLUR = 'blur',
  HIGHLIGHT = 'highlight',
  COLOR_PICKER = 'color_picker',
}

// Drawing style configuration
export interface DrawingStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  opacity: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'italic';
}

// Drawing element (shape, text, etc.)
export interface DrawingElement {
  id: string;
  type: DrawingToolType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  style: DrawingStyle;
  content?: string; // For text annotations
  points?: Array<{ x: number; y: number }>; // For freehand
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Layer in the annotation canvas
export interface AnnotationLayer {
  id: string;
  name: string;
  elements: DrawingElement[];
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  order: number;
}

// Annotation canvas state
export interface AnnotationCanvasState {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  layers: AnnotationLayer[];
  activeLayerId: string;
  selectedElementId?: string;
  zoom: number;
  panX: number;
  panY: number;
  backgroundColor: string;
}

// Undo/Redo action
export interface UndoRedoAction {
  type: 'add' | 'remove' | 'modify' | 'layer_add' | 'layer_remove' | 'layer_modify';
  timestamp: Date;
  data: any;
  previousState?: any;
}

// Annotation template
export interface AnnotationTemplate {
  id: string;
  name: string;
  description: string;
  layers: AnnotationLayer[];
  defaultStyle: DrawingStyle;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Measurement result
export interface MeasurementResult {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distance: number; // in pixels
  angle: number; // in degrees
  unit: 'px' | 'cm' | 'in';
}

// Blur region
export interface BlurRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blurRadius: number;
}

// Highlight region
export interface HighlightRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

// Canvas drawing options
export interface CanvasDrawingOptions {
  enableGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

// Export options
export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'svg';
  quality: number; // 0-100
  includeBackground: boolean;
  layers: 'all' | 'visible' | 'active';
  scale: number;
}

// Annotation result
export interface AnnotationResult {
  id: string;
  originalImageUrl: string;
  annotatedImageUrl: string;
  layers: AnnotationLayer[];
  exportedAt: Date;
  exportFormat: string;
}

