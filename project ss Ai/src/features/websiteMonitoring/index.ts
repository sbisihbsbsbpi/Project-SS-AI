/**
 * Website Monitoring & Performance Module
 * Orchestrates website monitoring, change detection, performance profiling, and notifications
 */

import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import { validateString } from '../../utils/validation';
import { WebsiteMonitor } from './websiteMonitor';
import { ChangeDetector } from './changeDetector';
import { PerformanceProfiler } from './performanceProfiler';
import { NotificationManager } from './notificationManager';
import { HistoryManager } from './historyManager';
import {
  MonitoringConfig,
  MonitoringSession,
  ChangeDetectionResult,
  PerformanceMetrics,
  MonitoringReport,
  ReportExportOptions,
  WebsiteMonitoringOptions,
  NotificationConfig,
} from './types';

export class WebsiteMonitoringSystem {
  private monitor: WebsiteMonitor;
  private changeDetector: ChangeDetector;
  private performanceProfiler: PerformanceProfiler;
  private notificationManager: NotificationManager;
  private historyManager: HistoryManager;
  private options: WebsiteMonitoringOptions;

  constructor(config: MonitoringConfig, options?: WebsiteMonitoringOptions) {
    this.monitor = new WebsiteMonitor(config);
    this.changeDetector = new ChangeDetector(options?.changeThreshold);
    this.performanceProfiler = new PerformanceProfiler(options?.performanceThreshold);
    this.notificationManager = new NotificationManager();
    this.historyManager = new HistoryManager();
    this.options = options || {};
  }

  /**
   * Start monitoring
   */
  startMonitoring(): MonitoringSession {
    try {
      return this.monitor.startSession();
    } catch (error) {
      throw new AppError(
        'MONITORING_START_FAILED',
        `Failed to start monitoring: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(sessionId: string): MonitoringSession | undefined {
    try {
      return this.monitor.stopSession(sessionId);
    } catch (error) {
      throw new AppError(
        'MONITORING_STOP_FAILED',
        `Failed to stop monitoring: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Pause monitoring
   */
  pauseMonitoring(sessionId: string): MonitoringSession | undefined {
    try {
      return this.monitor.pauseSession(sessionId);
    } catch (error) {
      throw new AppError(
        'MONITORING_PAUSE_FAILED',
        `Failed to pause monitoring: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Resume monitoring
   */
  resumeMonitoring(sessionId: string): MonitoringSession | undefined {
    try {
      return this.monitor.resumeSession(sessionId);
    } catch (error) {
      throw new AppError(
        'MONITORING_RESUME_FAILED',
        `Failed to resume monitoring: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Configure notification channel
   */
  configureNotifications(config: NotificationConfig): void {
    try {
      this.notificationManager.configureChannel(config);
    } catch (error) {
      throw new AppError(
        'NOTIFICATION_CONFIG_FAILED',
        `Failed to configure notifications: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Get monitoring session
   */
  getSession(sessionId: string): MonitoringSession | undefined {
    return this.monitor.getSession(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): MonitoringSession[] {
    return this.monitor.getAllSessions();
  }

  /**
   * Get session captures
   */
  getSessionCaptures(sessionId: string) {
    return this.monitor.getSessionCaptures(sessionId);
  }

  /**
   * Get change detector
   */
  getChangeDetector(): ChangeDetector {
    return this.changeDetector;
  }

  /**
   * Get performance profiler
   */
  getPerformanceProfiler(): PerformanceProfiler {
    return this.performanceProfiler;
  }

  /**
   * Get notification manager
   */
  getNotificationManager(): NotificationManager {
    return this.notificationManager;
  }

  /**
   * Get history manager
   */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  /**
   * Generate monitoring report
   */
  generateReport(
    sessionId: string,
    title: string,
    description: string
  ): MonitoringReport {
    try {
      validateString(sessionId, 'sessionId');
      validateString(title, 'title');

      const captures = this.monitor.getSessionCaptures(sessionId);
      const changes = this.changeDetector.getAllResults();
      const metrics = this.performanceProfiler.getAllMetrics();

      const history = this.historyManager.createHistory(
        sessionId,
        captures,
        changes,
        metrics
      );

      return this.historyManager.generateReport(sessionId, history, title, description);
    } catch (error) {
      throw new AppError(
        'REPORT_GENERATION_FAILED',
        `Failed to generate report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Export report
   */
  exportReport(report: MonitoringReport, options: ReportExportOptions): string {
    try {
      return this.historyManager.exportReport(report, options);
    } catch (error) {
      throw new AppError(
        'REPORT_EXPORT_FAILED',
        `Failed to export report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const sessions = this.monitor.getAllSessions();
    const changes = this.changeDetector.getAllResults();
    const metrics = this.performanceProfiler.getAllMetrics();

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      totalCaptures: sessions.reduce((sum, s) => sum + s.captureCount, 0),
      totalChanges: changes.length,
      criticalChanges: changes.filter(c => c.severity === 'critical').length,
      averagePerformanceScore: metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.performanceScore, 0) / metrics.length)
        : 0,
    };
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.monitor.clearAll();
    this.changeDetector.clearResults();
    this.performanceProfiler.clearData();
    this.notificationManager.clearNotifications();
    this.historyManager.clearData();
  }
}

export {
  WebsiteMonitor,
  ChangeDetector,
  PerformanceProfiler,
  NotificationManager,
  HistoryManager,
};
export * from './types';

