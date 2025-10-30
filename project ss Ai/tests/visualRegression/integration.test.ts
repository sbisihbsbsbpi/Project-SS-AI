/**
 * Visual Regression Testing Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { PNG } from 'pngjs';
import { VisualRegressionSystem } from '../../src/features/visualRegression';
import { Baseline, BaselineMetadata } from '../../src/features/visualRegression/types';

describe('Visual Regression System Integration', () => {
  let system: VisualRegressionSystem;
  const testDir = './test-vr-system';

  beforeEach(async () => {
    system = new VisualRegressionSystem(
      `${testDir}/baselines`,
      `${testDir}/reports`,
      `${testDir}/history`
    );
    await system.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
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

  it('should initialize visual regression system', async () => {
    expect(system).toBeDefined();
    expect(system.getBaselineManager()).toBeDefined();
    expect(system.getImageComparator()).toBeDefined();
    expect(system.getDiffVisualizer()).toBeDefined();
    expect(system.getReportGenerator()).toBeDefined();
    expect(system.getHistoryTracker()).toBeDefined();
  });

  it('should save and load baseline', async () => {
    const manager = system.getBaselineManager();
    const metadata: BaselineMetadata = {
      id: 'test-baseline',
      name: 'Test Baseline',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      width: 100,
      height: 100,
      hash: 'test-hash',
    };

    const baseline: Baseline = {
      metadata,
      imagePath: '',
      buffer: createTestImage(100, 100, [255, 0, 0]),
    };

    await manager.saveBaseline(baseline);
    const loaded = await manager.loadBaseline('test-baseline');

    expect(loaded).toBeDefined();
    expect(loaded?.metadata.id).toBe('test-baseline');
  });

  it('should compare images and generate report', async () => {
    const comparator = system.getImageComparator();
    const reportGenerator = system.getReportGenerator();

    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [255, 0, 0]);

    const result = await comparator.compare(image1, image2);
    const report = await reportGenerator.generateReport([result]);

    expect(report).toBeDefined();
    expect(report.totalComparisons).toBe(1);
    expect(report.passedComparisons).toBe(1);
  });

  it('should generate diff visualization', async () => {
    const visualizer = system.getDiffVisualizer();

    const baseline = createTestImage(100, 100, [255, 0, 0]);
    const current = createTestImage(100, 100, [0, 255, 0]);
    const diff = createTestImage(100, 100, [0, 0, 0]);

    const result = await visualizer.generateDiffVisualization(baseline, current, diff);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should track comparison history', async () => {
    const tracker = system.getHistoryTracker();

    const entry = {
      id: 'entry-1',
      timestamp: new Date(),
      baselineId: 'baseline-1',
      comparisonId: 'comparison-1',
      result: 'pass' as const,
      percentageDifference: 0.5,
    };

    await tracker.addEntry(entry);
    const history = await tracker.getHistory();

    expect(history.length).toBe(1);
    expect(history[0].result).toBe('pass');
  });

  it('should complete full regression testing workflow', async () => {
    const manager = system.getBaselineManager();
    const comparator = system.getImageComparator();
    const visualizer = system.getDiffVisualizer();
    const reportGenerator = system.getReportGenerator();
    const tracker = system.getHistoryTracker();

    // 1. Save baseline
    const metadata: BaselineMetadata = {
      id: 'workflow-baseline',
      name: 'Workflow Test',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      width: 100,
      height: 100,
      hash: 'workflow-hash',
    };

    const baseline: Baseline = {
      metadata,
      imagePath: '',
      buffer: createTestImage(100, 100, [255, 0, 0]),
    };

    await manager.saveBaseline(baseline);

    // 2. Compare images
    const currentImage = createTestImage(100, 100, [255, 0, 0]);
    const result = await comparator.compare(baseline.buffer!, currentImage);

    // 3. Generate visualization
    const diffImage = createTestImage(100, 100, [0, 0, 0]);
    const visualization = await visualizer.generateDiffVisualization(
      baseline.buffer!,
      currentImage,
      diffImage
    );

    // 4. Generate report
    const report = await reportGenerator.generateReport([result]);

    // 5. Track history
    const entry = {
      id: 'workflow-entry',
      timestamp: new Date(),
      baselineId: 'workflow-baseline',
      comparisonId: result.id,
      result: result.isSimilar ? ('pass' as const) : ('fail' as const),
      percentageDifference: result.percentageDifference,
    };

    await tracker.addEntry(entry);

    // Verify all steps completed
    expect(baseline).toBeDefined();
    expect(result).toBeDefined();
    expect(visualization).toBeDefined();
    expect(report).toBeDefined();
    expect(entry).toBeDefined();

    const history = await tracker.getHistory();
    expect(history.length).toBe(1);
  });

  it('should export reports in multiple formats', async () => {
    const comparator = system.getImageComparator();
    const reportGenerator = system.getReportGenerator();

    const image1 = createTestImage(100, 100, [255, 0, 0]);
    const image2 = createTestImage(100, 100, [0, 255, 0]);

    const result = await comparator.compare(image1, image2);
    const report = await reportGenerator.generateReport([result]);

    const jsonPath = await reportGenerator.exportToJSON(report);
    const htmlPath = await reportGenerator.exportToHTML(report);

    expect(jsonPath).toBeDefined();
    expect(htmlPath).toBeDefined();

    const jsonExists = await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false);
    const htmlExists = await fs
      .access(htmlPath)
      .then(() => true)
      .catch(() => false);

    expect(jsonExists).toBe(true);
    expect(htmlExists).toBe(true);
  });
});

