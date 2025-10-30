import sharp from 'sharp';
import { CapturedFrame } from '../types/index';

/**
 * ImageStitcher - Stitches multiple screenshot frames into a single image
 * Handles pixel-perfect alignment and overlap management
 */
export class ImageStitcher {
  /**
   * Stitch frames into a single image
   */
  static async stitchFrames(
    frames: CapturedFrame[],
    overlapPercentage: number = 10
  ): Promise<Buffer> {
    if (frames.length === 0) {
      throw new Error('No frames to stitch');
    }

    if (frames.length === 1) {
      return frames[0].buffer;
    }

    // Calculate total dimensions
    const frameWidth = frames[0].width;
    const frameHeight = frames[0].height;
    const overlapPixels = Math.round((frameHeight * overlapPercentage) / 100);
    const effectiveHeight = frameHeight - overlapPixels;

    const totalHeight = frameHeight + (frames.length - 1) * effectiveHeight;
    const totalWidth = frameWidth;

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

      composite = composite.composite([
        {
          input: frame.buffer,
          top: yOffset,
          left: 0,
        },
      ]);

      currentY += effectiveHeight;
    }

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

    const processedFrames: CapturedFrame[] = [frames[0]];
    const overlapPixels = Math.round(
      (frames[0].height * overlapPercentage) / 100
    );

    for (let i = 1; i < frames.length; i++) {
      const currentFrame = frames[i];
      const previousFrame = processedFrames[processedFrames.length - 1];

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

    return processedFrames;
  }

  /**
   * Validate frame alignment
   */
  static async validateAlignment(frames: CapturedFrame[]): Promise<boolean> {
    if (frames.length <= 1) {
      return true;
    }

    const firstWidth = frames[0].width;
    const firstHeight = frames[0].height;

    for (let i = 1; i < frames.length; i++) {
      if (
        frames[i].width !== firstWidth ||
        frames[i].height !== firstHeight
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resize frames to consistent dimensions
   */
  static async normalizeFrames(
    frames: CapturedFrame[],
    targetWidth: number,
    targetHeight: number
  ): Promise<CapturedFrame[]> {
    const normalized: CapturedFrame[] = [];

    for (const frame of frames) {
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

    return normalized;
  }

  /**
   * Convert image format
   */
  static async convertFormat(
    buffer: Buffer,
    format: 'png' | 'jpeg' | 'webp' = 'png'
  ): Promise<Buffer> {
    const converter = sharp(buffer);

    switch (format) {
      case 'jpeg':
        return await converter.jpeg({ quality: 90 }).toBuffer();
      case 'webp':
        return await converter.webp({ quality: 90 }).toBuffer();
      case 'png':
      default:
        return await converter.png().toBuffer();
    }
  }

  /**
   * Get image metadata
   */
  static async getMetadata(buffer: Buffer) {
    return await sharp(buffer).metadata();
  }
}
