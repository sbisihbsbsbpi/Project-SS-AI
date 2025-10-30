/**
 * Canvas Drawing Tools
 * Implements freehand, shapes, arrows, and text annotations
 */

import { v4 as uuidv4 } from "uuid";
import {
  DrawingElement,
  DrawingToolType,
  DrawingStyle,
  AnnotationCanvasState,
  AnnotationLayer,
} from "./types";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateNumber, validateString } from "../../utils/validation";

export class CanvasDrawingTools {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentTool: DrawingToolType = DrawingToolType.FREEHAND;
  private currentStyle: DrawingStyle;
  private isDrawing: boolean = false;
  private startX: number = 0;
  private startY: number = 0;

  constructor(canvasElement?: HTMLCanvasElement) {
    this.currentStyle = {
      strokeColor: "#000000",
      strokeWidth: 2,
      opacity: 1,
    };

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
   * Set the current drawing tool
   */
  setTool(tool: DrawingToolType): void {
    this.currentTool = tool;
  }

  /**
   * Set the drawing style
   */
  setStyle(style: Partial<DrawingStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  /**
   * Start drawing
   */
  startDrawing(x: number, y: number): void {
    this.startX = validateNumber(x, "x", { min: 0 });
    this.startY = validateNumber(y, "y", { min: 0 });
    this.isDrawing = true;
  }

  /**
   * Draw freehand
   */
  drawFreehand(x: number, y: number): void {
    if (!this.ctx || !this.isDrawing) return;

    this.ctx.strokeStyle = this.currentStyle.strokeColor;
    this.ctx.lineWidth = this.currentStyle.strokeWidth;
    this.ctx.globalAlpha = this.currentStyle.opacity;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  /**
   * Draw rectangle
   */
  drawRectangle(x: number, y: number): void {
    if (!this.ctx) return;

    const width = x - this.startX;
    const height = y - this.startY;

    this.ctx.strokeStyle = this.currentStyle.strokeColor;
    this.ctx.lineWidth = this.currentStyle.strokeWidth;
    this.ctx.globalAlpha = this.currentStyle.opacity;

    if (this.currentStyle.fillColor) {
      this.ctx.fillStyle = this.currentStyle.fillColor;
      this.ctx.fillRect(this.startX, this.startY, width, height);
    }

    this.ctx.strokeRect(this.startX, this.startY, width, height);
  }

  /**
   * Draw circle
   */
  drawCircle(x: number, y: number): void {
    if (!this.ctx) return;

    const radius = Math.sqrt(
      Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2)
    );

    this.ctx.strokeStyle = this.currentStyle.strokeColor;
    this.ctx.lineWidth = this.currentStyle.strokeWidth;
    this.ctx.globalAlpha = this.currentStyle.opacity;

    this.ctx.beginPath();
    this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);

    if (this.currentStyle.fillColor) {
      this.ctx.fillStyle = this.currentStyle.fillColor;
      this.ctx.fill();
    }

    this.ctx.stroke();
  }

  /**
   * Draw line
   */
  drawLine(x: number, y: number): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = this.currentStyle.strokeColor;
    this.ctx.lineWidth = this.currentStyle.strokeWidth;
    this.ctx.globalAlpha = this.currentStyle.opacity;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(this.startX, this.startY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  /**
   * Draw arrow
   */
  drawArrow(x: number, y: number): void {
    if (!this.ctx) return;

    const headlen = 15;
    const angle = Math.atan2(y - this.startY, x - this.startX);

    this.ctx.strokeStyle = this.currentStyle.strokeColor;
    this.ctx.lineWidth = this.currentStyle.strokeWidth;
    this.ctx.globalAlpha = this.currentStyle.opacity;
    this.ctx.fillStyle = this.currentStyle.strokeColor;

    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(this.startX, this.startY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    // Draw arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - headlen * Math.cos(angle - Math.PI / 6),
      y - headlen * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      x - headlen * Math.cos(angle + Math.PI / 6),
      y - headlen * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draw text
   */
  drawText(x: number, y: number, text: string): void {
    if (!this.ctx) return;

    const fontSize = this.currentStyle.fontSize || 16;
    const fontFamily = this.currentStyle.fontFamily || "Arial";

    this.ctx.font = `${
      this.currentStyle.fontWeight || "normal"
    } ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = this.currentStyle.strokeColor;
    this.ctx.globalAlpha = this.currentStyle.opacity;
    this.ctx.fillText(text, x, y);
  }

  /**
   * End drawing
   */
  endDrawing(): DrawingElement | null {
    if (!this.isDrawing) return null;

    this.isDrawing = false;

    return {
      id: uuidv4(),
      type: this.currentTool,
      startX: this.startX,
      startY: this.startY,
      endX: 0,
      endY: 0,
      style: { ...this.currentStyle },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Clear canvas
   */
  clearCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Get canvas data URL
   */
  getCanvasDataUrl(format: "png" | "jpeg" = "png"): string {
    if (!this.canvas) {
      throw new AppError(
        "NO_CANVAS",
        "Canvas not initialized",
        ErrorSeverity.HIGH
      );
    }
    return this.canvas.toDataURL(`image/${format}`);
  }
}
