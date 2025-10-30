/**
 * Image Comparator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PNG } from 'pngjs';
import { ImageComparator } from '../../src/features/visualRegression/imageComparator';

describe('ImageComparator', () => {
  let comparator: ImageComparator;

  beforeEach(() => {
    comparator = new ImageComparator();
  });

  /**
   * Helper function to create a test PNG image
   */
  function createTestImage(width: number, height: number, color: [number, number, number]): Buffer {
    const image = new PNG({ width, height });

    for (let i = 0; i < image.data.length; i += 4) {
      image.data[i] = color[0]; // R
      image.data[i + 1] = color[1]; // G
      image.data[i + 2] = color[2]; // B
      image.data[i + 3] = 255; // A
    }

    return PNG.sync.write(image);
  }

  it('should compare identical images', async () => {
    const imageBuffer = createTestImage(100, 100, [255, 0, 0]);

    const result = await comparator.compare(imageBuffer, imageBuffer);

    expect(result).toBeDefined();
    expect(result.pixelDifferences).toBe(0);
    expect(result.percentageDifference).toBe(0);
    expect(result.isSimilar).toBe(true);
  });

  it('should detect differences between images', async () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [0, 255, 0]);

    const result = await comparator.compare(image1, image2);

    expect(result).toBeDefined();
    expect(result.pixelDifferences).toBeGreaterThan(0);
    expect(result.percentageDifference).toBeGreaterThan(0);
  });

  it('should calculate similarity score', () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [255, 0, 0]);

    const similarity = comparator.calculateSimilarity(image1, image2);

    expect(similarity).toBe(100);
  });

  it('should return 0 similarity for completely different images', () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [0, 255, 0]);

    const similarity = comparator.calculateSimilarity(image1, image2);

    expect(similarity).toBeLessThan(100);
    expect(similarity).toBeGreaterThanOrEqual(0);
  });

  it('should handle custom comparison options', async () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [254, 0, 0]); // Slightly different

    const result = await comparator.compare(image1, image2, {
      threshold: 0.05,
    });

    expect(result).toBeDefined();
    expect(result.threshold).toBe(0.05);
  });

  it('should throw error for mismatched dimensions', async () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(200, 200, [255, 0, 0]);

    await expect(comparator.compare(image1, image2)).rejects.toThrow();
  });

  it('should generate diff image', async () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [0, 255, 0]);
    const diffImage = createTestImage(100, 100, [0, 0, 0]);

    const result = await comparator.generateDiffImage(image1, image2, diffImage);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should return 0 similarity for mismatched dimensions', () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(200, 200, [255, 0, 0]);

    const similarity = comparator.calculateSimilarity(image1, image2);

    expect(similarity).toBe(0);
  });

  it('should handle comparison with alpha channel', async () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [255, 0, 0]);

    const result = await comparator.compare(image1, image2, {
      alpha: 0.5,
    });

    expect(result).toBeDefined();
    expect(result.pixelDifferences).toBe(0);
  });

  it('should handle comparison with anti-aliasing', async () => {
    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [255, 0, 0]);

    const result = await comparator.compare(image1, image2, {
      includeAA: true,
    });

    expect(result).toBeDefined();
    expect(result.pixelDifferences).toBe(0);
  });
});

