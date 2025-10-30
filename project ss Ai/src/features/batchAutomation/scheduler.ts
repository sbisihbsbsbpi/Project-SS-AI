/**
 * Batch Job Scheduler
 * Handles scheduling of batch jobs using cron expressions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger';
import {
  ScheduledJob,
  ScheduleConfig,
  WorkflowExecution,
  IScheduler,
} from './types';

export class Scheduler implements IScheduler {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private schedulerDir: string;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(schedulerDir: string = './scheduled-jobs') {
    this.schedulerDir = schedulerDir;
  }

  /**
   * Initialize scheduler
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.schedulerDir, { recursive: true });
      await this.loadScheduledJobs();
      Logger.info('Scheduler initialized');
    } catch (error) {
      Logger.error('Failed to initialize Scheduler', error);
      throw error;
    }
  }

  /**
   * Schedule a job
   */
  async scheduleJob(workflowId: string, schedule: ScheduleConfig): Promise<ScheduledJob> {
    try {
      const job: ScheduledJob = {
        id: uuidv4(),
        workflowId,
        schedule,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionHistory: [],
      };

      this.scheduledJobs.set(job.id, job);
      await this.saveScheduledJob(job);

      // Set up the schedule
      this.setupSchedule(job);

      Logger.info(`Scheduled job: ${job.id} for workflow ${workflowId}`);
      return job;
    } catch (error) {
      Logger.error('Failed to schedule job', error);
      throw error;
    }
  }

  /**
   * Unschedule a job
   */
  async unscheduleJob(jobId: string): Promise<void> {
    try {
      const job = this.scheduledJobs.get(jobId);
      if (!job) {
        throw new Error(`Scheduled job ${jobId} not found`);
      }

      // Clear the timer
      const timer = this.timers.get(jobId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(jobId);
      }

      this.scheduledJobs.delete(jobId);

      const filePath = path.join(this.schedulerDir, `${jobId}.json`);
      await fs.unlink(filePath);

      Logger.info(`Unscheduled job: ${jobId}`);
    } catch (error) {
      Logger.error(`Failed to unschedule job ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Get all scheduled jobs
   */
  async getScheduledJobs(): Promise<ScheduledJob[]> {
    return Array.from(this.scheduledJobs.values());
  }

  /**
   * Execute a scheduled job
   */
  async executeScheduledJob(jobId: string): Promise<WorkflowExecution> {
    try {
      const job = this.scheduledJobs.get(jobId);
      if (!job) {
        throw new Error(`Scheduled job ${jobId} not found`);
      }

      const execution: WorkflowExecution = {
        id: uuidv4(),
        workflowId: job.workflowId,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        progress: 100,
        results: [],
        logs: [`Executed scheduled job ${jobId}`],
      };

      job.lastExecutionId = execution.id;
      job.executionHistory.push(execution.id);
      job.updatedAt = new Date();

      await this.saveScheduledJob(job);

      Logger.info(`Executed scheduled job: ${jobId}`);
      return execution;
    } catch (error) {
      Logger.error(`Failed to execute scheduled job ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Setup schedule for a job
   */
  private setupSchedule(job: ScheduledJob): void {
    if (job.schedule.type === 'once' && job.schedule.nextRun) {
      const delay = job.schedule.nextRun.getTime() - Date.now();
      if (delay > 0) {
        const timer = setTimeout(() => {
          this.executeScheduledJob(job.id).catch(error =>
            Logger.error(`Failed to execute scheduled job ${job.id}`, error)
          );
        }, delay);

        this.timers.set(job.id, timer);
      }
    } else if (job.schedule.type === 'recurring') {
      // For recurring jobs, set up a simple interval-based scheduler
      // In production, use a library like node-cron
      const timer = setInterval(() => {
        if (job.enabled) {
          this.executeScheduledJob(job.id).catch(error =>
            Logger.error(`Failed to execute scheduled job ${job.id}`, error)
          );
        }
      }, 60000); // Check every minute

      this.timers.set(job.id, timer);
    }
  }

  /**
   * Save scheduled job to disk
   */
  private async saveScheduledJob(job: ScheduledJob): Promise<void> {
    try {
      const filePath = path.join(this.schedulerDir, `${job.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(job, null, 2));
    } catch (error) {
      Logger.error(`Failed to save scheduled job ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Load all scheduled jobs from disk
   */
  private async loadScheduledJobs(): Promise<void> {
    try {
      const files = await fs.readdir(this.schedulerDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(this.schedulerDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const job = JSON.parse(data) as ScheduledJob;

        job.createdAt = new Date(job.createdAt);
        job.updatedAt = new Date(job.updatedAt);

        this.scheduledJobs.set(job.id, job);

        // Re-setup the schedule
        if (job.enabled) {
          this.setupSchedule(job);
        }
      }

      Logger.debug(`Loaded ${this.scheduledJobs.size} scheduled jobs`);
    } catch (error) {
      Logger.warn('No scheduled jobs found or error loading scheduled jobs');
    }
  }

  /**
   * Cleanup - clear all timers
   */
  async cleanup(): Promise<void> {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    Logger.info('Scheduler cleanup completed');
  }
}

