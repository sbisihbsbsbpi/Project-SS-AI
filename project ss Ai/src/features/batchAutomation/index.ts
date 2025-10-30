/**
 * Batch Automation Module
 * Exports all batch automation components
 */

export * from './types';
export { WorkflowBuilder } from './workflowBuilder';
export { BatchProcessor } from './batchProcessor';
export { TransformationEngine } from './transformationEngine';
export { ReportGenerator } from './reportGenerator';
export { Scheduler } from './scheduler';

import { WorkflowBuilder } from './workflowBuilder';
import { BatchProcessor } from './batchProcessor';
import { TransformationEngine } from './transformationEngine';
import { ReportGenerator } from './reportGenerator';
import { Scheduler } from './scheduler';
import { Logger } from '../../utils/logger';

/**
 * Batch Automation System
 * Provides complete batch automation capabilities
 */
export class BatchAutomationSystem {
  private workflowBuilder: WorkflowBuilder;
  private batchProcessor: BatchProcessor;
  private transformationEngine: TransformationEngine;
  private reportGenerator: ReportGenerator;
  private scheduler: Scheduler;

  constructor(
    workflowDir?: string,
    reportDir?: string,
    schedulerDir?: string,
    parallelism?: number
  ) {
    this.workflowBuilder = new WorkflowBuilder(workflowDir);
    this.batchProcessor = new BatchProcessor(parallelism);
    this.transformationEngine = new TransformationEngine();
    this.reportGenerator = new ReportGenerator(reportDir);
    this.scheduler = new Scheduler(schedulerDir);
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    try {
      await this.workflowBuilder.initialize();
      await this.reportGenerator.initialize();
      await this.scheduler.initialize();
      Logger.info('BatchAutomationSystem initialized');
    } catch (error) {
      Logger.error('Failed to initialize BatchAutomationSystem', error);
      throw error;
    }
  }

  /**
   * Get workflow builder
   */
  getWorkflowBuilder(): WorkflowBuilder {
    return this.workflowBuilder;
  }

  /**
   * Get batch processor
   */
  getBatchProcessor(): BatchProcessor {
    return this.batchProcessor;
  }

  /**
   * Get transformation engine
   */
  getTransformationEngine(): TransformationEngine {
    return this.transformationEngine;
  }

  /**
   * Get report generator
   */
  getReportGenerator(): ReportGenerator {
    return this.reportGenerator;
  }

  /**
   * Get scheduler
   */
  getScheduler(): Scheduler {
    return this.scheduler;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.scheduler.cleanup();
      Logger.info('BatchAutomationSystem cleanup completed');
    } catch (error) {
      Logger.error('Failed to cleanup BatchAutomationSystem', error);
      throw error;
    }
  }
}

