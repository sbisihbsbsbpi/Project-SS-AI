/**
 * Report Generator Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { ReportGenerator } from '../../src/features/batchAutomation/reportGenerator';
import { BatchJob, BatchItem, BatchResult } from '../../src/features/batchAutomation/types';

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

  const createTestJob = (): BatchJob => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'completed' },
      { id: 'item-2', url: 'https://example.com/2', status: 'completed' },
    ];

    const results: BatchResult[] = [
      {
        itemId: 'item-1',
        status: 'success',
        duration: 100,
        output: { processed: true },
      },
      {
        itemId: 'item-2',
        status: 'success',
        duration: 150,
        output: { processed: true },
      },
    ];

    return {
      id: 'job-1',
      workflowId: 'workflow-1',
      items,
      status: 'completed',
      createdAt: new Date(),
      progress: 100,
      results,
      parallelism: 2,
    };
  };

  it('should generate a report', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);

    expect(report.id).toBeDefined();
    expect(report.jobId).toBe('job-1');
    expect(report.summary.totalItems).toBe(2);
    expect(report.summary.successCount).toBe(2);
    expect(report.summary.failureCount).toBe(0);
    expect(report.summary.successRate).toBe(100);
  });

  it('should export report to JSON', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);
    const json = await generator.exportJSON(report);

    expect(json).toBeDefined();
    expect(json).toContain(report.id);
    expect(json).toContain('job-1');
  });

  it('should export report to HTML', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);
    const html = await generator.exportHTML(report);

    expect(html).toBeDefined();
    expect(html).toContain('<html>');
    expect(html).toContain('Batch Report');
    expect(html).toContain('100');
  });

  it('should export report to CSV', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);
    const csv = await generator.exportCSV(report);

    expect(csv).toBeDefined();
    expect(csv).toContain('Item ID');
    expect(csv).toContain('URL');
    expect(csv).toContain('Status');
    expect(csv).toContain('item-1');
  });

  it('should export report to PDF', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);
    const pdf = await generator.exportPDF(report);

    expect(pdf).toBeDefined();
    expect(pdf instanceof Buffer).toBe(true);
  });

  it('should calculate correct success rate', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'completed' },
      { id: 'item-2', url: 'https://example.com/2', status: 'completed' },
      { id: 'item-3', url: 'https://example.com/3', status: 'completed' },
      { id: 'item-4', url: 'https://example.com/4', status: 'completed' },
    ];

    const results: BatchResult[] = [
      { itemId: 'item-1', status: 'success', duration: 100 },
      { itemId: 'item-2', status: 'success', duration: 100 },
      { itemId: 'item-3', status: 'failed', duration: 100, error: 'Error' },
      { itemId: 'item-4', status: 'failed', duration: 100, error: 'Error' },
    ];

    const job: BatchJob = {
      id: 'job-1',
      workflowId: 'workflow-1',
      items,
      status: 'completed',
      createdAt: new Date(),
      progress: 100,
      results,
      parallelism: 2,
    };

    const report = await generator.generateReport(job);
    expect(report.summary.successRate).toBe(50);
  });

  it('should calculate average duration', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);

    expect(report.summary.averageDuration).toBe(125);
  });

  it('should include all items in report', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);

    expect(report.items).toHaveLength(2);
    expect(report.items[0].itemId).toBe('item-1');
    expect(report.items[1].itemId).toBe('item-2');
  });

  it('should save JSON report to file', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);
    await generator.exportJSON(report);

    const filePath = `${testDir}/${report.id}.json`;
    const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should save HTML report to file', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);
    await generator.exportHTML(report);

    const filePath = `${testDir}/${report.id}.html`;
    const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should save CSV report to file', async () => {
    const job = createTestJob();
    const report = await generator.generateReport(job);
    await generator.exportCSV(report);

    const filePath = `${testDir}/${report.id}.csv`;
    const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });
});

