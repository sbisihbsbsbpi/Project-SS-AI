/**
 * Diff Visualizer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PNG } from 'pngjs';
import { DiffVisualizer } from '../../src/features/visualRegression/diffVisualizer';

describe('DiffVisualizer', () => {
  let visualizer: DiffVisualizer;

  beforeEach(() => {
    visualizer = new DiffVisualizer();
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

  it('should generate diff visualization', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const current = createTestImage(100, 100, [0, 255, 0]);
    const diff = createTestImage(100, 100, [0, 0, 0]);

    const result = await visualizer.generateDiffVisualization(baseline, current, diff);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should generate before/after view', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const current = createTestImage(100, 100, [0, 255, 0]);

    const result = await visualizer.generateBeforeAfterView(baseline, current);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result)).toBe(true);

    // Verify the result is a valid PNG
    const image = PNG.sync.read(result);
    expect(image.width).toBe(210); // 100 + 100 + 10 gap
    expect(image.height).toBe(100);
  });

  it('should generate overlay', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const diff = createTestImage(100, 100, [0, 0, 0]);

    const result = await visualizer.generateOverlay(baseline, diff, 0.5);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should handle custom highlight color', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const current = createTestImage(100, 100, [0, 255, 0]);
    const diff = createTestImage(100, 100, [0, 0, 0]);

    const result = await visualizer.generateDiffVisualization(baseline, current, diff, {
      highlightColor: [0, 0, 255],
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should handle custom opacity', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const diff = createTestImage(100, 100, [0, 0, 0]);

    const result = await visualizer.generateOverlay(baseline, diff, 0.8);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should throw error for mismatched dimensions in before/after', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const current = createTestImage(200, 200, [0, 255, 0]);

    await expect(
      visualizer.generateBeforeAfterView(baseline, current)
    ).rejects.toThrow();
  });

  it('should generate visualization with default options', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const current = createTestImage(100, 100, [0, 255, 0]);
    const diff = createTestImage(100, 100, [0, 0, 0]);

    const result = await visualizer.generateDiffVisualization(baseline, current, diff);

    expect(result).toBeDefined();
    const image = PNG.sync.read(result);
    expect(image.width).toBe(100);
    expect(image.height).toBe(100);
  });

  it('should handle overlay with different opacity values', async () => {
    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const diff = createTestImage(100, 100, [0, 0, 0]);

    const result1 = await visualizer.generateOverlay(baseline, diff, 0.2);
    const result2 = await visualizer.generateOverlay(baseline, diff, 0.8);

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(Buffer.isBuffer(result1)).toBe(true);
    expect(Buffer.isBuffer(result2)).toBe(true);
  });
});

