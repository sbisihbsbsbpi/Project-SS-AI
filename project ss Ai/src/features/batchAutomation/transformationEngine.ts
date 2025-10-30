/**
 * Transformation Engine
 * Handles image transformations: crop, resize, filter, rotate, compress
 */

import sharp from 'sharp';
import { Logger } from '../../utils/logger';
import {
  ITransformationEngine,
  CropConfig,
  ResizeConfig,
  FilterConfig,
} from './types';

export class TransformationEngine implements ITransformationEngine {
  /**
   * Crop image
   */
  async crop(buffer: Buffer, config: CropConfig): Promise<Buffer> {
    try {
      const { x, y, width, height } = config.options;

      Logger.debug(`Cropping image: x=${x}, y=${y}, width=${width}, height=${height}`);

      const result = await sharp(buffer)
        .extract({ left: x, top: y, width, height })
        .toBuffer();

      Logger.info(`Image cropped successfully`);
      return result;
    } catch (error) {
      Logger.error('Failed to crop image', error);
      throw error;
    }
  }

  /**
   * Resize image
   */
  async resize(buffer: Buffer, config: ResizeConfig): Promise<Buffer> {
    try {
      const { width, height, fit = 'cover' } = config.options;

      Logger.debug(`Resizing image: width=${width}, height=${height}, fit=${fit}`);

      const result = await sharp(buffer)
        .resize(width, height, { fit: fit as any })
        .toBuffer();

      Logger.info(`Image resized successfully`);
      return result;
    } catch (error) {
      Logger.error('Failed to resize image', error);
      throw error;
    }
  }

  /**
   * Apply filter to image
   */
  async filter(buffer: Buffer, config: FilterConfig): Promise<Buffer> {
    try {
      const { name, value = 1 } = config.options;

      Logger.debug(`Applying filter: ${name}, value=${value}`);

      let image = sharp(buffer);

      switch (name) {
        case 'grayscale':
          image = image.grayscale();
          break;
        case 'sepia':
          image = image.tint({ r: 112, g: 66, b: 20 });
          break;
        case 'blur':
          image = image.blur(Math.min(value, 100));
          break;
        case 'sharpen':
          image = image.sharpen({ sigma: value });
          break;
        case 'brightness':
          image = image.modulate({ brightness: value });
          break;
        case 'contrast':
          image = image.modulate({ saturation: value });
          break;
        default:
          throw new Error(`Unknown filter: ${name}`);
      }

      const result = await image.toBuffer();
      Logger.info(`Filter applied successfully`);
      return result;
    } catch (error) {
      Logger.error('Failed to apply filter', error);
      throw error;
    }
  }

  /**
   * Rotate image
   */
  async rotate(buffer: Buffer, angle: number): Promise<Buffer> {
    try {
      Logger.debug(`Rotating image: angle=${angle}`);

      const result = await sharp(buffer)
        .rotate(angle)
        .toBuffer();

      Logger.info(`Image rotated successfully`);
      return result;
    } catch (error) {
      Logger.error('Failed to rotate image', error);
      throw error;
    }
  }

  /**
   * Compress image
   */
  async compress(buffer: Buffer, quality: number): Promise<Buffer> {
    try {
      if (quality < 1 || quality > 100) {
        throw new Error('Quality must be between 1 and 100');
      }

      Logger.debug(`Compressing image: quality=${quality}`);

      const result = await sharp(buffer)
        .jpeg({ quality: Math.round(quality) })
        .toBuffer();

      Logger.info(`Image compressed successfully`);
      return result;
    } catch (error) {
      Logger.error('Failed to compress image', error);
      throw error;
    }
  }

  /**
   * Apply multiple transformations in sequence
   */
  async applyTransformations(
    buffer: Buffer,
    transformations: any[]
  ): Promise<Buffer> {
    try {
      let result = buffer;

      for (const transform of transformations) {
        switch (transform.type) {
          case 'crop':
            result = await this.crop(result, transform);
            break;
          case 'resize':
            result = await this.resize(result, transform);
            break;
          case 'filter':
            result = await this.filter(result, transform);
            break;
          case 'rotate':
            result = await this.rotate(result, transform.angle);
            break;
          case 'compress':
            result = await this.compress(result, transform.quality);
            break;
          default:
            throw new Error(`Unknown transformation: ${transform.type}`);
        }
      }

      Logger.info(`Applied ${transformations.length} transformations`);
      return result;
    } catch (error) {
      Logger.error('Failed to apply transformations', error);
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<any> {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata;
    } catch (error) {
      Logger.error('Failed to get image metadata', error);
      throw error;
    }
  }
}

