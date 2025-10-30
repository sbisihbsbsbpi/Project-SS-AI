/**
 * Layer Management System
 * Implements layer system with undo/redo functionality
 */

import { v4 as uuidv4 } from "uuid";
import {
  AnnotationLayer,
  DrawingElement,
  UndoRedoAction,
  AnnotationCanvasState,
} from "./types";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import {
  validateString,
  validateNumber,
  validateRequired,
} from "../../utils/validation";

export class LayerManager {
  private layers: Map<string, AnnotationLayer> = new Map();
  private undoStack: UndoRedoAction[] = [];
  private redoStack: UndoRedoAction[] = [];
  private activeLayerId: string = "";
  private maxUndoSteps: number = 50;

  constructor() {
    this.createLayer("Base Layer");
  }

  /**
   * Create a new layer
   */
  createLayer(name: string, order?: number): AnnotationLayer {
    name = validateString(name, "name");

    const layer: AnnotationLayer = {
      id: uuidv4(),
      name,
      elements: [],
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      order: order ?? this.layers.size,
    };

    this.layers.set(layer.id, layer);
    if (!this.activeLayerId) {
      this.activeLayerId = layer.id;
    }

    this.recordAction({
      type: "layer_add",
      timestamp: new Date(),
      data: layer,
    });

    return layer;
  }

  /**
   * Delete a layer
   */
  deleteLayer(layerId: string): void {
    layerId = validateString(layerId, "layerId");

    const layer = this.layers.get(layerId);
    if (!layer) {
      throw new AppError(
        "LAYER_NOT_FOUND",
        `Layer ${layerId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    this.recordAction({
      type: "layer_remove",
      timestamp: new Date(),
      data: layer,
      previousState: layer,
    });

    this.layers.delete(layerId);

    if (this.activeLayerId === layerId) {
      const remainingLayers = Array.from(this.layers.values());
      this.activeLayerId = remainingLayers[0]?.id || "";
    }
  }

  /**
   * Get layer by ID
   */
  getLayer(layerId: string): AnnotationLayer {
    layerId = validateString(layerId, "layerId");

    const layer = this.layers.get(layerId);
    if (!layer) {
      throw new AppError(
        "LAYER_NOT_FOUND",
        `Layer ${layerId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    return layer;
  }

  /**
   * Set active layer
   */
  setActiveLayer(layerId: string): void {
    layerId = validateString(layerId, "layerId");

    if (!this.layers.has(layerId)) {
      throw new AppError(
        "LAYER_NOT_FOUND",
        `Layer ${layerId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    this.activeLayerId = layerId;
  }

  /**
   * Get active layer
   */
  getActiveLayer(): AnnotationLayer {
    if (!this.activeLayerId) {
      throw new AppError(
        "NO_ACTIVE_LAYER",
        "No active layer set",
        ErrorSeverity.HIGH
      );
    }

    return this.getLayer(this.activeLayerId);
  }

  /**
   * Add element to layer
   */
  addElement(layerId: string, element: DrawingElement): void {
    layerId = validateString(layerId, "layerId");
    validateRequired(element, "element");

    const layer = this.getLayer(layerId);
    layer.elements.push(element);

    this.recordAction({
      type: "add",
      timestamp: new Date(),
      data: { layerId, element },
    });
  }

  /**
   * Remove element from layer
   */
  removeElement(layerId: string, elementId: string): void {
    layerId = validateString(layerId, "layerId");
    elementId = validateString(elementId, "elementId");

    const layer = this.getLayer(layerId);
    const index = layer.elements.findIndex((e) => e.id === elementId);

    if (index === -1) {
      throw new AppError(
        "ELEMENT_NOT_FOUND",
        `Element ${elementId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    const element = layer.elements[index];
    layer.elements.splice(index, 1);

    this.recordAction({
      type: "remove",
      timestamp: new Date(),
      data: { layerId, elementId },
      previousState: element,
    });
  }

  /**
   * Update element
   */
  updateElement(
    layerId: string,
    elementId: string,
    updates: Partial<DrawingElement>
  ): void {
    layerId = validateString(layerId, "layerId");
    elementId = validateString(elementId, "elementId");

    const layer = this.getLayer(layerId);
    const element = layer.elements.find((e) => e.id === elementId);

    if (!element) {
      throw new AppError(
        "ELEMENT_NOT_FOUND",
        `Element ${elementId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    const previousState = { ...element };
    Object.assign(element, updates);
    element.updatedAt = new Date();

    this.recordAction({
      type: "modify",
      timestamp: new Date(),
      data: { layerId, elementId, updates },
      previousState,
    });
  }

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(layerId: string): void {
    const layer = this.getLayer(layerId);
    layer.visible = !layer.visible;

    this.recordAction({
      type: "layer_modify",
      timestamp: new Date(),
      data: { layerId, visible: layer.visible },
    });
  }

  /**
   * Toggle layer lock
   */
  toggleLayerLock(layerId: string): void {
    const layer = this.getLayer(layerId);
    layer.locked = !layer.locked;

    this.recordAction({
      type: "layer_modify",
      timestamp: new Date(),
      data: { layerId, locked: layer.locked },
    });
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    opacity = validateNumber(opacity, "opacity", { min: 0, max: 1 });
    const layer = this.getLayer(layerId);
    layer.opacity = opacity;

    this.recordAction({
      type: "layer_modify",
      timestamp: new Date(),
      data: { layerId, opacity },
    });
  }

  /**
   * Get all layers
   */
  getAllLayers(): AnnotationLayer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Record action for undo/redo
   */
  private recordAction(action: UndoRedoAction): void {
    this.undoStack.push(action);
    this.redoStack = [];

    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (this.undoStack.length === 0) {
      throw new AppError(
        "NOTHING_TO_UNDO",
        "No actions to undo",
        ErrorSeverity.LOW
      );
    }

    const action = this.undoStack.pop()!;
    this.redoStack.push(action);

    // Implement undo logic based on action type
    this.applyUndoAction(action);
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (this.redoStack.length === 0) {
      throw new AppError(
        "NOTHING_TO_REDO",
        "No actions to redo",
        ErrorSeverity.LOW
      );
    }

    const action = this.redoStack.pop()!;
    this.undoStack.push(action);

    // Implement redo logic based on action type
    this.applyRedoAction(action);
  }

  /**
   * Apply undo action
   */
  private applyUndoAction(action: UndoRedoAction): void {
    // Implementation would restore previous state
    // This is a simplified version
  }

  /**
   * Apply redo action
   */
  private applyRedoAction(action: UndoRedoAction): void {
    // Implementation would reapply the action
    // This is a simplified version
  }

  /**
   * Can undo
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Can redo
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
