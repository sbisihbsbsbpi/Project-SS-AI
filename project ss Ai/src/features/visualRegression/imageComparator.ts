/**
 * Image Comparator
 * Performs pixel-by-pixel comparison using pixelmatch
 */

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Logger } from '../../utils/logger';
import {
  ComparisonResult,
  ComparisonOptions,
  IImageComparator,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class ImageComparator implements IImageComparator {
  private defaultOptions: ComparisonOptions = {
    threshold: 0.1,
    includeAA: false,
    alpha: 0.5,
    aaColor: [255, 255, 0],
    diffColor: [255, 0, 0],
  };

  /**
   * Compare two images and return comparison result
   */
  async compare(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    options?: ComparisonOptions
  ): Promise<ComparisonResult> {
    try {
      const opts = { ...this.defaultOptions, ...options };

      // Parse PNG images
      const baselineImage = PNG.sync.read(baselineBuffer);
      const currentImage = PNG.sync.read(currentBuffer);

      // Validate dimensions
      if (
        baselineImage.width !== currentImage.width ||
        baselineImage.height !== currentImage.height
      ) {
        throw new Error(
          `Image dimensions do not match: ${baselineImage.width}x${baselineImage.height} vs ${currentImage.width}x${currentImage.height}`
        );
      }

      // Create diff image buffer
      const { width, height } = baselineImage;
      const diffImage = new PNG({ width, height });

      // Perform pixel-by-pixel comparison
      const pixelDifferences = pixelmatch(
        baselineImage.data,
        currentImage.data,
        diffImage.data,
        width,
        height,
        {
          threshold: opts.threshold,
          includeAA: opts.includeAA,
          alpha: opts.alpha,
          aaColor: opts.aaColor,
          diffColor: opts.diffColor,
        }
      );

      const totalPixels = width * height;
      const percentageDifference = (pixelDifferences / totalPixels) * 100;
      const isSimilar = percentageDifference <= (opts.threshold || 0.1) * 100;

      const result: ComparisonResult = {
        id: uuidv4(),
        baselineId: '',
        currentImagePath: '',
        timestamp: new Date(),
        pixelDifferences,
        totalPixels,
        percentageDifference,
        isSimilar,
        threshold: opts.threshold || 0.1,
      };

      Logger.info('Image comparison completed', {
        pixelDifferences,
        percentageDifference: percentageDifference.toFixed(2),
        isSimilar,
      });

      return result;
    } catch (error) {
      Logger.error('Image comparison failed', error);
      throw error;
    }
  }

  /**
   * Generate diff image showing differences
   */
  async generateDiffImage(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    diffBuffer: Buffer,
    options?: ComparisonOptions
  ): Promise<Buffer> {
    try {
      const opts = { ...this.defaultOptions, ...options };

      // Parse images
      const baselineImage = PNG.sync.read(baselineBuffer);
      const currentImage = PNG.sync.read(currentBuffer);
      const diffImage = PNG.sync.read(diffBuffer);

      // Perform comparison to populate diff image
      pixelmatch(
        baselineImage.data,
        currentImage.data,
        diffImage.data,
        baselineImage.width,
        baselineImage.height,
        {
          threshold: opts.threshold,
          includeAA: opts.includeAA,
          alpha: opts.alpha,
          aaColor: opts.aaColor,
          diffColor: opts.diffColor,
        }
      );

      // Encode diff image to PNG
      const pngBuffer = PNG.sync.write(diffImage);

      Logger.info('Diff image generated', {
        width: diffImage.width,
        height: diffImage.height,
      });

      return pngBuffer;
    } catch (error) {
      Logger.error('Failed to generate diff image', error);
      throw error;
    }
  }

  /**
   * Calculate similarity score (0-100)
   */
  calculateSimilarity(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    options?: ComparisonOptions
  ): number {
    try {
      const opts = { ...this.defaultOptions, ...options };

      const baselineImage = PNG.sync.read(baselineBuffer);
      const currentImage = PNG.sync.read(currentBuffer);

      if (
        baselineImage.width !== currentImage.width ||
        baselineImage.height !== currentImage.height
      ) {
        return 0;
      }

      const { width, height } = baselineImage;
      const diffImage = new PNG({ width, height });

      const pixelDifferences = pixelmatch(
        baselineImage.data,
        currentImage.data,
        diffImage.data,
        width,
        height,
        {
          threshold: opts.threshold,
          includeAA: opts.includeAA,
          alpha: opts.alpha,
          aaColor: opts.aaColor,
          diffColor: opts.diffColor,
        }
      );

      const totalPixels = width * height;
      const similarity = 100 - (pixelDifferences / totalPixels) * 100;

      return Math.max(0, Math.min(100, similarity));
    } catch (error) {
      Logger.error('Failed to calculate similarity', error);
      return 0;
    }
  }
}

