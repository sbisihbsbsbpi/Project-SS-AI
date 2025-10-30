/**
 * Advanced Annotation Module
 * Exports all annotation-related classes and types
 */

export * from "./types";
export { CanvasDrawingTools } from "./canvasDrawing";
export { AdvancedFeatures } from "./advancedFeatures";
export { LayerManager } from "./layerManager";
export { TemplateSystem } from "./templateSystem";

import { CanvasDrawingTools } from "./canvasDrawing";
import { AdvancedFeatures } from "./advancedFeatures";
import { LayerManager } from "./layerManager";
import { TemplateSystem } from "./templateSystem";
import {
  AnnotationCanvasState,
  AnnotationLayer,
  DrawingElement,
  ExportOptions,
  AnnotationResult,
} from "./types";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateRequired, validateString } from "../../utils/validation";

/**
 * Main AdvancedAnnotation class
 * Orchestrates all annotation features
 */
export class AdvancedAnnotation {
  private canvas: HTMLCanvasElement | null = null;
  private canvasDrawing: CanvasDrawingTools;
  private advancedFeatures: AdvancedFeatures;
  private layerManager: LayerManager;
  private templateSystem: TemplateSystem;
  private state: AnnotationCanvasState | null = null;

  constructor(canvasElement?: HTMLCanvasElement) {
    this.canvasDrawing = new CanvasDrawingTools(canvasElement);
    this.advancedFeatures = new AdvancedFeatures(canvasElement);
    this.layerManager = new LayerManager();
    this.templateSystem = new TemplateSystem();

    if (canvasElement) {
      this.canvas = canvasElement;
      this.initializeState();
    }
  }

  /**
   * Initialize canvas state
   */
  private initializeState(): void {
    if (!this.canvas) return;

    this.state = {
      id: `canvas-${Date.now()}`,
      imageUrl: "",
      width: this.canvas.width,
      height: this.canvas.height,
      layers: this.layerManager.getAllLayers(),
      activeLayerId: this.layerManager.getActiveLayer().id,
      zoom: 1,
      panX: 0,
      panY: 0,
      backgroundColor: "#FFFFFF",
    };
  }

  /**
   * Set canvas element
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    validateRequired(canvas, "canvas");
    this.canvas = canvas;
    this.canvasDrawing.setCanvas(canvas);
    this.advancedFeatures.setCanvas(canvas);
    this.initializeState();
  }

  /**
   * Load image to canvas
   */
  loadImage(imageUrl: string): void {
    imageUrl = validateString(imageUrl, "imageUrl");

    if (!this.canvas) {
      throw new AppError(
        "NO_CANVAS",
        "Canvas not initialized",
        ErrorSeverity.HIGH
      );
    }

    const img = new Image();
    img.onload = () => {
      const ctx = this.canvas!.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        if (this.state) {
          this.state.imageUrl = imageUrl;
        }
      }
    };
    img.onerror = () => {
      throw new AppError(
        "IMAGE_LOAD_ERROR",
        `Failed to load image: ${imageUrl}`,
        ErrorSeverity.HIGH
      );
    };
    img.src = imageUrl;
  }

  /**
   * Get canvas drawing tools
   */
  getCanvasDrawing(): CanvasDrawingTools {
    return this.canvasDrawing;
  }

  /**
   * Get advanced features
   */
  getAdvancedFeatures(): AdvancedFeatures {
    return this.advancedFeatures;
  }

  /**
   * Get layer manager
   */
  getLayerManager(): LayerManager {
    return this.layerManager;
  }

  /**
   * Get template system
   */
  getTemplateSystem(): TemplateSystem {
    return this.templateSystem;
  }

  /**
   * Get current state
   */
  getState(): AnnotationCanvasState | null {
    return this.state;
  }

  /**
   * Export annotation
   */
  export(options: ExportOptions): AnnotationResult {
    if (!this.canvas || !this.state) {
      throw new AppError(
        "NO_CANVAS",
        "Canvas not initialized",
        ErrorSeverity.HIGH
      );
    }

    const format = options.format || "png";
    const quality = options.quality || 100;

    let dataUrl: string;
    if (format === "jpeg") {
      dataUrl = this.canvas.toDataURL("image/jpeg", quality / 100);
    } else if (format === "webp") {
      dataUrl = this.canvas.toDataURL("image/webp", quality / 100);
    } else {
      dataUrl = this.canvas.toDataURL("image/png");
    }

    return {
      id: `annotation-${Date.now()}`,
      originalImageUrl: this.state.imageUrl,
      annotatedImageUrl: dataUrl,
      layers: this.layerManager.getAllLayers(),
      exportedAt: new Date(),
      exportFormat: format,
    };
  }

  /**
   * Undo last action
   */
  undo(): void {
    this.layerManager.undo();
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    this.layerManager.redo();
  }

  /**
   * Can undo
   */
  canUndo(): boolean {
    return this.layerManager.canUndo();
  }

  /**
   * Can redo
   */
  canRedo(): boolean {
    return this.layerManager.canRedo();
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.canvasDrawing.clearCanvas();
    this.layerManager.clearHistory();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clear();
    this.layerManager.clearHistory();
  }

  /**
   * Destroy the module and cleanup all resources
   */
  destroy(): void {
    this.cleanup();
    this.canvas = null;
    this.state = null;
  }
}
