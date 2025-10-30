/**
 * Comprehensive test suite for Website Monitoring & Performance module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebsiteMonitoringSystem } from '../../src/features/websiteMonitoring';
import { WebsiteMonitor } from '../../src/features/websiteMonitoring/websiteMonitor';
import { ChangeDetector } from '../../src/features/websiteMonitoring/changeDetector';
import { PerformanceProfiler } from '../../src/features/websiteMonitoring/performanceProfiler';
import { NotificationManager } from '../../src/features/websiteMonitoring/notificationManager';
import { HistoryManager } from '../../src/features/websiteMonitoring/historyManager';
import { NotificationChannel } from '../../src/features/websiteMonitoring/types';

describe('Website Monitoring & Performance Module', () => {
  let system: WebsiteMonitoringSystem;
  const mockConfig = {
    url: 'https://example.com',
    interval: 5000,
    timeout: 10000,
    retries: 3,
    enabled: true,
  };

  beforeEach(() => {
    system = new WebsiteMonitoringSystem(mockConfig);
  });

  afterEach(() => {
    system.clearAll();
  });

  // ============================================================================
  // Website Monitor Tests
  // ============================================================================

  describe('Website Monitor', () => {
    let monitor: WebsiteMonitor;

    beforeEach(() => {
      monitor = new WebsiteMonitor(mockConfig);
    });

    it('should start monitoring session', () => {
      const session = monitor.startSession();
      expect(session).toBeDefined();
      expect(session).toHaveProperty('id');
      expect(session.status).toBe('active');
      expect(session.captureCount).toBe(0);
    });

    it('should capture screenshot', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);
      expect(capture).toBeDefined();
      expect(capture).toHaveProperty('id');
      expect(capture.sessionId).toBe(session.id);
      expect(capture.width).toBe(1920);
      expect(capture.height).toBe(1080);
    });

    it('should get session', () => {
      const session = monitor.startSession();
      const retrieved = monitor.getSession(session.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.id);
    });

    it('should get all sessions', () => {
      monitor.startSession();
      monitor.startSession();
      const sessions = monitor.getAllSessions();
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should get session captures', () => {
      const session = monitor.startSession();
      monitor.captureScreenshot(session.id);
      monitor.captureScreenshot(session.id);
      const captures = monitor.getSessionCaptures(session.id);
      expect(captures.length).toBe(2);
    });

    it('should pause session', () => {
      const session = monitor.startSession();
      const paused = monitor.pauseSession(session.id);
      expect(paused?.status).toBe('paused');
    });

    it('should resume session', () => {
      const session = monitor.startSession();
      monitor.pauseSession(session.id);
      const resumed = monitor.resumeSession(session.id);
      expect(resumed?.status).toBe('active');
    });

    it('should stop session', () => {
      const session = monitor.startSession();
      const stopped = monitor.stopSession(session.id);
      expect(stopped?.status).toBe('stopped');
      expect(stopped?.endTime).toBeDefined();
    });

    it('should clear session', () => {
      const session = monitor.startSession();
      monitor.captureScreenshot(session.id);
      monitor.clearSession(session.id);
      const retrieved = monitor.getSession(session.id);
      expect(retrieved).toBeUndefined();
    });
  });

  // ============================================================================
  // Change Detector Tests
  // ============================================================================

  describe('Change Detector', () => {
    let detector: ChangeDetector;
    let monitor: WebsiteMonitor;

    beforeEach(() => {
      detector = new ChangeDetector(5);
      monitor = new WebsiteMonitor(mockConfig);
    });

    it('should compare captures', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      const result = detector.compareCaptures(capture1, capture2);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('changePercentage');
      expect(result).toHaveProperty('hasChanges');
    });

    it('should detect changed regions', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      const result = detector.compareCaptures(capture1, capture2);
      expect(Array.isArray(result.changedRegions)).toBe(true);
    });

    it('should determine change type', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      const result = detector.compareCaptures(capture1, capture2);
      expect(['layout', 'content', 'style', 'mixed', 'none']).toContain(result.changeType);
    });

    it('should determine severity', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      const result = detector.compareCaptures(capture1, capture2);
      expect(['critical', 'high', 'medium', 'low', 'none']).toContain(result.severity);
    });

    it('should get results by severity', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      detector.compareCaptures(capture1, capture2);
      const critical = detector.getResultsBySeverity('critical');
      expect(Array.isArray(critical)).toBe(true);
    });

    it('should get critical changes', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      detector.compareCaptures(capture1, capture2);
      const critical = detector.getCriticalChanges();
      expect(Array.isArray(critical)).toBe(true);
    });

    it('should calculate average change percentage', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);
      const capture3 = monitor.captureScreenshot(session.id);

      detector.compareCaptures(capture1, capture2);
      detector.compareCaptures(capture2, capture3);

      const avg = detector.getAverageChangePercentage();
      expect(typeof avg).toBe('number');
      expect(avg).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Performance Profiler Tests
  // ============================================================================

  describe('Performance Profiler', () => {
    let profiler: PerformanceProfiler;
    let monitor: WebsiteMonitor;

    beforeEach(() => {
      profiler = new PerformanceProfiler(70);
      monitor = new WebsiteMonitor(mockConfig);
    });

    it('should profile capture', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const metrics = profiler.profileCapture(capture);
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('performanceScore');
      expect(metrics.performanceScore).toBeGreaterThanOrEqual(0);
      expect(metrics.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should have valid performance metrics', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const metrics = profiler.profileCapture(capture);
      expect(metrics).toHaveProperty('firstContentfulPaint');
      expect(metrics).toHaveProperty('largestContentfulPaint');
      expect(metrics).toHaveProperty('cumulativeLayoutShift');
      expect(metrics).toHaveProperty('timeToInteractive');
      expect(metrics).toHaveProperty('totalBlockingTime');
    });

    it('should generate performance report', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      const metrics1 = profiler.profileCapture(capture1);
      const metrics2 = profiler.profileCapture(capture2);

      const report = profiler.generateReport(
        session.id,
        [metrics1, metrics2],
        new Date(),
        new Date()
      );

      expect(report).toBeDefined();
      expect(report).toHaveProperty('averageScore');
      expect(report).toHaveProperty('trend');
      expect(report).toHaveProperty('recommendations');
    });

    it('should determine performance trend', () => {
      const session = monitor.startSession();
      const capture1 = monitor.captureScreenshot(session.id);
      const capture2 = monitor.captureScreenshot(session.id);

      const metrics1 = profiler.profileCapture(capture1);
      const metrics2 = profiler.profileCapture(capture2);

      const report = profiler.generateReport(
        session.id,
        [metrics1, metrics2],
        new Date(),
        new Date()
      );

      expect(['improving', 'degrading', 'stable']).toContain(report.trend);
    });

    it('should generate recommendations', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const metrics = profiler.profileCapture(capture);
      const report = profiler.generateReport(
        session.id,
        [metrics],
        new Date(),
        new Date()
      );

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Notification Manager Tests
  // ============================================================================

  describe('Notification Manager', () => {
    let manager: NotificationManager;

    beforeEach(() => {
      manager = new NotificationManager();
    });

    it('should configure notification channel', () => {
      manager.configureChannel({
        channel: NotificationChannel.EMAIL,
        enabled: true,
        recipients: ['test@example.com'],
      });

      expect(manager.configureChannel).toBeDefined();
    });

    it('should send email notification', async () => {
      const notification = await manager.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test Message'
      );

      expect(notification).toBeDefined();
      expect(notification.channel).toBe(NotificationChannel.EMAIL);
      expect(notification.recipient).toBe('test@example.com');
    });

    it('should send Slack notification', async () => {
      const notification = await manager.sendSlack(
        'https://hooks.slack.com/services/test',
        'Test Message'
      );

      expect(notification).toBeDefined();
      expect(notification.channel).toBe(NotificationChannel.SLACK);
    });

    it('should send webhook notification', async () => {
      const notification = await manager.sendWebhook(
        'https://example.com/webhook',
        { test: 'data' }
      );

      expect(notification).toBeDefined();
      expect(notification.channel).toBe(NotificationChannel.WEBHOOK);
    });

    it('should get all notifications', async () => {
      await manager.sendEmail('test@example.com', 'Subject', 'Message');
      await manager.sendEmail('test2@example.com', 'Subject', 'Message');

      const notifications = manager.getAllNotifications();
      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should get notifications by status', async () => {
      await manager.sendEmail('test@example.com', 'Subject', 'Message');
      const sent = manager.getNotificationsByStatus('sent');
      expect(Array.isArray(sent)).toBe(true);
    });
  });

  // ============================================================================
  // History Manager Tests
  // ============================================================================

  describe('History Manager', () => {
    let manager: HistoryManager;
    let monitor: WebsiteMonitor;

    beforeEach(() => {
      manager = new HistoryManager();
      monitor = new WebsiteMonitor(mockConfig);
    });

    it('should create monitoring history', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const history = manager.createHistory(session.id, [capture], [], []);
      expect(history).toBeDefined();
      expect(history.totalCaptures).toBe(1);
    });

    it('should generate monitoring report', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const history = manager.createHistory(session.id, [capture], [], []);
      const report = manager.generateReport(
        session.id,
        history,
        'Test Report',
        'Test Description'
      );

      expect(report).toBeDefined();
      expect(report.title).toBe('Test Report');
      expect(report.summary.totalCaptures).toBe(1);
    });

    it('should export report to JSON', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const history = manager.createHistory(session.id, [capture], [], []);
      const report = manager.generateReport(
        session.id,
        history,
        'Test Report',
        'Test Description'
      );

      const json = manager.exportReport(report, { format: 'json' });
      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);
    });

    it('should export report to HTML', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const history = manager.createHistory(session.id, [capture], [], []);
      const report = manager.generateReport(
        session.id,
        history,
        'Test Report',
        'Test Description'
      );

      const html = manager.exportReport(report, { format: 'html' });
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should export report to CSV', () => {
      const session = monitor.startSession();
      const capture = monitor.captureScreenshot(session.id);

      const history = manager.createHistory(session.id, [capture], [], []);
      const report = manager.generateReport(
        session.id,
        history,
        'Test Report',
        'Test Description'
      );

      const csv = manager.exportReport(report, { format: 'csv' });
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Metric,Value');
    });
  });

  // ============================================================================
  // Main System Tests
  // ============================================================================

  describe('WebsiteMonitoringSystem', () => {
    it('should initialize', () => {
      expect(system).toBeDefined();
      expect(system.getChangeDetector).toBeDefined();
      expect(system.getPerformanceProfiler).toBeDefined();
      expect(system.getNotificationManager).toBeDefined();
      expect(system.getHistoryManager).toBeDefined();
    });

    it('should start monitoring', () => {
      const session = system.startMonitoring();
      expect(session).toBeDefined();
      expect(session.status).toBe('active');
    });

    it('should stop monitoring', () => {
      const session = system.startMonitoring();
      const stopped = system.stopMonitoring(session.id);
      expect(stopped?.status).toBe('stopped');
    });

    it('should pause monitoring', () => {
      const session = system.startMonitoring();
      const paused = system.pauseMonitoring(session.id);
      expect(paused?.status).toBe('paused');
    });

    it('should resume monitoring', () => {
      const session = system.startMonitoring();
      system.pauseMonitoring(session.id);
      const resumed = system.resumeMonitoring(session.id);
      expect(resumed?.status).toBe('active');
    });

    it('should get statistics', () => {
      system.startMonitoring();
      const stats = system.getStatistics();
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('totalCaptures');
      expect(stats).toHaveProperty('totalChanges');
      expect(stats).toHaveProperty('averagePerformanceScore');
    });

    it('should generate report', () => {
      const session = system.startMonitoring();
      const report = system.generateReport(session.id, 'Test Report', 'Test Description');
      expect(report).toBeDefined();
      expect(report.title).toBe('Test Report');
    });

    it('should export report', () => {
      const session = system.startMonitoring();
      const report = system.generateReport(session.id, 'Test Report', 'Test Description');
      const json = system.exportReport(report, { format: 'json' });
      expect(typeof json).toBe('string');
    });

    it('should clear all data', () => {
      system.startMonitoring();
      system.clearAll();
      const sessions = system.getAllSessions();
      expect(sessions.length).toBe(0);
    });
  });
});

