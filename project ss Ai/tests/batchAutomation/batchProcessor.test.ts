/**
 * Batch Processor Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BatchProcessor } from '../../src/features/batchAutomation/batchProcessor';
import { BatchItem } from '../../src/features/batchAutomation/types';

describe('BatchProcessor', () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor(2);
  });

  it('should create a batch job', () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
      { id: 'item-2', url: 'https://example.com/2', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);

    expect(job.id).toBeDefined();
    expect(job.workflowId).toBe('workflow-1');
    expect(job.items).toHaveLength(2);
    expect(job.status).toBe('pending');
    expect(job.progress).toBe(0);
  });

  it('should process a batch job', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
      { id: 'item-2', url: 'https://example.com/2', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    expect(job.status).toBe('completed');
    expect(job.progress).toBe(100);
    expect(job.results).toHaveLength(2);
  });

  it('should track job progress', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
      { id: 'item-2', url: 'https://example.com/2', status: 'pending' },
      { id: 'item-3', url: 'https://example.com/3', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    expect(job.progress).toBe(100);
  });

  it('should get job status', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    const status = await processor.getJobStatus(job.id);

    expect(status).toBeDefined();
    expect(status?.id).toBe(job.id);
  });

  it('should return null for non-existent job', async () => {
    const status = await processor.getJobStatus('non-existent');
    expect(status).toBeNull();
  });

  it('should get job results', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
      { id: 'item-2', url: 'https://example.com/2', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    const results = await processor.getJobResults(job.id);
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('success');
  });

  it('should calculate job statistics', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
      { id: 'item-2', url: 'https://example.com/2', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    const stats = processor.getJobStats(job.id);
    expect(stats.totalItems).toBe(2);
    expect(stats.successCount).toBe(2);
    expect(stats.failureCount).toBe(0);
    expect(stats.successRate).toBe(100);
  });

  it('should prevent duplicate job processing', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);

    // Start processing
    const promise1 = processor.processJob(job);

    // Try to process again immediately
    await expect(processor.processJob(job)).rejects.toThrow();

    await promise1;
  });

  it('should handle large batch jobs', async () => {
    const items: BatchItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      url: `https://example.com/${i}`,
      status: 'pending' as const,
    }));

    const job = processor.createJob('workflow-1', items);
    await processor.processJob(job);

    expect(job.results).toHaveLength(20);
    expect(job.progress).toBe(100);
  });

  it('should process items in parallel batches', async () => {
    const items: BatchItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `item-${i}`,
      url: `https://example.com/${i}`,
      status: 'pending' as const,
    }));

    const job = processor.createJob('workflow-1', items);
    job.parallelism = 2;

    await processor.processJob(job);

    expect(job.results).toHaveLength(6);
  });

  it('should cancel a job', async () => {
    const items: BatchItem[] = [
      { id: 'item-1', url: 'https://example.com/1', status: 'pending' },
    ];

    const job = processor.createJob('workflow-1', items);
    job.status = 'processing';

    await processor.cancelJob(job.id);

    const status = await processor.getJobStatus(job.id);
    expect(status?.status).toBe('cancelled');
  });

  it('should throw error when cancelling non-existent job', async () => {
    await expect(processor.cancelJob('non-existent')).rejects.toThrow();
  });
});

