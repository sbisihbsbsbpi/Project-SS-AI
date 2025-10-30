/**
 * History Manager - Manage monitoring history and generate reports
 */

import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import { validateString } from '../../utils/validation';
import {
  MonitoringHistory,
  MonitoringReport,
  ScreenshotCapture,
  ChangeDetectionResult,
  PerformanceMetrics,
  ReportExportOptions,
} from './types';

export class HistoryManager {
  private histories: Map<string, MonitoringHistory> = new Map();
  private reports: Map<string, MonitoringReport> = new Map();

  /**
   * Create monitoring history
   */
  createHistory(
    sessionId: string,
    captures: ScreenshotCapture[],
    changes: ChangeDetectionResult[],
    metrics: PerformanceMetrics[]
  ): MonitoringHistory {
    try {
      validateString(sessionId, 'sessionId');

      const history: MonitoringHistory = {
        id: uuidv4(),
        sessionId,
        captures,
        changes,
        metrics,
        startTime: captures.length > 0 ? captures[0].timestamp : new Date(),
        endTime: captures.length > 0 ? captures[captures.length - 1].timestamp : undefined,
        totalCaptures: captures.length,
        totalChanges: changes.length,
        averageChangePercentage: this.calculateAverageChangePercentage(changes),
      };

      this.histories.set(history.id, history);
      return history;
    } catch (error) {
      throw new AppError(
        'HISTORY_CREATION_FAILED',
        `Failed to create monitoring history: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Generate monitoring report
   */
  generateReport(
    sessionId: string,
    history: MonitoringHistory,
    title: string,
    description: string
  ): MonitoringReport {
    try {
      validateString(sessionId, 'sessionId');
      validateString(title, 'title');

      const report: MonitoringReport = {
        id: uuidv4(),
        sessionId,
        title,
        description,
        generatedAt: new Date(),
        period: {
          startTime: history.startTime,
          endTime: history.endTime || new Date(),
        },
        summary: {
          totalCaptures: history.totalCaptures,
          totalChanges: history.totalChanges,
          averageChangePercentage: history.averageChangePercentage,
          criticalChanges: history.changes.filter(c => c.severity === 'critical').length,
          performanceScore: this.calculateAveragePerformanceScore(history.metrics),
        },
        changes: history.changes,
        performance: history.metrics,
        recommendations: this.generateRecommendations(history),
      };

      this.reports.set(report.id, report);
      return report;
    } catch (error) {
      throw new AppError(
        'REPORT_GENERATION_FAILED',
        `Failed to generate monitoring report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Calculate average change percentage
   */
  private calculateAverageChangePercentage(changes: ChangeDetectionResult[]): number {
    if (changes.length === 0) return 0;
    const sum = changes.reduce((acc, c) => acc + c.changePercentage, 0);
    return sum / changes.length;
  }

  /**
   * Calculate average performance score
   */
  private calculateAveragePerformanceScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.performanceScore, 0);
    return Math.round(sum / metrics.length);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(history: MonitoringHistory): string[] {
    const recommendations: string[] = [];

    if (history.totalChanges > 10) {
      recommendations.push('Website is changing frequently - consider investigating root cause');
    }

    const criticalChanges = history.changes.filter(c => c.severity === 'critical');
    if (criticalChanges.length > 0) {
      recommendations.push(`${criticalChanges.length} critical changes detected - immediate review recommended`);
    }

    const avgPerformance = this.calculateAveragePerformanceScore(history.metrics);
    if (avgPerformance < 70) {
      recommendations.push('Performance score is below threshold - optimization needed');
    }

    if (recommendations.length === 0) {
      recommendations.push('Website is stable and performing well');
    }

    return recommendations;
  }

  /**
   * Export report
   */
  exportReport(report: MonitoringReport, options: ReportExportOptions): string {
    try {
      switch (options.format) {
        case 'json':
          return this.exportToJSON(report);
        case 'html':
          return this.exportToHTML(report);
        case 'csv':
          return this.exportToCSV(report);
        case 'pdf':
          return this.exportToHTML(report); // PDF would require additional library
        default:
          throw new AppError(
            'INVALID_FORMAT',
            `Unsupported export format: ${options.format}`,
            ErrorSeverity.MEDIUM
          );
      }
    } catch (error) {
      throw new AppError(
        'EXPORT_FAILED',
        `Failed to export report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Export to JSON
   */
  private exportToJSON(report: MonitoringReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export to HTML
   */
  private exportToHTML(report: MonitoringReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .metric { margin: 10px 0; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p>${report.description}</p>
  <div class="summary">
    <h2>Summary</h2>
    <div class="metric">Total Captures: ${report.summary.totalCaptures}</div>
    <div class="metric">Total Changes: ${report.summary.totalChanges}</div>
    <div class="metric">Average Change: ${report.summary.averageChangePercentage.toFixed(2)}%</div>
    <div class="metric">Critical Changes: ${report.summary.criticalChanges}</div>
    <div class="metric">Performance Score: ${report.summary.performanceScore}/100</div>
  </div>
  <h2>Recommendations</h2>
  <ul>
    ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
  </ul>
</body>
</html>
    `;
  }

  /**
   * Export to CSV
   */
  private exportToCSV(report: MonitoringReport): string {
    const rows: string[] = [];
    rows.push('Metric,Value');
    rows.push(`Title,${report.title}`);
    rows.push(`Total Captures,${report.summary.totalCaptures}`);
    rows.push(`Total Changes,${report.summary.totalChanges}`);
    rows.push(`Average Change %,${report.summary.averageChangePercentage.toFixed(2)}`);
    rows.push(`Critical Changes,${report.summary.criticalChanges}`);
    rows.push(`Performance Score,${report.summary.performanceScore}`);
    return rows.join('\n');
  }

  /**
   * Get history
   */
  getHistory(historyId: string): MonitoringHistory | undefined {
    return this.histories.get(historyId);
  }

  /**
   * Get all histories
   */
  getAllHistories(): MonitoringHistory[] {
    return Array.from(this.histories.values());
  }

  /**
   * Get report
   */
  getReport(reportId: string): MonitoringReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports
   */
  getAllReports(): MonitoringReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Clear data
   */
  clearData(): void {
    this.histories.clear();
    this.reports.clear();
  }
}

