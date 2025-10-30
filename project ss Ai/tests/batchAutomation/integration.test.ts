/**
 * Batch Automation Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { PNG } from 'pngjs';
import { BatchAutomationSystem } from '../../src/features/batchAutomation';
import { WorkflowStep, BatchItem } from '../../src/features/batchAutomation/types';

describe('Batch Automation System Integration', () => {
  let system: BatchAutomationSystem;
  const testDir = './test-batch-automation';

  beforeEach(async () => {
    system = new BatchAutomationSystem(
      `${testDir}/workflows`,
      `${testDir}/reports`,
      `${testDir}/scheduler`
    );
    await system.initialize();
  });

  afterEach(async () => {
    try {
      await system.cleanup();
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should initialize batch automation system', async () => {
    expect(system.getWorkflowBuilder()).toBeDefined();
    expect(system.getBatchProcessor()).toBeDefined();
    expect(system.getTransformationEngine()).toBeDefined();
    expect(system.getReportGenerator()).toBeDefined();
    expect(system.getScheduler()).toBeDefined();
  });

  it('should create and execute a complete workflow', async () => {
    const builder = system.getWorkflowBuilder();
    const processor = system.getBatchProcessor();
    const generator = system.getReportGenerator();

    // Create workflow
    const workflow = builder.createWorkflow('Test Workflow');
    const step: WorkflowStep = {
      id: 'step-1',
      type: 'capture',
      name: 'Capture Screenshot',
      config: { url: 'https://example.com' },
      enabled: true,
    };

    builder.addStep(workflow, step);
    await builder.saveWorkflow(workflow);

    // Create batch job
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
      { id: 'item-2', url: 'https://example.com/2', status: 'pending' },
    ];

    const job = processor.createJob(workflow.id, items);
    await processor.processJob(job);

    // Generate report
    const report = await generator.generateReport(job);

    expect(report.summary.totalItems).toBe(2);
    expect(report.summary.successCount).toBe(2);
  });

  it('should apply transformations to batch items', async () => {
    const engine = system.getTransformationEngine();

    // Create test image
    const png = new PNG({ width: 100, height: 100 });
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = 255;
      png.data[i + 1] = 0;
      png.data[i + 2] = 0;
      png.data[i + 3] = 255;
    }
    const imageBuffer = PNG.sync.write(png);

    // Apply transformations
    const transformations = [
      { type: 'resize', options: { width: 50, height: 50, fit: 'cover' } },
      { type: 'filter', options: { name: 'grayscale' } },
    ];

    const result = await engine.applyTransformations(imageBuffer, transformations);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should schedule and execute a workflow', async () => {
    const builder = system.getWorkflowBuilder();
    const scheduler = system.getScheduler();

    // Create workflow
    const workflow = builder.createWorkflow('Scheduled Workflow');
    const step: WorkflowStep = {
      id: 'step-1',
      type: 'capture',
      name: 'Capture',
      config: {},
      enabled: true,
    };

    builder.addStep(workflow, step);
    await builder.saveWorkflow(workflow);

    // Schedule job
    const schedule = {
      type: 'once' as const,
      nextRun: new Date(Date.now() + 60000),
    };

    const job = await scheduler.scheduleJob(workflow.id, schedule);
    const execution = await scheduler.executeScheduledJob(job.id);

    expect(execution.workflowId).toBe(workflow.id);
    expect(execution.status).toBe('completed');
  });

  it('should export reports in multiple formats', async () => {
    const processor = system.getBatchProcessor();
    const generator = system.getReportGenerator();

    // Create and process job
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    // Generate report
    const report = await generator.generateReport(job);

    // Export in multiple formats
    const json = await generator.exportJSON(report);
    const html = await generator.exportHTML(report);
    const csv = await generator.exportCSV(report);
    const pdf = await generator.exportPDF(report);

    expect(json).toBeDefined();
    expect(html).toBeDefined();
    expect(csv).toBeDefined();
    expect(pdf).toBeDefined();
  });

  it('should handle workflow validation', async () => {
    const builder = system.getWorkflowBuilder();

    // Create invalid workflow (no steps)
    const workflow = builder.createWorkflow('Invalid Workflow');
    const errors = builder.validateWorkflow(workflow);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('at least one step');
  });

  it('should process large batch jobs', async () => {
    const processor = system.getBatchProcessor();

    // Create large batch
    const items: BatchItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      url: `https://example.com/${i}`,
      status: 'pending' as const,
    }));

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    expect(job.results).toHaveLength(50);
    expect(job.progress).toBe(100);
  });

  it('should track job statistics', async () => {
    const processor = system.getBatchProcessor();

    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
      { id: 'item-2', url: 'https://example.com/2', status: 'pending' },
      { id: 'item-3', url: 'https://example.com/3', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    const stats = processor.getJobStats(job.id);

    expect(stats.totalItems).toBe(3);
    expect(stats.successCount).toBe(3);
    expect(stats.successRate).toBe(100);
    expect(stats.averageDuration).toBeGreaterThan(0);
  });

  it('should cleanup resources on shutdown', async () => {
    const scheduler = system.getScheduler();

    const schedule = {
      type: 'once' as const,
      nextRun: new Date(Date.now() + 60000),
    };

    await scheduler.scheduleJob('workflow-1', schedule);

    // Cleanup should not throw
    await expect(system.cleanup()).resolves.not.toThrow();
  });
});

