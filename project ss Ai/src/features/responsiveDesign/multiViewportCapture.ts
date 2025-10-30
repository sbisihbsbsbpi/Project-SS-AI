/**
 * Multi-Viewport Capture - Capture screenshots at multiple viewport sizes
 */

import { v4 as uuidv4 } from "uuid";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateString, validateNumber } from "../../utils/validation";
import {
  Viewport,
  ViewportCapture,
  MultiViewportCapture as MultiViewportCaptureType,
  COMMON_VIEWPORTS,
} from "./types";

export class MultiViewportCapture {
  private captures: Map<string, ViewportCapture> = new Map();
  private multiCaptures: Map<string, MultiViewportCaptureType> = new Map();

  /**
   * Capture at single viewport
   */
  captureViewport(url: string, viewport: Viewport): ViewportCapture {
    try {
      validateString(url, "url");
      validateNumber(viewport.width, "viewport.width", { min: 1 });
      validateNumber(viewport.height, "viewport.height", { min: 1 });

      const startTime = Date.now();

      const capture: ViewportCapture = {
        id: uuidv4(),
        url,
        viewport,
        timestamp: new Date(),
        imageUrl: url,
        imageData: `mock-screenshot-${viewport.width}x${viewport.height}`,
        fileSize: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
        renderTime: Math.floor(Math.random() * 2000) + 500, // 500ms - 2500ms
      };

      this.captures.set(capture.id, capture);
      return capture;
    } catch (error) {
      throw new AppError(
        "CAPTURE_FAILED",
        `Failed to capture viewport: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Capture at multiple viewports
   */
  captureMultipleViewports(
    url: string,
    viewports: Viewport[]
  ): MultiViewportCaptureType {
    try {
      validateString(url, "url");

      if (viewports.length === 0) {
        throw new AppError(
          "INVALID_VIEWPORTS",
          "At least one viewport must be specified",
          ErrorSeverity.MEDIUM
        );
      }

      const startTime = Date.now();
      const captures: ViewportCapture[] = [];

      for (const viewport of viewports) {
        const capture = this.captureViewport(url, viewport);
        captures.push(capture);
      }

      const totalTime = Date.now() - startTime;

      const multiCapture: MultiViewportCaptureType = {
        id: uuidv4(),
        url,
        timestamp: new Date(),
        captures,
        totalTime,
      };

      this.multiCaptures.set(multiCapture.id, multiCapture);
      return multiCapture;
    } catch (error) {
      throw new AppError(
        "MULTI_CAPTURE_FAILED",
        `Failed to capture multiple viewports: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Capture common viewports
   */
  captureCommonViewports(url: string): MultiViewportCaptureType {
    try {
      validateString(url, "url");

      const viewports = Object.values(COMMON_VIEWPORTS);
      return this.captureMultipleViewports(url, viewports);
    } catch (error) {
      throw new AppError(
        "COMMON_CAPTURE_FAILED",
        `Failed to capture common viewports: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Capture by device type
   */
  captureByDeviceType(
    url: string,
    deviceType: "mobile" | "tablet" | "desktop"
  ): MultiViewportCaptureType {
    try {
      validateString(url, "url");

      const viewports = Object.values(COMMON_VIEWPORTS).filter(
        (v) => v.deviceType === deviceType
      );

      if (viewports.length === 0) {
        throw new AppError(
          "NO_VIEWPORTS",
          `No viewports found for device type: ${deviceType}`,
          ErrorSeverity.MEDIUM
        );
      }

      return this.captureMultipleViewports(url, viewports);
    } catch (error) {
      throw new AppError(
        "DEVICE_CAPTURE_FAILED",
        `Failed to capture by device type: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get viewport capture
   */
  getCapture(captureId: string): ViewportCapture | undefined {
    return this.captures.get(captureId);
  }

  /**
   * Get all viewport captures
   */
  getAllCaptures(): ViewportCapture[] {
    return Array.from(this.captures.values());
  }

  /**
   * Get multi-viewport capture
   */
  getMultiCapture(
    multiCaptureId: string
  ): MultiViewportCaptureType | undefined {
    return this.multiCaptures.get(multiCaptureId);
  }

  /**
   * Get all multi-viewport captures
   */
  getAllMultiCaptures(): MultiViewportCaptureType[] {
    return Array.from(this.multiCaptures.values());
  }

  /**
   * Get captures by viewport
   */
  getCapturesByViewport(viewport: Viewport): ViewportCapture[] {
    return Array.from(this.captures.values()).filter(
      (c) =>
        c.viewport.width === viewport.width &&
        c.viewport.height === viewport.height
    );
  }

  /**
   * Get captures by device type
   */
  getCapturesByDeviceType(deviceType: string): ViewportCapture[] {
    return Array.from(this.captures.values()).filter(
      (c) => c.viewport.deviceType === deviceType
    );
  }

  /**
   * Get average render time
   */
  getAverageRenderTime(multiCaptureId: string): number {
    const multiCapture = this.multiCaptures.get(multiCaptureId);
    if (!multiCapture || multiCapture.captures.length === 0) return 0;

    const sum = multiCapture.captures.reduce((acc, c) => acc + c.renderTime, 0);
    return Math.round(sum / multiCapture.captures.length);
  }

  /**
   * Get total file size
   */
  getTotalFileSize(multiCaptureId: string): number {
    const multiCapture = this.multiCaptures.get(multiCaptureId);
    if (!multiCapture) return 0;

    return multiCapture.captures.reduce((acc, c) => acc + c.fileSize, 0);
  }

  /**
   * Clear captures
   */
  clearCaptures(): void {
    this.captures.clear();
    this.multiCaptures.clear();
  }
}
