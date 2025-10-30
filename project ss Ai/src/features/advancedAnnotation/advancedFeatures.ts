/**
 * Advanced Annotation Features
 * Implements measurements, blur, highlight, and color picker
 */

import { v4 as uuidv4 } from "uuid";
import {
  MeasurementResult,
  BlurRegion,
  HighlightRegion,
  DrawingStyle,
} from "./types";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateNumber, validateString } from "../../utils/validation";

export class AdvancedFeatures {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private measurements: Map<string, MeasurementResult> = new Map();
  private blurRegions: Map<string, BlurRegion> = new Map();
  private highlightRegions: Map<string, HighlightRegion> = new Map();

  constructor(canvasElement?: HTMLCanvasElement) {
    if (canvasElement) {
      this.setCanvas(canvasElement);
    }
  }

  /**
   * Set the canvas element
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) {
      throw new AppError(
        "INVALID_CANVAS",
        "Canvas element is required",
        ErrorSeverity.HIGH
      );
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) {
      throw new AppError(
        "CANVAS_CONTEXT_ERROR",
        "Failed to get 2D context from canvas",
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Create measurement between two points
   */
  createMeasurement(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    unit: "px" | "cm" | "in" = "px"
  ): MeasurementResult {
    startX = validateNumber(startX, "startX", { min: 0 });
    startY = validateNumber(startY, "startY", { min: 0 });
    endX = validateNumber(endX, "endX", { min: 0 });
    endY = validateNumber(endY, "endY", { min: 0 });

    const distance = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
    );
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

    const measurement: MeasurementResult = {
      id: uuidv4(),
      startX,
      startY,
      endX,
      endY,
      distance,
      angle: angle < 0 ? angle + 360 : angle,
      unit,
    };

    this.measurements.set(measurement.id, measurement);
    return measurement;
  }

  /**
   * Draw measurement on canvas
   */
  drawMeasurement(measurement: MeasurementResult, style: DrawingStyle): void {
    if (!this.ctx) return;

    const { startX, startY, endX, endY, distance, angle } = measurement;

    // Draw line
    this.ctx.strokeStyle = style.strokeColor;
    this.ctx.lineWidth = style.strokeWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Draw endpoints
    this.ctx.fillStyle = style.strokeColor;
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    this.ctx.font = "12px Arial";
    this.ctx.fillText(`${distance.toFixed(2)}px`, midX + 10, midY - 10);
  }

  /**
   * Create blur region
   */
  createBlurRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    blurRadius: number = 10
  ): BlurRegion {
    x = validateNumber(x, "x", { min: 0 });
    y = validateNumber(y, "y", { min: 0 });
    width = validateNumber(width, "width", { min: 1 });
    height = validateNumber(height, "height", { min: 1 });
    blurRadius = validateNumber(blurRadius, "blurRadius", { min: 1, max: 50 });

    const region: BlurRegion = {
      id: uuidv4(),
      x,
      y,
      width,
      height,
      blurRadius,
    };

    this.blurRegions.set(region.id, region);
    return region;
  }

  /**
   * Apply blur to canvas region
   */
  applyBlur(region: BlurRegion): void {
    if (!this.canvas || !this.ctx) return;

    const imageData = this.ctx.getImageData(
      region.x,
      region.y,
      region.width,
      region.height
    );
    const data = imageData.data;

    // Simple blur algorithm
    for (let i = 0; i < region.blurRadius; i++) {
      this.blurPixels(data, region.width, region.height);
    }

    this.ctx.putImageData(imageData, region.x, region.y);
  }

  /**
   * Blur pixels in image data
   */
  private blurPixels(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const temp = new Uint8ClampedArray(data);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4;

        let r = 0,
          g = 0,
          b = 0,
          a = 0,
          count = 0;

        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = i + di;
            const nj = j + dj;

            if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
              const nidx = (ni * width + nj) * 4;
              r += temp[nidx];
              g += temp[nidx + 1];
              b += temp[nidx + 2];
              a += temp[nidx + 3];
              count++;
            }
          }
        }

        data[idx] = r / count;
        data[idx + 1] = g / count;
        data[idx + 2] = b / count;
        data[idx + 3] = a / count;
      }
    }
  }

  /**
   * Create highlight region
   */
  createHighlightRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string = "#FFFF00",
    opacity: number = 0.3
  ): HighlightRegion {
    x = validateNumber(x, "x", { min: 0 });
    y = validateNumber(y, "y", { min: 0 });
    width = validateNumber(width, "width", { min: 1 });
    height = validateNumber(height, "height", { min: 1 });
    color = validateString(color, "color");
    opacity = validateNumber(opacity, "opacity", { min: 0, max: 1 });

    const region: HighlightRegion = {
      id: uuidv4(),
      x,
      y,
      width,
      height,
      color,
      opacity,
    };

    this.highlightRegions.set(region.id, region);
    return region;
  }

  /**
   * Draw highlight on canvas
   */
  drawHighlight(region: HighlightRegion): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = region.color;
    this.ctx.globalAlpha = region.opacity;
    this.ctx.fillRect(region.x, region.y, region.width, region.height);
    this.ctx.globalAlpha = 1;
  }

  /**
   * Pick color from canvas
   */
  pickColor(x: number, y: number): string {
    if (!this.ctx) {
      throw new AppError(
        "NO_CANVAS",
        "Canvas not initialized",
        ErrorSeverity.HIGH
      );
    }

    x = validateNumber(x, "x", { min: 0 });
    y = validateNumber(y, "y", { min: 0 });

    const imageData = this.ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;

    return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  }

  /**
   * Get all measurements
   */
  getMeasurements(): MeasurementResult[] {
    return Array.from(this.measurements.values());
  }

  /**
   * Get all blur regions
   */
  getBlurRegions(): BlurRegion[] {
    return Array.from(this.blurRegions.values());
  }

  /**
   * Get all highlight regions
   */
  getHighlightRegions(): HighlightRegion[] {
    return Array.from(this.highlightRegions.values());
  }

  /**
   * Clear all regions
   */
  clearAll(): void {
    this.measurements.clear();
    this.blurRegions.clear();
    this.highlightRegions.clear();
  }
}
