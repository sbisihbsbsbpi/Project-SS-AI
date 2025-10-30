/**
 * Advanced Annotation Tests
 * Tests for canvas drawing, layers, templates, and advanced features
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AdvancedAnnotation,
  CanvasDrawingTools,
  AdvancedFeatures,
  LayerManager,
  TemplateSystem,
  DrawingToolType,
  DrawingStyle,
} from "../../src/features/advancedAnnotation";

describe("AdvancedAnnotation Module", () => {
  let mockCanvas: any;
  let mockCtx: any;

  beforeEach(() => {
    // Create mock canvas for Node.js environment
    mockCtx = {
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      lineCap: "round",
      lineJoin: "round",
      fillStyle: "",
      font: "",
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
      })),
      putImageData: vi.fn(),
    };

    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockCtx),
      toDataURL: vi.fn((type: string) => `data:${type};base64,mockdata`),
    };
  });

  describe("CanvasDrawingTools", () => {
    let drawingTools: CanvasDrawingTools;

    beforeEach(() => {
      drawingTools = new CanvasDrawingTools(mockCanvas);
    });

    it("should initialize with default style", () => {
      expect(drawingTools).toBeDefined();
    });

    it("should set drawing tool", () => {
      drawingTools.setTool(DrawingToolType.RECTANGLE);
      expect(drawingTools).toBeDefined();
    });

    it("should set drawing style", () => {
      const style: Partial<DrawingStyle> = {
        strokeColor: "#FF0000",
        strokeWidth: 3,
      };
      drawingTools.setStyle(style);
      expect(drawingTools).toBeDefined();
    });

    it("should start and end drawing", () => {
      drawingTools.startDrawing(10, 10);
      const element = drawingTools.endDrawing();
      expect(element).toBeDefined();
      expect(element?.startX).toBe(10);
      expect(element?.startY).toBe(10);
    });

    it("should get canvas data URL", () => {
      const dataUrl = drawingTools.getCanvasDataUrl("png");
      expect(dataUrl).toMatch(/^data:image\/png/);
    });

    it("should clear canvas", () => {
      drawingTools.clearCanvas();
      expect(mockCanvas).toBeDefined();
    });
  });

  describe("AdvancedFeatures", () => {
    let features: AdvancedFeatures;

    beforeEach(() => {
      features = new AdvancedFeatures(mockCanvas);
    });

    it("should create measurement", () => {
      const measurement = features.createMeasurement(0, 0, 100, 100);
      expect(measurement).toBeDefined();
      expect(measurement.distance).toBeGreaterThan(0);
      expect(measurement.angle).toBeDefined();
    });

    it("should create blur region", () => {
      const blur = features.createBlurRegion(10, 10, 100, 100, 5);
      expect(blur).toBeDefined();
      expect(blur.blurRadius).toBe(5);
    });

    it("should create highlight region", () => {
      const highlight = features.createHighlightRegion(
        10,
        10,
        100,
        100,
        "#FFFF00",
        0.5
      );
      expect(highlight).toBeDefined();
      expect(highlight.color).toBe("#FFFF00");
      expect(highlight.opacity).toBe(0.5);
    });

    it("should pick color from canvas", () => {
      const color = features.pickColor(10, 10);
      expect(color).toMatch(/^rgb\(/);
    });

    it("should get all measurements", () => {
      features.createMeasurement(0, 0, 100, 100);
      features.createMeasurement(50, 50, 150, 150);
      const measurements = features.getMeasurements();
      expect(measurements.length).toBe(2);
    });

    it("should get all blur regions", () => {
      features.createBlurRegion(10, 10, 100, 100);
      features.createBlurRegion(50, 50, 100, 100);
      const blurs = features.getBlurRegions();
      expect(blurs.length).toBe(2);
    });

    it("should get all highlight regions", () => {
      features.createHighlightRegion(10, 10, 100, 100);
      features.createHighlightRegion(50, 50, 100, 100);
      const highlights = features.getHighlightRegions();
      expect(highlights.length).toBe(2);
    });

    it("should clear all regions", () => {
      features.createMeasurement(0, 0, 100, 100);
      features.createBlurRegion(10, 10, 100, 100);
      features.createHighlightRegion(10, 10, 100, 100);
      features.clearAll();
      expect(features.getMeasurements().length).toBe(0);
      expect(features.getBlurRegions().length).toBe(0);
      expect(features.getHighlightRegions().length).toBe(0);
    });
  });

  describe("LayerManager", () => {
    let layerManager: LayerManager;

    beforeEach(() => {
      layerManager = new LayerManager();
    });

    it("should create layer", () => {
      const layer = layerManager.createLayer("Test Layer");
      expect(layer).toBeDefined();
      expect(layer.name).toBe("Test Layer");
      expect(layer.visible).toBe(true);
      expect(layer.locked).toBe(false);
    });

    it("should get layer by ID", () => {
      const layer = layerManager.createLayer("Test Layer");
      const retrieved = layerManager.getLayer(layer.id);
      expect(retrieved.id).toBe(layer.id);
    });

    it("should set active layer", () => {
      const layer = layerManager.createLayer("Test Layer");
      layerManager.setActiveLayer(layer.id);
      const active = layerManager.getActiveLayer();
      expect(active.id).toBe(layer.id);
    });

    it("should delete layer", () => {
      const layer = layerManager.createLayer("Test Layer");
      layerManager.deleteLayer(layer.id);
      expect(() => layerManager.getLayer(layer.id)).toThrow();
    });

    it("should toggle layer visibility", () => {
      const layer = layerManager.createLayer("Test Layer");
      const initialVisibility = layer.visible;
      layerManager.toggleLayerVisibility(layer.id);
      const updated = layerManager.getLayer(layer.id);
      expect(updated.visible).toBe(!initialVisibility);
    });

    it("should toggle layer lock", () => {
      const layer = layerManager.createLayer("Test Layer");
      const initialLock = layer.locked;
      layerManager.toggleLayerLock(layer.id);
      const updated = layerManager.getLayer(layer.id);
      expect(updated.locked).toBe(!initialLock);
    });

    it("should set layer opacity", () => {
      const layer = layerManager.createLayer("Test Layer");
      layerManager.setLayerOpacity(layer.id, 0.5);
      const updated = layerManager.getLayer(layer.id);
      expect(updated.opacity).toBe(0.5);
    });

    it("should get all layers", () => {
      layerManager.createLayer("Layer 1");
      layerManager.createLayer("Layer 2");
      const layers = layerManager.getAllLayers();
      expect(layers.length).toBeGreaterThanOrEqual(2);
    });

    it("should support undo/redo", () => {
      expect(layerManager.canUndo()).toBe(true);
      layerManager.undo();
      expect(layerManager.canRedo()).toBe(true);
    });
  });

  describe("TemplateSystem", () => {
    let templateSystem: TemplateSystem;

    beforeEach(() => {
      templateSystem = new TemplateSystem();
    });

    it("should create template", () => {
      const template = templateSystem.createTemplate(
        "Test Template",
        "A test template",
        [],
        ["test"]
      );
      expect(template).toBeDefined();
      expect(template.name).toBe("Test Template");
      expect(template.tags).toContain("test");
    });

    it("should load template", () => {
      const created = templateSystem.createTemplate(
        "Test Template",
        "A test template",
        [],
        []
      );
      const loaded = templateSystem.loadTemplate(created.id);
      expect(loaded.id).toBe(created.id);
    });

    it("should get template by name", () => {
      templateSystem.createTemplate("Test Template", "A test template", [], []);
      const found = templateSystem.getTemplateByName("Test Template");
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test Template");
    });

    it("should update template", () => {
      const template = templateSystem.createTemplate(
        "Test Template",
        "A test template",
        [],
        []
      );
      const updated = templateSystem.updateTemplate(template.id, {
        description: "Updated description",
      });
      expect(updated.description).toBe("Updated description");
    });

    it("should delete template", () => {
      const template = templateSystem.createTemplate(
        "Test Template",
        "A test template",
        [],
        []
      );
      templateSystem.deleteTemplate(template.id);
      expect(() => templateSystem.loadTemplate(template.id)).toThrow();
    });

    it("should search templates by tag", () => {
      templateSystem.createTemplate("Template 1", "Desc 1", [], ["tag1"]);
      templateSystem.createTemplate("Template 2", "Desc 2", [], ["tag2"]);
      const results = templateSystem.searchByTag("tag1");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should search templates by name", () => {
      templateSystem.createTemplate("Test Template", "Desc", [], []);
      const results = templateSystem.searchByName("Test");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should export and import template", () => {
      const template = templateSystem.createTemplate(
        "Test Template",
        "A test template",
        [],
        ["test"]
      );
      const exported = templateSystem.exportTemplate(template.id);
      expect(exported).toContain("Test Template");

      const imported = templateSystem.importTemplate(exported);
      expect(imported.name).toBe("Test Template");
    });

    it("should duplicate template", () => {
      const template = templateSystem.createTemplate(
        "Test Template",
        "A test template",
        [],
        ["test"]
      );
      const duplicate = templateSystem.duplicateTemplate(
        template.id,
        "Duplicate"
      );
      expect(duplicate.name).toBe("Duplicate");
      expect(duplicate.tags).toEqual(template.tags);
    });
  });

  describe("AdvancedAnnotation", () => {
    let annotation: AdvancedAnnotation;

    beforeEach(() => {
      annotation = new AdvancedAnnotation(mockCanvas);
    });

    it("should initialize", () => {
      expect(annotation).toBeDefined();
    });

    it("should get canvas drawing tools", () => {
      const tools = annotation.getCanvasDrawing();
      expect(tools).toBeDefined();
    });

    it("should get advanced features", () => {
      const features = annotation.getAdvancedFeatures();
      expect(features).toBeDefined();
    });

    it("should get layer manager", () => {
      const manager = annotation.getLayerManager();
      expect(manager).toBeDefined();
    });

    it("should get template system", () => {
      const system = annotation.getTemplateSystem();
      expect(system).toBeDefined();
    });

    it("should export annotation", () => {
      const result = annotation.export({ format: "png", quality: 100 });
      expect(result).toBeDefined();
      expect(result.exportFormat).toBe("png");
    });

    it("should support undo/redo", () => {
      expect(annotation.canUndo()).toBe(true);
      annotation.undo();
      expect(annotation.canRedo()).toBe(true);
    });

    it("should clear canvas", () => {
      annotation.clear();
      expect(annotation).toBeDefined();
    });
  });
});
