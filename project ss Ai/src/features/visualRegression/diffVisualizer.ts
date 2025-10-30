/**
 * Diff Visualizer
 * Generates visual representations of image differences
 */

import { PNG } from 'pngjs';
import { Logger } from '../../utils/logger';
import { DiffVisualizationOptions, IDiffVisualizer } from './types';

export class DiffVisualizer implements IDiffVisualizer {
  private defaultOptions: DiffVisualizationOptions = {
    highlightColor: [255, 0, 0],
    opacity: 0.5,
    includeOverlay: true,
    generateBeforeAfter: true,
  };

  /**
   * Generate diff visualization with highlighted differences
   */
  async generateDiffVisualization(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    diffBuffer: Buffer,
    options?: DiffVisualizationOptions
  ): Promise<Buffer> {
    try {
      const opts = { ...this.defaultOptions, ...options };

      const baselineImage = PNG.sync.read(baselineBuffer);
      const currentImage = PNG.sync.read(currentBuffer);
      const diffImage = PNG.sync.read(diffBuffer);

      // Create visualization image
      const vizImage = new PNG({
        width: baselineImage.width,
        height: baselineImage.height,
      });

      // Copy baseline image
      baselineImage.data.copy(vizImage.data);

      // Overlay diff highlights
      const [r, g, b] = opts.highlightColor || [255, 0, 0];
      const opacity = opts.opacity || 0.5;

      for (let i = 0; i < diffImage.data.length; i += 4) {
        // Check if pixel is different (non-zero alpha in diff)
        if (diffImage.data[i + 3] > 0) {
          vizImage.data[i] = Math.round(vizImage.data[i] * (1 - opacity) + r * opacity);
          vizImage.data[i + 1] = Math.round(vizImage.data[i + 1] * (1 - opacity) + g * opacity);
          vizImage.data[i + 2] = Math.round(vizImage.data[i + 2] * (1 - opacity) + b * opacity);
        }
      }

      const pngBuffer = PNG.sync.write(vizImage);

      Logger.info('Diff visualization generated', {
        width: vizImage.width,
        height: vizImage.height,
      });

      return pngBuffer;
    } catch (error) {
      Logger.error('Failed to generate diff visualization', error);
      throw error;
    }
  }

  /**
   * Generate before/after side-by-side view
   */
  async generateBeforeAfterView(
    baselineBuffer: Buffer,
    currentBuffer: Buffer
  ): Promise<Buffer> {
    try {
      const baselineImage = PNG.sync.read(baselineBuffer);
      const currentImage = PNG.sync.read(currentBuffer);

      // Validate dimensions
      if (
        baselineImage.width !== currentImage.width ||
        baselineImage.height !== currentImage.height
      ) {
        throw new Error('Images must have the same dimensions');
      }

      // Create combined image (side by side)
      const combinedWidth = baselineImage.width * 2 + 10; // 10px gap
      const combinedHeight = baselineImage.height;

      const combinedImage = new PNG({
        width: combinedWidth,
        height: combinedHeight,
      });

      // Fill with white background
      for (let i = 0; i < combinedImage.data.length; i += 4) {
        combinedImage.data[i] = 255; // R
        combinedImage.data[i + 1] = 255; // G
        combinedImage.data[i + 2] = 255; // B
        combinedImage.data[i + 3] = 255; // A
      }

      // Copy baseline to left side
      for (let y = 0; y < baselineImage.height; y++) {
        for (let x = 0; x < baselineImage.width; x++) {
          const srcIdx = (y * baselineImage.width + x) * 4;
          const dstIdx = (y * combinedWidth + x) * 4;

          combinedImage.data[dstIdx] = baselineImage.data[srcIdx];
          combinedImage.data[dstIdx + 1] = baselineImage.data[srcIdx + 1];
          combinedImage.data[dstIdx + 2] = baselineImage.data[srcIdx + 2];
          combinedImage.data[dstIdx + 3] = baselineImage.data[srcIdx + 3];
        }
      }

      // Copy current to right side (with gap)
      const xOffset = baselineImage.width + 10;
      for (let y = 0; y < currentImage.height; y++) {
        for (let x = 0; x < currentImage.width; x++) {
          const srcIdx = (y * currentImage.width + x) * 4;
          const dstIdx = (y * combinedWidth + (xOffset + x)) * 4;

          combinedImage.data[dstIdx] = currentImage.data[srcIdx];
          combinedImage.data[dstIdx + 1] = currentImage.data[srcIdx + 1];
          combinedImage.data[dstIdx + 2] = currentImage.data[srcIdx + 2];
          combinedImage.data[dstIdx + 3] = currentImage.data[srcIdx + 3];
        }
      }

      const pngBuffer = PNG.sync.write(combinedImage);

      Logger.info('Before/after view generated', {
        width: combinedImage.width,
        height: combinedImage.height,
      });

      return pngBuffer;
    } catch (error) {
      Logger.error('Failed to generate before/after view', error);
      throw error;
    }
  }

  /**
   * Generate overlay of diff on baseline
   */
  async generateOverlay(
    baselineBuffer: Buffer,
    diffBuffer: Buffer,
    opacity: number = 0.5
  ): Promise<Buffer> {
    try {
      const baselineImage = PNG.sync.read(baselineBuffer);
      const diffImage = PNG.sync.read(diffBuffer);

      const overlayImage = new PNG({
        width: baselineImage.width,
        height: baselineImage.height,
      });

      // Copy baseline
      baselineImage.data.copy(overlayImage.data);

      // Apply diff overlay
      for (let i = 0; i < diffImage.data.length; i += 4) {
        if (diffImage.data[i + 3] > 0) {
          overlayImage.data[i + 3] = Math.round(
            overlayImage.data[i + 3] * (1 - opacity) + 255 * opacity
          );
        }
      }

      const pngBuffer = PNG.sync.write(overlayImage);

      Logger.info('Overlay generated', {
        width: overlayImage.width,
        height: overlayImage.height,
        opacity,
      });

      return pngBuffer;
    } catch (error) {
      Logger.error('Failed to generate overlay', error);
      throw error;
    }
  }
}

