/**
 * History Tracker
 * Tracks comparison history and results
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../../utils/logger';
import {
  HistoryEntry,
  HistoryQueryOptions,
  IHistoryTracker,
} from './types';

export class HistoryTracker implements IHistoryTracker {
  private historyDir: string;
  private historyFile: string;
  private history: HistoryEntry[] = [];

  constructor(historyDir: string = './history') {
    this.historyDir = historyDir;
    this.historyFile = path.join(historyDir, 'history.json');
  }

  /**
   * Initialize history tracker
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
      await this.loadHistory();
      Logger.info('HistoryTracker initialized', { historyDir: this.historyDir });
    } catch (error) {
      Logger.error('Failed to initialize HistoryTracker', error);
      throw error;
    }
  }

  /**
   * Add entry to history
   */
  async addEntry(entry: HistoryEntry): Promise<void> {
    try {
      this.history.push(entry);
      await this.saveHistory();

      Logger.info('History entry added', {
        baselineId: entry.baselineId,
        result: entry.result,
      });
    } catch (error) {
      Logger.error('Failed to add history entry', error);
      throw error;
    }
  }

  /**
   * Get history entries with optional filtering
   */
  async getHistory(options?: HistoryQueryOptions): Promise<HistoryEntry[]> {
    try {
      let filtered = [...this.history];

      if (options?.baselineId) {
        filtered = filtered.filter((e) => e.baselineId === options.baselineId);
      }

      if (options?.result) {
        filtered = filtered.filter((e) => e.result === options.result);
      }

      if (options?.startDate) {
        filtered = filtered.filter((e) => e.timestamp >= options.startDate!);
      }

      if (options?.endDate) {
        filtered = filtered.filter((e) => e.timestamp <= options.endDate!);
      }

      // Sort by timestamp descending
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 100;

      return filtered.slice(offset, offset + limit);
    } catch (error) {
      Logger.error('Failed to get history', error);
      return [];
    }
  }

  /**
   * Delete old entries
   */
  async deleteOldEntries(daysToKeep: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const initialLength = this.history.length;
      this.history = this.history.filter((e) => e.timestamp > cutoffDate);
      const deletedCount = initialLength - this.history.length;

      await this.saveHistory();

      Logger.info('Old history entries deleted', {
        daysToKeep,
        deletedCount,
      });

      return deletedCount;
    } catch (error) {
      Logger.error('Failed to delete old entries', error);
      throw error;
    }
  }

  /**
   * Clear history for a baseline or all
   */
  async clearHistory(baselineId?: string): Promise<void> {
    try {
      if (baselineId) {
        this.history = this.history.filter((e) => e.baselineId !== baselineId);
        Logger.info('History cleared for baseline', { baselineId });
      } else {
        this.history = [];
        Logger.info('All history cleared');
      }

      await this.saveHistory();
    } catch (error) {
      Logger.error('Failed to clear history', error);
      throw error;
    }
  }

  /**
   * Get statistics for a baseline
   */
  async getStatistics(baselineId: string): Promise<{
    totalComparisons: number;
    passedComparisons: number;
    failedComparisons: number;
    passRate: number;
    averageDifference: number;
  }> {
    try {
      const entries = await this.getHistory({ baselineId });

      const passedComparisons = entries.filter((e) => e.result === 'pass').length;
      const failedComparisons = entries.filter((e) => e.result === 'fail').length;
      const totalComparisons = entries.length;
      const passRate =
        totalComparisons > 0 ? (passedComparisons / totalComparisons) * 100 : 0;
      const averageDifference =
        entries.reduce((sum, e) => sum + e.percentageDifference, 0) /
        (totalComparisons || 1);

      return {
        totalComparisons,
        passedComparisons,
        failedComparisons,
        passRate,
        averageDifference,
      };
    } catch (error) {
      Logger.error('Failed to get statistics', error);
      throw {
        totalComparisons: 0,
        passedComparisons: 0,
        failedComparisons: 0,
        passRate: 0,
        averageDifference: 0,
      };
    }
  }

  /**
   * Load history from file
   */
  private async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.historyFile, 'utf-8');
      const parsed = JSON.parse(data);

      this.history = parsed.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));

      Logger.debug('History loaded', { count: this.history.length });
    } catch (error) {
      // History file doesn't exist yet, which is fine
      Logger.debug('History file not found, starting fresh');
    }
  }

  /**
   * Save history to file
   */
  private async saveHistory(): Promise<void> {
    try {
      await fs.writeFile(this.historyFile, JSON.stringify(this.history, null, 2));
    } catch (error) {
      Logger.error('Failed to save history', error);
      throw error;
    }
  }
}

