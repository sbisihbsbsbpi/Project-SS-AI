/**
 * Report Generator Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { ReportGenerator } from '../../src/features/visualRegression/reportGenerator';
import { ComparisonResult } from '../../src/features/visualRegression/types';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  const testDir = './test-reports';

  beforeEach(async () => {
    generator = new ReportGenerator(testDir);
    await generator.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Helper function to create test comparison results
   */
  function createTestResults(count: number, passRate: number = 0.8): ComparisonResult[] {
    const results: ComparisonResult[] = [];

    for (let i = 0; i < count; i++) {
      const isSimilar = Math.random() < passRate;
      results.push({
        id: `comparison-${i}`,
        baselineId: 'test-baseline',
        currentImagePath: `/path/to/image-${i}.png`,
        timestamp: new Date(),
        pixelDifferences: isSimilar ? 10 : 1000,
        totalPixels: 100000,
        percentageDifference: isSimilar ? 0.01 : 1.0,
        isSimilar,
        threshold: 0.1,
      });
    }

    return results;
  }

  it('should generate report from comparison results', async () => {
    const results = createTestResults(5);

    const report = await generator.generateReport(results);

    expect(report).toBeDefined();
    expect(report.totalComparisons).toBe(5);
    expect(report.comparisonResults.length).toBe(5);
  });

  it('should calculate pass/fail statistics', async () => {
    const results = createTestResults(10, 0.7);

    const report = await generator.generateReport(results);

    expect(report.totalComparisons).toBe(10);
    expect(report.passedComparisons + report.failedComparisons).toBe(10);
  });

  it('should calculate average difference', async () => {
    const results = createTestResults(5);

    const report = await generator.generateReport(results);

    expect(report.averageDifference).toBeGreaterThanOrEqual(0);
    expect(report.averageDifference).toBeLessThanOrEqual(100);
  });

  it('should export report to JSON', async () => {
    const results = createTestResults(3);
    const report = await generator.generateReport(results);

    const filePath = await generator.exportToJSON(report);

    expect(filePath).toBeDefined();
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should export report to HTML', async () => {
    const results = createTestResults(3);
    const report = await generator.generateReport(results);

    const filePath = await generator.exportToHTML(report);

    expect(filePath).toBeDefined();
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should include report metadata in JSON export', async () => {
    const results = createTestResults(2);
    const report = await generator.generateReport(results);

    const filePath = await generator.exportToJSON(report);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    expect(data.id).toBe(report.id);
    expect(data.totalComparisons).toBe(2);
    expect(data.results.length).toBe(2);
  });

  it('should generate valid HTML report', async () => {
    const results = createTestResults(2);
    const report = await generator.generateReport(results);

    const filePath = await generator.exportToHTML(report);
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Visual Regression Report');
    expect(content).toContain('Total Comparisons');
  });

  it('should handle empty results', async () => {
    const results: ComparisonResult[] = [];

    const report = await generator.generateReport(results);

    expect(report.totalComparisons).toBe(0);
    expect(report.passedComparisons).toBe(0);
    expect(report.failedComparisons).toBe(0);
  });

  it('should generate unique report IDs', async () => {
    const results1 = createTestResults(2);
    const results2 = createTestResults(2);

    const report1 = await generator.generateReport(results1);
    const report2 = await generator.generateReport(results2);

    expect(report1.id).not.toBe(report2.id);
  });
});

