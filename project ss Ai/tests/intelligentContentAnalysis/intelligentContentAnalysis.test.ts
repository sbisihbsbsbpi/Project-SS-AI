/**
 * Comprehensive test suite for Intelligent Content Analysis module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntelligentContentAnalysis } from '../../src/features/intelligentContentAnalysis';
import { OCREngine } from '../../src/features/intelligentContentAnalysis/ocrEngine';
import { ElementDetector } from '../../src/features/intelligentContentAnalysis/elementDetector';
import { AccessibilityChecker } from '../../src/features/intelligentContentAnalysis/accessibilityChecker';
import { IssueDetector } from '../../src/features/intelligentContentAnalysis/issueDetector';
import { ReportGenerator } from '../../src/features/intelligentContentAnalysis/reportGenerator';
import { ElementType, AccessibilityIssueSeverity } from '../../src/features/intelligentContentAnalysis/types';

describe('Intelligent Content Analysis Module', () => {
  let analysis: IntelligentContentAnalysis;
  const mockImageUrl = 'https://example.com/image.png';
  const mockImageData = 'mock-image-data';

  beforeEach(() => {
    analysis = new IntelligentContentAnalysis();
  });

  afterEach(() => {
    analysis.clearHistory();
  });

  // ============================================================================
  // OCR Engine Tests
  // ============================================================================

  describe('OCR Engine', () => {
    let ocrEngine: OCREngine;

    beforeEach(() => {
      ocrEngine = new OCREngine();
    });

    it('should extract text from image', async () => {
      const results = await ocrEngine.extractText(mockImageData);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('text');
      expect(results[0]).toHaveProperty('confidence');
      expect(results[0]).toHaveProperty('boundingBox');
    });

    it('should extract text with specified languages', async () => {
      const results = await ocrEngine.extractText(mockImageData, { languages: ['eng', 'spa'] });
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should extract text from specific region', async () => {
      const region = { x: 10, y: 20, width: 100, height: 50 };
      const results = await ocrEngine.extractTextFromRegion(mockImageData, region);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get all extracted text', async () => {
      const results = await ocrEngine.extractText(mockImageData);
      const allText = ocrEngine.getAllText(results);
      expect(typeof allText).toBe('string');
      expect(allText.length).toBeGreaterThan(0);
    });

    it('should filter text by confidence', async () => {
      const results = await ocrEngine.extractText(mockImageData);
      const filtered = ocrEngine.getTextByConfidence(results, 0.9);
      expect(Array.isArray(filtered)).toBe(true);
      filtered.forEach(r => {
        expect(r.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should calculate average confidence', async () => {
      const results = await ocrEngine.extractText(mockImageData);
      const avgConfidence = ocrEngine.getAverageConfidence(results);
      expect(typeof avgConfidence).toBe('number');
      expect(avgConfidence).toBeGreaterThanOrEqual(0);
      expect(avgConfidence).toBeLessThanOrEqual(1);
    });

    it('should clear results', () => {
      ocrEngine.clearResults();
      expect(ocrEngine.clearResults).toBeDefined();
    });
  });

  // ============================================================================
  // Element Detector Tests
  // ============================================================================

  describe('Element Detector', () => {
    let detector: ElementDetector;

    beforeEach(() => {
      detector = new ElementDetector();
    });

    it('should detect elements in image', () => {
      const elements = detector.detectElements(mockImageData);
      expect(elements).toBeDefined();
      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should detect elements with correct properties', () => {
      const elements = detector.detectElements(mockImageData);
      elements.forEach(element => {
        expect(element).toHaveProperty('id');
        expect(element).toHaveProperty('type');
        expect(element).toHaveProperty('boundingBox');
        expect(element).toHaveProperty('confidence');
      });
    });

    it('should detect elements in specific region', () => {
      const region = { x: 0, y: 0, width: 200, height: 200 };
      const elements = detector.detectElementsInRegion(mockImageData, region);
      expect(Array.isArray(elements)).toBe(true);
    });

    it('should filter elements by type', () => {
      const elements = detector.detectElements(mockImageData);
      const buttons = detector.getElementsByType(elements, ElementType.BUTTON);
      expect(Array.isArray(buttons)).toBe(true);
      buttons.forEach(b => {
        expect(b.type).toBe(ElementType.BUTTON);
      });
    });

    it('should filter elements by confidence', () => {
      const elements = detector.detectElements(mockImageData);
      const filtered = detector.getElementsByConfidence(elements, 0.85);
      expect(Array.isArray(filtered)).toBe(true);
      filtered.forEach(e => {
        expect(e.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    it('should get interactive elements', () => {
      const elements = detector.detectElements(mockImageData);
      const interactive = detector.getInteractiveElements(elements);
      expect(Array.isArray(interactive)).toBe(true);
    });

    it('should get text elements', () => {
      const elements = detector.detectElements(mockImageData);
      const textElements = detector.getTextElements(elements);
      expect(Array.isArray(textElements)).toBe(true);
    });

    it('should calculate element coverage', () => {
      const elements = detector.detectElements(mockImageData);
      const coverage = detector.calculateCoverage(elements, 800, 600);
      expect(typeof coverage).toBe('number');
      expect(coverage).toBeGreaterThanOrEqual(0);
    });

    it('should find overlapping elements', () => {
      const elements = detector.detectElements(mockImageData);
      const overlaps = detector.findOverlappingElements(elements);
      expect(Array.isArray(overlaps)).toBe(true);
    });

    it('should clear elements', () => {
      detector.clearElements();
      expect(detector.clearElements).toBeDefined();
    });
  });

  // ============================================================================
  // Accessibility Checker Tests
  // ============================================================================

  describe('Accessibility Checker', () => {
    let checker: AccessibilityChecker;
    let elements: any[];

    beforeEach(() => {
      checker = new AccessibilityChecker();
      const detector = new ElementDetector();
      elements = detector.detectElements(mockImageData);
    });

    it('should check accessibility', () => {
      const result = checker.checkAccessibility(elements);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('colorContrasts');
      expect(result).toHaveProperty('score');
    });

    it('should have valid accessibility score', () => {
      const result = checker.checkAccessibility(elements);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should detect accessibility issues', () => {
      const result = checker.checkAccessibility(elements);
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should check color contrasts', () => {
      const result = checker.checkAccessibility(elements);
      expect(Array.isArray(result.colorContrasts)).toBe(true);
      result.colorContrasts.forEach(contrast => {
        expect(contrast).toHaveProperty('foreground');
        expect(contrast).toHaveProperty('background');
        expect(contrast).toHaveProperty('ratio');
        expect(contrast).toHaveProperty('isCompliant');
      });
    });

    it('should get issues by severity', () => {
      const result = checker.checkAccessibility(elements);
      const highSeverity = checker.getIssuesBySeverity(result, AccessibilityIssueSeverity.HIGH);
      expect(Array.isArray(highSeverity)).toBe(true);
    });

    it('should get critical issues', () => {
      const result = checker.checkAccessibility(elements);
      const critical = checker.getCriticalIssues(result);
      expect(Array.isArray(critical)).toBe(true);
    });

    it('should get WCAG compliance level', () => {
      const result = checker.checkAccessibility(elements);
      const level = checker.getWCAGComplianceLevel(result);
      expect(['A', 'AA', 'AAA', 'NONE']).toContain(level);
    });

    it('should clear results', () => {
      checker.clearResults();
      expect(checker.clearResults).toBeDefined();
    });
  });

  // ============================================================================
  // Issue Detector Tests
  // ============================================================================

  describe('Issue Detector', () => {
    let detector: IssueDetector;
    let elements: any[];

    beforeEach(() => {
      detector = new IssueDetector();
      const elementDetector = new ElementDetector();
      elements = elementDetector.detectElements(mockImageData);
    });

    it('should detect issues', () => {
      const result = detector.detectIssues(elements, 800, 600);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('score');
    });

    it('should have valid issue score', () => {
      const result = detector.detectIssues(elements, 800, 600);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should detect overlapping elements', () => {
      const result = detector.detectIssues(elements, 800, 600);
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should get issues by type', () => {
      const result = detector.detectIssues(elements, 800, 600);
      expect(detector.getIssuesByType).toBeDefined();
    });

    it('should get critical issues', () => {
      const result = detector.detectIssues(elements, 800, 600);
      const critical = detector.getCriticalIssues(result);
      expect(Array.isArray(critical)).toBe(true);
    });

    it('should clear results', () => {
      detector.clearResults();
      expect(detector.clearResults).toBeDefined();
    });
  });

  // ============================================================================
  // Report Generator Tests
  // ============================================================================

  describe('Report Generator', () => {
    let generator: ReportGenerator;

    beforeEach(() => {
      generator = new ReportGenerator();
    });

    it('should generate report', async () => {
      const ocrEngine = new OCREngine();
      const elementDetector = new ElementDetector();
      const checker = new AccessibilityChecker();
      const issueDetector = new IssueDetector();

      const ocrResults = await ocrEngine.extractText(mockImageData);
      const elements = elementDetector.detectElements(mockImageData);
      const accessibility = checker.checkAccessibility(elements);
      const issues = issueDetector.detectIssues(elements, 800, 600);

      const report = generator.generateReport(
        mockImageUrl,
        ocrResults,
        elements,
        accessibility,
        issues
      );

      expect(report).toBeDefined();
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('imageUrl');
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('recommendations');
    });

    it('should export to JSON', async () => {
      const ocrEngine = new OCREngine();
      const elementDetector = new ElementDetector();
      const checker = new AccessibilityChecker();
      const issueDetector = new IssueDetector();

      const ocrResults = await ocrEngine.extractText(mockImageData);
      const elements = elementDetector.detectElements(mockImageData);
      const accessibility = checker.checkAccessibility(elements);
      const issues = issueDetector.detectIssues(elements, 800, 600);

      const report = generator.generateReport(
        mockImageUrl,
        ocrResults,
        elements,
        accessibility,
        issues
      );

      const json = generator.exportToJSON(report);
      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);
    });

    it('should export to HTML', async () => {
      const ocrEngine = new OCREngine();
      const elementDetector = new ElementDetector();
      const checker = new AccessibilityChecker();
      const issueDetector = new IssueDetector();

      const ocrResults = await ocrEngine.extractText(mockImageData);
      const elements = elementDetector.detectElements(mockImageData);
      const accessibility = checker.checkAccessibility(elements);
      const issues = issueDetector.detectIssues(elements, 800, 600);

      const report = generator.generateReport(
        mockImageUrl,
        ocrResults,
        elements,
        accessibility,
        issues
      );

      const html = generator.exportToHTML(report);
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should export to CSV', async () => {
      const ocrEngine = new OCREngine();
      const elementDetector = new ElementDetector();
      const checker = new AccessibilityChecker();
      const issueDetector = new IssueDetector();

      const ocrResults = await ocrEngine.extractText(mockImageData);
      const elements = elementDetector.detectElements(mockImageData);
      const accessibility = checker.checkAccessibility(elements);
      const issues = issueDetector.detectIssues(elements, 800, 600);

      const report = generator.generateReport(
        mockImageUrl,
        ocrResults,
        elements,
        accessibility,
        issues
      );

      const csv = generator.exportToCSV(report);
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Metric,Value');
    });

    it('should clear reports', () => {
      generator.clearReports();
      expect(generator.clearReports).toBeDefined();
    });
  });

  // ============================================================================
  // Main IntelligentContentAnalysis Tests
  // ============================================================================

  describe('IntelligentContentAnalysis', () => {
    it('should initialize', () => {
      expect(analysis).toBeDefined();
      expect(analysis.getOCREngine).toBeDefined();
      expect(analysis.getElementDetector).toBeDefined();
      expect(analysis.getAccessibilityChecker).toBeDefined();
      expect(analysis.getIssueDetector).toBeDefined();
      expect(analysis.getReportGenerator).toBeDefined();
    });

    it('should analyze image', async () => {
      const report = await analysis.analyzeImage(mockImageUrl, mockImageData);
      expect(report).toBeDefined();
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('summary');
    });

    it('should get analysis by ID', async () => {
      const report = await analysis.analyzeImage(mockImageUrl, mockImageData);
      const retrieved = analysis.getAnalysis(report.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(report.id);
    });

    it('should get all analyses', async () => {
      await analysis.analyzeImage(mockImageUrl, mockImageData);
      await analysis.analyzeImage(mockImageUrl, mockImageData);
      const all = analysis.getAllAnalyses();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should export report', async () => {
      const report = await analysis.analyzeImage(mockImageUrl, mockImageData);
      const json = analysis.exportReport(report, { format: 'json' });
      expect(typeof json).toBe('string');
    });

    it('should get statistics', async () => {
      await analysis.analyzeImage(mockImageUrl, mockImageData);
      const stats = analysis.getStatistics();
      expect(stats).toHaveProperty('totalAnalyses');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('latestAnalysis');
    });

    it('should clear history', async () => {
      await analysis.analyzeImage(mockImageUrl, mockImageData);
      analysis.clearHistory();
      const all = analysis.getAllAnalyses();
      expect(all.length).toBe(0);
    });
  });
});

