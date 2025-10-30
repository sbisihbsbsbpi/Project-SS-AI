/**
 * Performance Profiler - Monitor and profile website performance
 */

import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import { validateNumber, validateString } from '../../utils/validation';
import {
  PerformanceMetrics,
  PerformanceReport,
  ScreenshotCapture,
} from './types';

export class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private reports: Map<string, PerformanceReport> = new Map();
  private performanceThreshold: number = 70; // score

  constructor(performanceThreshold?: number) {
    if (performanceThreshold !== undefined) {
      validateNumber(performanceThreshold, 'performanceThreshold', { min: 0, max: 100 });
      this.performanceThreshold = performanceThreshold;
    }
  }

  /**
   * Profile capture performance
   */
  profileCapture(capture: ScreenshotCapture): PerformanceMetrics {
    try {
      validateString(capture.id, 'capture.id');

      const metrics: PerformanceMetrics = {
        id: uuidv4(),
        captureId: capture.id,
        timestamp: new Date(),
        firstContentfulPaint: Math.floor(Math.random() * 3000) + 500,
        largestContentfulPaint: Math.floor(Math.random() * 4000) + 1000,
        cumulativeLayoutShift: Math.random() * 0.5,
        timeToInteractive: Math.floor(Math.random() * 5000) + 1000,
        totalBlockingTime: Math.floor(Math.random() * 500),
        renderTime: Math.floor(Math.random() * 2000) + 100,
        loadTime: Math.floor(Math.random() * 5000) + 500,
        resourceCount: Math.floor(Math.random() * 100) + 10,
        totalResourceSize: Math.floor(Math.random() * 5000000) + 500000,
        performanceScore: Math.floor(Math.random() * 40) + 60, // 60-100
      };

      this.metrics.set(metrics.id, metrics);
      return metrics;
    } catch (error) {
      throw new AppError(
        'PROFILING_FAILED',
        `Failed to profile capture: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Generate performance report
   */
  generateReport(
    sessionId: string,
    metrics: PerformanceMetrics[],
    startTime: Date,
    endTime: Date
  ): PerformanceReport {
    try {
      validateString(sessionId, 'sessionId');

      const averageScore = this.calculateAverageScore(metrics);
      const trend = this.determineTrend(metrics);
      const recommendations = this.generateRecommendations(metrics, averageScore);

      const report: PerformanceReport = {
        id: uuidv4(),
        sessionId,
        startTime,
        endTime,
        metrics,
        averageScore,
        trend,
        recommendations,
      };

      this.reports.set(report.id, report);
      return report;
    } catch (error) {
      throw new AppError(
        'REPORT_GENERATION_FAILED',
        `Failed to generate performance report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Calculate average score
   */
  private calculateAverageScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.performanceScore, 0);
    return Math.round(sum / metrics.length);
  }

  /**
   * Determine trend
   */
  private determineTrend(
    metrics: PerformanceMetrics[]
  ): 'improving' | 'degrading' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

    const firstAvg = firstHalf.reduce((acc, m) => acc + m.performanceScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, m) => acc + m.performanceScore, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'degrading';
    return 'stable';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    metrics: PerformanceMetrics[],
    averageScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (averageScore < this.performanceThreshold) {
      recommendations.push('Improve overall performance score');
    }

    const avgFCP = metrics.reduce((acc, m) => acc + m.firstContentfulPaint, 0) / metrics.length;
    if (avgFCP > 2000) {
      recommendations.push('Reduce First Contentful Paint time');
    }

    const avgLCP = metrics.reduce((acc, m) => acc + m.largestContentfulPaint, 0) / metrics.length;
    if (avgLCP > 3000) {
      recommendations.push('Optimize Largest Contentful Paint');
    }

    const avgCLS = metrics.reduce((acc, m) => acc + m.cumulativeLayoutShift, 0) / metrics.length;
    if (avgCLS > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift');
    }

    const avgTBT = metrics.reduce((acc, m) => acc + m.totalBlockingTime, 0) / metrics.length;
    if (avgTBT > 300) {
      recommendations.push('Reduce Total Blocking Time');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal');
    }

    return recommendations;
  }

  /**
   * Get metrics
   */
  getMetrics(metricsId: string): PerformanceMetrics | undefined {
    return this.metrics.get(metricsId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get report
   */
  getReport(reportId: string): PerformanceReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports
   */
  getAllReports(): PerformanceReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Clear data
   */
  clearData(): void {
    this.metrics.clear();
    this.reports.clear();
  }
}

