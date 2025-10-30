/**
 * Comprehensive test suite for Responsive Design Testing module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResponsiveDesignTesting } from '../../src/features/responsiveDesign';
import { MultiViewportCapture } from '../../src/features/responsiveDesign/multiViewportCapture';
import { ComparisonEngine } from '../../src/features/responsiveDesign/comparisonEngine';
import { ReportGenerator } from '../../src/features/responsiveDesign/reportGenerator';
import { VisualizationEngine } from '../../src/features/responsiveDesign/visualizationEngine';
import { COMMON_VIEWPORTS } from '../../src/features/responsiveDesign/types';

describe('Responsive Design Testing Module', () => {
  let system: ResponsiveDesignTesting;
  const mockConfig = {
    url: 'https://example.com',
    viewports: [COMMON_VIEWPORTS.MOBILE_MEDIUM, COMMON_VIEWPORTS.DESKTOP_MEDIUM],
    timeout: 10000,
    retries: 3,
  };

  beforeEach(() => {
    system = new ResponsiveDesignTesting(mockConfig);
  });

  afterEach(() => {
    system.clearAll();
  });

  // ============================================================================
  // Multi-Viewport Capture Tests
  // ============================================================================

  describe('Multi-Viewport Capture', () => {
    let capture: MultiViewportCapture;

    beforeEach(() => {
      capture = new MultiViewportCapture();
    });

    it('should capture at single viewport', () => {
      const result = capture.captureViewport('https://example.com', COMMON_VIEWPORTS.MOBILE_MEDIUM);
      expect(result).toBeDefined();
      expect(result.viewport.width).toBe(375);
      expect(result.viewport.height).toBe(667);
    });

    it('should capture at multiple viewports', () => {
      const viewports = [COMMON_VIEWPORTS.MOBILE_MEDIUM, COMMON_VIEWPORTS.DESKTOP_MEDIUM];
      const result = capture.captureMultipleViewports('https://example.com', viewports);
      expect(result.captures.length).toBe(2);
    });

    it('should capture common viewports', () => {
      const result = capture.captureCommonViewports('https://example.com');
      expect(result.captures.length).toBeGreaterThan(0);
    });

    it('should capture by device type', () => {
      const result = capture.captureByDeviceType('https://example.com', 'mobile');
      expect(result.captures.length).toBeGreaterThan(0);
      result.captures.forEach(c => {
        expect(c.viewport.deviceType).toBe('mobile');
      });
    });

    it('should get captures by viewport', () => {
      capture.captureViewport('https://example.com', COMMON_VIEWPORTS.MOBILE_MEDIUM);
      capture.captureViewport('https://example.com', COMMON_VIEWPORTS.MOBILE_MEDIUM);
      const results = capture.getCapturesByViewport(COMMON_VIEWPORTS.MOBILE_MEDIUM);
      expect(results.length).toBe(2);
    });

    it('should get captures by device type', () => {
      capture.captureByDeviceType('https://example.com', 'mobile');
      const results = capture.getCapturesByDeviceType('mobile');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should calculate average render time', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);
      const avg = capture.getAverageRenderTime(multi.id);
      expect(typeof avg).toBe('number');
      expect(avg).toBeGreaterThan(0);
    });

    it('should get total file size', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);
      const size = capture.getTotalFileSize(multi.id);
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Comparison Engine Tests
  // ============================================================================

  describe('Comparison Engine', () => {
    let engine: ComparisonEngine;
    let capture: MultiViewportCapture;

    beforeEach(() => {
      engine = new ComparisonEngine();
      capture = new MultiViewportCapture();
    });

    it('should compare captures', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comparison = engine.compareCaptures(multi.captures[0], multi.captures[1]);
      expect(comparison).toBeDefined();
      expect(comparison).toHaveProperty('differences');
      expect(comparison).toHaveProperty('issues');
    });

    it('should detect responsive issues', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comparison = engine.compareCaptures(multi.captures[0], multi.captures[1]);
      expect(Array.isArray(comparison.issues)).toBe(true);
    });

    it('should get all issues', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const issues = engine.getAllIssues();
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should get issues by severity', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const critical = engine.getIssuesBySeverity('critical');
      expect(Array.isArray(critical)).toBe(true);
    });

    it('should get critical issues', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const critical = engine.getCriticalIssues();
      expect(Array.isArray(critical)).toBe(true);
    });

    it('should get issues by type', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const layout = engine.getIssuesByType('layout');
      expect(Array.isArray(layout)).toBe(true);
    });

    it('should calculate responsive score', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comparison = engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const score = engine.calculateResponsiveScore([comparison]);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // Report Generator Tests
  // ============================================================================

  describe('Report Generator', () => {
    let generator: ReportGenerator;
    let capture: MultiViewportCapture;
    let engine: ComparisonEngine;

    beforeEach(() => {
      generator = new ReportGenerator();
      capture = new MultiViewportCapture();
      engine = new ComparisonEngine();
    });

    it('should generate report', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comparison = engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const issues = engine.getAllIssues();

      const report = generator.generateReport('https://example.com', multi, [comparison], issues);
      expect(report).toBeDefined();
      expect(report).toHaveProperty('responsiveScore');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('recommendations');
    });

    it('should export to JSON', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comparison = engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const issues = engine.getAllIssues();
      const report = generator.generateReport('https://example.com', multi, [comparison], issues);

      const json = generator.exportToJSON(report);
      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);
    });

    it('should export to HTML', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comparison = engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const issues = engine.getAllIssues();
      const report = generator.generateReport('https://example.com', multi, [comparison], issues);

      const html = generator.exportToHTML(report);
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should export to CSV', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comparison = engine.compareCaptures(multi.captures[0], multi.captures[1]);
      const issues = engine.getAllIssues();
      const report = generator.generateReport('https://example.com', multi, [comparison], issues);

      const csv = generator.exportToCSV(report);
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Metric,Value');
    });
  });

  // ============================================================================
  // Visualization Engine Tests
  // ============================================================================

  describe('Visualization Engine', () => {
    let engine: VisualizationEngine;
    let capture: MultiViewportCapture;
    let comparison: ComparisonEngine;

    beforeEach(() => {
      engine = new VisualizationEngine();
      capture = new MultiViewportCapture();
      comparison = new ComparisonEngine();
    });

    it('should generate side-by-side comparison', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comp = comparison.compareCaptures(multi.captures[0], multi.captures[1]);
      const viz = engine.generateSideBySideComparison(comp);
      expect(viz).toBeDefined();
      expect(viz.format).toBe('side-by-side');
    });

    it('should generate overlay comparison', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comp = comparison.compareCaptures(multi.captures[0], multi.captures[1]);
      const viz = engine.generateOverlayComparison(comp);
      expect(viz.format).toBe('overlay');
    });

    it('should generate diff visualization', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comp = comparison.compareCaptures(multi.captures[0], multi.captures[1]);
      const viz = engine.generateDiffVisualization(comp);
      expect(viz.format).toBe('diff');
    });

    it('should generate slider comparison', () => {
      const multi = capture.captureMultipleViewports('https://example.com', [
        COMMON_VIEWPORTS.MOBILE_MEDIUM,
        COMMON_VIEWPORTS.DESKTOP_MEDIUM,
      ]);

      const comp = comparison.compareCaptures(multi.captures[0], multi.captures[1]);
      const viz = engine.generateSliderComparison(comp);
      expect(viz.format).toBe('slider');
    });
  });

  // ============================================================================
  // Main System Tests
  // ============================================================================

  describe('ResponsiveDesignTesting', () => {
    it('should initialize', () => {
      expect(system).toBeDefined();
      expect(system.getCaptureEngine).toBeDefined();
      expect(system.getComparisonEngine).toBeDefined();
      expect(system.getReportGenerator).toBeDefined();
      expect(system.getVisualizationEngine).toBeDefined();
    });

    it('should run test', () => {
      const report = system.runTest();
      expect(report).toBeDefined();
      expect(report).toHaveProperty('responsiveScore');
      expect(report).toHaveProperty('issues');
    });

    it('should test common viewports', () => {
      const report = system.testCommonViewports();
      expect(report).toBeDefined();
      expect(report.captures.captures.length).toBeGreaterThan(0);
    });

    it('should test by device type', () => {
      const report = system.testByDeviceType('mobile');
      expect(report).toBeDefined();
      report.captures.captures.forEach(c => {
        expect(c.viewport.deviceType).toBe('mobile');
      });
    });

    it('should export report', () => {
      const report = system.runTest();
      const json = system.exportReport(report, { format: 'json' });
      expect(typeof json).toBe('string');
    });

    it('should get statistics', () => {
      system.runTest();
      const stats = system.getStatistics();
      expect(stats).toHaveProperty('totalCaptures');
      expect(stats).toHaveProperty('totalComparisons');
      expect(stats).toHaveProperty('totalIssues');
      expect(stats).toHaveProperty('averageResponsiveScore');
    });

    it('should clear all data', () => {
      system.runTest();
      system.clearAll();
      const stats = system.getStatistics();
      expect(stats.totalCaptures).toBe(0);
    });
  });
});

