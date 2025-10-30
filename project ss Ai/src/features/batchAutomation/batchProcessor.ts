/**
 * Batch Processing Engine
 * Handles batch job processing with parallel execution and progress tracking
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger';
import {
  BatchJob,
  BatchItem,
  BatchResult,
  IBatchProcessor,
} from './types';

export class BatchProcessor implements IBatchProcessor {
  private jobs: Map<string, BatchJob> = new Map();
  private activeJobs: Set<string> = new Set();
  private defaultParallelism: number = 3;

  constructor(parallelism: number = 3) {
    this.defaultParallelism = parallelism;
  }

  /**
   * Create a new batch job
   */
  createJob(workflowId: string, items: BatchItem[]): BatchJob {
    const job: BatchJob = {
      id: uuidv4(),
      workflowId,
      items,
      status: 'pending',
      createdAt: new Date(),
      progress: 0,
      results: [],
      parallelism: this.defaultParallelism,
    };

    this.jobs.set(job.id, job);
    Logger.info(`Created batch job: ${job.id} with ${items.length} items`);

    return job;
  }

  /**
   * Process a batch job
   */
  async processJob(job: BatchJob): Promise<void> {
    if (this.activeJobs.has(job.id)) {
      throw new Error(`Job ${job.id} is already processing`);
    }

    try {
      this.activeJobs.add(job.id);
      job.status = 'processing';
      job.startedAt = new Date();

      Logger.info(`Starting batch job: ${job.id}`);

      // Process items in parallel batches
      const batches = this.createBatches(job.items, job.parallelism);
      let processedCount = 0;

      for (const batch of batches) {
        const batchPromises = batch.map(item =>
          this.processItem(job, item).then(result => {
            processedCount++;
            job.progress = Math.round((processedCount / job.items.length) * 100);
            return result;
          })
        );

        const results = await Promise.allSettled(batchPromises);
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            job.results.push(result.value);
          }
        });
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;

      Logger.info(`Completed batch job: ${job.id}`);
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      Logger.error(`Failed to process batch job ${job.id}`, error);
      throw error;
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Process a single item
   */
  private async processItem(job: BatchJob, item: BatchItem): Promise<BatchResult> {
    const startTime = Date.now();
    item.status = 'processing';

    try {
      // Simulate processing (in real implementation, this would call actual processors)
      await new Promise(resolve => setTimeout(resolve, 100));

      item.status = 'completed';
      item.result = { processed: true, url: item.url };

      const result: BatchResult = {
        itemId: item.id,
        status: 'success',
        output: item.result,
        duration: Date.now() - startTime,
      };

      Logger.debug(`Processed item: ${item.id}`);
      return result;
    } catch (error) {
      item.status = 'failed';
      item.error = (error as Error).message;

      const result: BatchResult = {
        itemId: item.id,
        status: 'failed',
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };

      Logger.error(`Failed to process item ${item.id}`, error);
      return result;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<BatchJob | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'processing') {
      job.status = 'cancelled';
      this.activeJobs.delete(jobId);
      Logger.info(`Cancelled batch job: ${jobId}`);
    }
  }

  /**
   * Get job results
   */
  async getJobResults(jobId: string): Promise<BatchResult[]> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return job.results;
  }

  /**
   * Create batches for parallel processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Get job statistics
   */
  getJobStats(jobId: string): any {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    const successCount = job.results.filter(r => r.status === 'success').length;
    const failureCount = job.results.filter(r => r.status === 'failed').length;
    const totalDuration = job.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalItems: job.items.length,
      successCount,
      failureCount,
      successRate: (successCount / job.items.length) * 100,
      totalDuration,
      averageDuration: totalDuration / job.results.length,
      progress: job.progress,
    };
  }
}

