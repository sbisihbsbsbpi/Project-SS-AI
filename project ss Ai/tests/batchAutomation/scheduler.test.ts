/**
 * Scheduler Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { Scheduler } from '../../src/features/batchAutomation/scheduler';
import { ScheduleConfig } from '../../src/features/batchAutomation/types';

describe('Scheduler', () => {
  let scheduler: Scheduler;
  const testDir = './test-scheduler';

  beforeEach(async () => {
    scheduler = new Scheduler(testDir);
    await scheduler.initialize();
  });

  afterEach(async () => {
    try {
      await scheduler.cleanup();
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should schedule a job', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);

    expect(job.id).toBeDefined();
    expect(job.workflowId).toBe('workflow-1');
    expect(job.enabled).toBe(true);
  });

  it('should unschedule a job', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);
    await scheduler.unscheduleJob(job.id);

    const jobs = await scheduler.getScheduledJobs();
    expect(jobs.find(j => j.id === job.id)).toBeUndefined();
  });

  it('should get all scheduled jobs', async () => {
    const schedule1: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const schedule2: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 120000),
    };

    await scheduler.scheduleJob('workflow-1', schedule1);
    await scheduler.scheduleJob('workflow-2', schedule2);

    const jobs = await scheduler.getScheduledJobs();
    expect(jobs).toHaveLength(2);
  });

  it('should execute a scheduled job', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);
    const execution = await scheduler.executeScheduledJob(job.id);

    expect(execution.id).toBeDefined();
    expect(execution.workflowId).toBe('workflow-1');
    expect(execution.status).toBe('completed');
  });

  it('should track execution history', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);
    await scheduler.executeScheduledJob(job.id);

    const jobs = await scheduler.getScheduledJobs();
    const updatedJob = jobs.find(j => j.id === job.id);

    expect(updatedJob?.executionHistory).toHaveLength(1);
    expect(updatedJob?.lastExecutionId).toBeDefined();
  });

  it('should save scheduled job to disk', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);

    const filePath = `${testDir}/${job.id}.json`;
    const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should load scheduled jobs from disk', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const job1 = await scheduler.scheduleJob('workflow-1', schedule);
    await scheduler.cleanup();

    const scheduler2 = new Scheduler(testDir);
    await scheduler2.initialize();

    const jobs = await scheduler2.getScheduledJobs();
    expect(jobs.find(j => j.id === job1.id)).toBeDefined();

    await scheduler2.cleanup();
  });

  it('should handle recurring schedule', async () => {
    const schedule: ScheduleConfig = {
      type: 'recurring',
      cronExpression: '0 * * * *',
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);

    expect(job.schedule.type).toBe('recurring');
    expect(job.schedule.cronExpression).toBe('0 * * * *');
  });

  it('should throw error when unscheduling non-existent job', async () => {
    await expect(scheduler.unscheduleJob('non-existent')).rejects.toThrow();
  });

  it('should throw error when executing non-existent job', async () => {
    await expect(scheduler.executeScheduledJob('non-existent')).rejects.toThrow();
  });

  it('should support timezone in schedule', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
      timezone: 'America/New_York',
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);

    expect(job.schedule.timezone).toBe('America/New_York');
  });

  it('should update job timestamp on execution', async () => {
    const schedule: ScheduleConfig = {
      type: 'once',
      nextRun: new Date(Date.now() + 60000),
    };

    const job = await scheduler.scheduleJob('workflow-1', schedule);
    const originalTime = job.updatedAt;

    await scheduler.executeScheduledJob(job.id);

    const jobs = await scheduler.getScheduledJobs();
    const updatedJob = jobs.find(j => j.id === job.id);

    expect(updatedJob?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTime.getTime());
  });
});

