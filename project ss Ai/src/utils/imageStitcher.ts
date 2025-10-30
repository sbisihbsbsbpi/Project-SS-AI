import sharp from 'sharp';
import { Logger } from './logger';
import { config } from '../config';
import { CapturedFrame } from '../types/index';

/**
 * ImageStitcher - Stitches multiple screenshot frames into a single image
 * Improved version with timeout protection and error handling
 */
export class ImageStitcher {
  /**
   * Stitch frames into a single image with timeout protection
   */
  static async stitchFrames(
    frames: CapturedFrame[],
    overlapPercentage: number = 10
  ): Promise<Buffer> {
    if (frames.length === 0) {
      throw new Error('No frames to stitch');
    }

    if (frames.length === 1) {
      Logger.debug('Single frame, returning as-is');
      return frames[0].buffer;
    }

    // Validate overlap percentage
    if (overlapPercentage < 0 || overlapPercentage > 100) {
      Logger.warn('Invalid overlap percentage, using default', { overlapPercentage });
      overlapPercentage = 10;
    }

    Logger.debug('Starting frame stitching', {
      frameCount: frames.length,
      overlapPercentage,
    });

    try {
      // Wrap in timeout
      return await this.withTimeout(
        this.stitchFramesInternal(frames, overlapPercentage),
        config.timeout.imageStitch,
        'Image stitching'
      );
    } catch (error) {
      Logger.error('Frame stitching failed', error as Error);
      throw error;
    }
  }

  /**
   * Internal stitching logic
   */
  private static async stitchFramesInternal(
    frames: CapturedFrame[],
    overlapPercentage: number
  ): Promise<Buffer> {
    // Calculate total dimensions
    const frameWidth = frames[0].width;
    const frameHeight = frames[0].height;
    const overlapPixels = Math.round((frameHeight * overlapPercentage) / 100);
    const effectiveHeight = frameHeight - overlapPixels;

    const totalHeight = frameHeight + (frames.length - 1) * effectiveHeight;
    const totalWidth = frameWidth;

    Logger.debug('Calculated stitching dimensions', {
      frameWidth,
      frameHeight,
      overlapPixels,
      effectiveHeight,
      totalHeight,
      totalWidth,
    });

    // Create composite image
    let composite = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    });

    // Add each frame to the composite
    let currentY = 0;
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const yOffset = i === 0 ? 0 : currentY;

      Logger.debug('Adding frame to composite', {
        frameIndex: i,
        yOffset,
        bufferSize: frame.buffer.length,
      });

      composite = composite.composite([
        {
          input: frame.buffer,
          top: yOffset,
          left: 0,
        },
      ]);

      currentY += effectiveHeight;
    }

    Logger.debug('Converting composite to PNG');
    return await composite.png().toBuffer();
  }

  /**
   * Detect and remove overlaps between frames
   */
  static async removeOverlaps(
    frames: CapturedFrame[],
    overlapPercentage: number = 10
  ): Promise<CapturedFrame[]> {
    if (frames.length <= 1) {
      return frames;
    }

    Logger.debug('Removing overlaps', {
      frameCount: frames.length,
      overlapPercentage,
    });

    try {
      const processedFrames: CapturedFrame[] = [frames[0]];
      const overlapPixels = Math.round(
        (frames[0].height * overlapPercentage) / 100
      );

      for (let i = 1; i < frames.length; i++) {
        const currentFrame = frames[i];

        Logger.debug('Processing frame for overlap removal', {
          frameIndex: i,
          overlapPixels,
        });

        // Crop the current frame to remove overlap
        const croppedBuffer = await sharp(currentFrame.buffer)
          .extract({
            left: 0,
            top: overlapPixels,
            width: currentFrame.width,
            height: currentFrame.height - overlapPixels,
          })
          .toBuffer();

        processedFrames.push({
          ...currentFrame,
          buffer: croppedBuffer,
          height: currentFrame.height - overlapPixels,
        });
      }

      Logger.debug('Overlap removal complete', {
        processedFrameCount: processedFrames.length,
      });

      return processedFrames;
    } catch (error) {
      Logger.error('Overlap removal failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate frame alignment
   */
  static async validateAlignment(frames: CapturedFrame[]): Promise<boolean> {
    if (frames.length <= 1) {
      return true;
    }

    try {
      const firstWidth = frames[0].width;
      const firstHeight = frames[0].height;

      for (let i = 1; i < frames.length; i++) {
        if (frames[i].width !== firstWidth || frames[i].height !== firstHeight) {
          Logger.warn('Frame alignment mismatch detected', {
            frameIndex: i,
            expectedWidth: firstWidth,
            actualWidth: frames[i].width,
            expectedHeight: firstHeight,
            actualHeight: frames[i].height,
          });
          return false;
        }
      }

      Logger.debug('Frame alignment validated');
      return true;
    } catch (error) {
      Logger.error('Frame alignment validation failed', error as Error);
      return false;
    }
  }

  /**
   * Normalize frames to same dimensions
   */
  static async normalizeFrames(
    frames: CapturedFrame[],
    targetWidth: number,
    targetHeight: number
  ): Promise<CapturedFrame[]> {
    Logger.debug('Normalizing frames', {
      frameCount: frames.length,
      targetWidth,
      targetHeight,
    });

    try {
      const normalized: CapturedFrame[] = [];

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];

        if (frame.width === targetWidth && frame.height === targetHeight) {
          normalized.push(frame);
          continue;
        }

        Logger.debug('Resizing frame', {
          frameIndex: i,
          fromWidth: frame.width,
          fromHeight: frame.height,
          toWidth: targetWidth,
          toHeight: targetHeight,
        });

        const resizedBuffer = await sharp(frame.buffer)
          .resize(targetWidth, targetHeight, {
            fit: 'fill',
            withoutEnlargement: false,
          })
          .toBuffer();

        normalized.push({
          ...frame,
          buffer: resizedBuffer,
          width: targetWidth,
          height: targetHeight,
        });
      }

      Logger.debug('Frame normalization complete');
      return normalized;
    } catch (error) {
      Logger.error('Frame normalization failed', error as Error);
      throw error;
    }
  }

  /**
   * Convert image format
   */
  static async convertFormat(
    buffer: Buffer,
    format: 'png' | 'jpeg' | 'webp' = 'png'
  ): Promise<Buffer> {
    try {
      Logger.debug('Converting image format', { format });

      let converter = sharp(buffer);

      switch (format) {
        case 'jpeg':
          converter = converter.jpeg({ quality: 90 });
          break;
        case 'webp':
          converter = converter.webp({ quality: 90 });
          break;
        case 'png':
        default:
          converter = converter.png();
      }

      return await converter.toBuffer();
    } catch (error) {
      Logger.error('Image format conversion failed', error as Error);
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  static async getMetadata(buffer: Buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      Logger.debug('Image metadata retrieved', metadata);
      return metadata;
    } catch (error) {
      Logger.error('Failed to get image metadata', error as Error);
      throw error;
    }
  }

  /**
   * Utility: Execute promise with timeout
   */
  private static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }
}
