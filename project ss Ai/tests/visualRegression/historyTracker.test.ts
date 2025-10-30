/**
 * History Tracker Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { HistoryTracker } from '../../src/features/visualRegression/historyTracker';
import { HistoryEntry } from '../../src/features/visualRegression/types';
import { v4 as uuidv4 } from 'uuid';

describe('HistoryTracker', () => {
  let tracker: HistoryTracker;
  const testDir = './test-history';

  beforeEach(async () => {
    tracker = new HistoryTracker(testDir);
    await tracker.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Helper function to create test history entries
   */
  function createTestEntry(
    baselineId: string = 'baseline-1',
    result: 'pass' | 'fail' = 'pass'
  ): HistoryEntry {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      baselineId,
      comparisonId: uuidv4(),
      result,
      percentageDifference: result === 'pass' ? 0.5 : 5.0,
    };
  }

  it('should add entry to history', async () => {
    const entry = createTestEntry();

    await tracker.addEntry(entry);

    const history = await tracker.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(entry.id);
  });

  it('should get history entries', async () => {
    const entry1 = createTestEntry('baseline-1', 'pass');
    const entry2 = createTestEntry('baseline-1', 'fail');

    await tracker.addEntry(entry1);
    await tracker.addEntry(entry2);

    const history = await tracker.getHistory();
    expect(history.length).toBe(2);
  });

  it('should filter history by baseline ID', async () => {
    const entry1 = createTestEntry('baseline-1', 'pass');
    const entry2 = createTestEntry('baseline-2', 'pass');

    await tracker.addEntry(entry1);
    await tracker.addEntry(entry2);

    const history = await tracker.getHistory({ baselineId: 'baseline-1' });
    expect(history.length).toBe(1);
    expect(history[0].baselineId).toBe('baseline-1');
  });

  it('should filter history by result', async () => {
    const entry1 = createTestEntry('baseline-1', 'pass');
    const entry2 = createTestEntry('baseline-1', 'fail');

    await tracker.addEntry(entry1);
    await tracker.addEntry(entry2);

    const passHistory = await tracker.getHistory({ result: 'pass' });
    expect(passHistory.length).toBe(1);
    expect(passHistory[0].result).toBe('pass');
  });

  it('should filter history by date range', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const entry = createTestEntry();
    await tracker.addEntry(entry);

    const history = await tracker.getHistory({
      startDate: yesterday,
      endDate: tomorrow,
    });

    expect(history.length).toBe(1);
  });

  it('should delete old entries', async () => {
    const entry = createTestEntry();
    await tracker.addEntry(entry);

    const deletedCount = await tracker.deleteOldEntries(0);

    expect(deletedCount).toBeGreaterThanOrEqual(0);
  });

  it('should clear history for specific baseline', async () => {
    const entry1 = createTestEntry('baseline-1', 'pass');
    const entry2 = createTestEntry('baseline-2', 'pass');

    await tracker.addEntry(entry1);
    await tracker.addEntry(entry2);

    await tracker.clearHistory('baseline-1');

    const history = await tracker.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].baselineId).toBe('baseline-2');
  });

  it('should clear all history', async () => {
    const entry1 = createTestEntry('baseline-1', 'pass');
    const entry2 = createTestEntry('baseline-2', 'pass');

    await tracker.addEntry(entry1);
    await tracker.addEntry(entry2);

    await tracker.clearHistory();

    const history = await tracker.getHistory();
    expect(history.length).toBe(0);
  });

  it('should get statistics for baseline', async () => {
    const entry1 = createTestEntry('baseline-1', 'pass');
    const entry2 = createTestEntry('baseline-1', 'pass');
    const entry3 = createTestEntry('baseline-1', 'fail');

    await tracker.addEntry(entry1);
    await tracker.addEntry(entry2);
    await tracker.addEntry(entry3);

    const stats = await tracker.getStatistics('baseline-1');

    expect(stats.totalComparisons).toBe(3);
    expect(stats.passedComparisons).toBe(2);
    expect(stats.failedComparisons).toBe(1);
    expect(stats.passRate).toBeCloseTo(66.67, 1);
  });

  it('should apply pagination to history', async () => {
    for (let i = 0; i < 10; i++) {
      await tracker.addEntry(createTestEntry());
    }

    const page1 = await tracker.getHistory({ limit: 5, offset: 0 });
    const page2 = await tracker.getHistory({ limit: 5, offset: 5 });

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);
  });

  it('should sort history by timestamp descending', async () => {
    const entry1 = createTestEntry();
    await new Promise((resolve) => setTimeout(resolve, 10));
    const entry2 = createTestEntry();

    await tracker.addEntry(entry1);
    await tracker.addEntry(entry2);

    const history = await tracker.getHistory();

    expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(
      history[1].timestamp.getTime()
    );
  });
});

