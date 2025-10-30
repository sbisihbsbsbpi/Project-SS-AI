/**
 * Transformation Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PNG } from 'pngjs';
import { TransformationEngine } from '../../src/features/batchAutomation/transformationEngine';
import { CropConfig, ResizeConfig, FilterConfig } from '../../src/features/batchAutomation/types';

describe('TransformationEngine', () => {
  let engine: TransformationEngine;
  let testImageBuffer: Buffer;

  beforeEach(async () => {
    engine = new TransformationEngine();

    // Create a simple test image (100x100 PNG)
    const png = new PNG({ width: 100, height: 100 });
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = 255;     // R
      png.data[i + 1] = 0;   // G
      png.data[i + 2] = 0;   // B
      png.data[i + 3] = 255; // A
    }
    testImageBuffer = PNG.sync.write(png);
  });

  it('should crop an image', async () => {
    const config: CropConfig = {
      type: 'crop',
      options: {
        x: 10,
        y: 10,
        width: 50,
        height: 50,
      },
    };

    const result = await engine.crop(testImageBuffer, config);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should resize an image', async () => {
    const config: ResizeConfig = {
      type: 'resize',
      options: {
        width: 50,
        height: 50,
        fit: 'cover',
      },
    };

    const result = await engine.resize(testImageBuffer, config);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should apply grayscale filter', async () => {
    const config: FilterConfig = {
      type: 'filter',
      options: {
        name: 'grayscale',
      },
    };

    const result = await engine.filter(testImageBuffer, config);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should apply blur filter', async () => {
    const config: FilterConfig = {
      type: 'filter',
      options: {
        name: 'blur',
        value: 5,
      },
    };

    const result = await engine.filter(testImageBuffer, config);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should apply sharpen filter', async () => {
    const config: FilterConfig = {
      type: 'filter',
      options: {
        name: 'sharpen',
        value: 2,
      },
    };

    const result = await engine.filter(testImageBuffer, config);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should apply brightness filter', async () => {
    const config: FilterConfig = {
      type: 'filter',
      options: {
        name: 'brightness',
        value: 1.2,
      },
    };

    const result = await engine.filter(testImageBuffer, config);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should rotate an image', async () => {
    const result = await engine.rotate(testImageBuffer, 90);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should compress an image', async () => {
    const result = await engine.compress(testImageBuffer, 80);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should reject invalid compression quality', async () => {
    await expect(engine.compress(testImageBuffer, 150)).rejects.toThrow();
    await expect(engine.compress(testImageBuffer, 0)).rejects.toThrow();
  });

  it('should apply multiple transformations in sequence', async () => {
    const transformations = [
      {
        type: 'resize',
        options: { width: 80, height: 80, fit: 'cover' },
      },
      {
        type: 'filter',
        options: { name: 'grayscale' },
      },
      {
        type: 'compress',
        quality: 85,
      },
    ];

    const result = await engine.applyTransformations(testImageBuffer, transformations);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should get image metadata', async () => {
    const metadata = await engine.getImageMetadata(testImageBuffer);
    expect(metadata).toBeDefined();
    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(100);
  });

  it('should handle invalid filter name', async () => {
    const config: any = {
      type: 'filter',
      options: {
        name: 'invalid-filter',
      },
    };

    await expect(engine.filter(testImageBuffer, config)).rejects.toThrow();
  });

  it('should handle invalid transformation type', async () => {
    const transformations = [
      {
        type: 'invalid',
      },
    ];

    await expect(engine.applyTransformations(testImageBuffer, transformations)).rejects.toThrow();
  });
});

