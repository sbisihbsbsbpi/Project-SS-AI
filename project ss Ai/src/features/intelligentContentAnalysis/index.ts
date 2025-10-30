/**
 * Intelligent Content Analysis Module
 * Orchestrates OCR, element detection, accessibility checks, and issue detection
 */

import { v4 as uuidv4 } from "uuid";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateString } from "../../utils/validation";
import { OCREngine } from "./ocrEngine";
import { ElementDetector } from "./elementDetector";
import { AccessibilityChecker } from "./accessibilityChecker";
import { IssueDetector } from "./issueDetector";
import { ReportGenerator } from "./reportGenerator";
import {
  AnalysisReport,
  ContentAnalysisOptions,
  ReportExportOptions,
  OCRResult,
  DetectedElement,
} from "./types";

export class IntelligentContentAnalysis {
  private ocrEngine: OCREngine;
  private elementDetector: ElementDetector;
  private accessibilityChecker: AccessibilityChecker;
  private issueDetector: IssueDetector;
  private reportGenerator: ReportGenerator;
  private analysisHistory: Map<string, AnalysisReport> = new Map();
  private readonly MAX_HISTORY_SIZE = 1000; // Prevent unbounded memory growth

  constructor() {
    this.ocrEngine = new OCREngine();
    this.elementDetector = new ElementDetector();
    this.accessibilityChecker = new AccessibilityChecker();
    this.issueDetector = new IssueDetector();
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Add report to history with LRU eviction
   */
  private addToHistory(report: AnalysisReport): void {
    // Evict oldest entry if at capacity
    if (this.analysisHistory.size >= this.MAX_HISTORY_SIZE) {
      const firstKey = this.analysisHistory.keys().next().value;
      if (firstKey) {
        this.analysisHistory.delete(firstKey);
      }
    }
    this.analysisHistory.set(report.id, report);
  }

  /**
   * Perform OCR extraction with error recovery
   */
  private async performOCRExtraction(
    imageData: string | ArrayBuffer,
    ocrOptions?: any
  ): Promise<OCRResult[]> {
    try {
      return await this.ocrEngine.extractText(imageData, ocrOptions);
    } catch (error) {
      console.warn(
        "OCR extraction failed, continuing without OCR results",
        error
      );
      return [];
    }
  }

  /**
   * Perform element detection with error recovery
   */
  private performElementDetection(
    imageData: string | ArrayBuffer
  ): DetectedElement[] {
    try {
      return this.elementDetector.detectElements(imageData);
    } catch (error) {
      console.warn(
        "Element detection failed, continuing without detected elements",
        error
      );
      return [];
    }
  }

  /**
   * Analyze image content
   */
  async analyzeImage(
    imageUrl: string,
    imageData: string | ArrayBuffer,
    options?: ContentAnalysisOptions
  ): Promise<AnalysisReport> {
    try {
      validateString(imageUrl, "imageUrl");

      const enableOCR = options?.enableOCR !== false;
      const enableElementDetection = options?.enableElementDetection !== false;
      const enableAccessibilityCheck =
        options?.enableAccessibilityCheck !== false;
      const enableIssueDetection = options?.enableIssueDetection !== false;

      // Parallel processing: OCR and element detection are independent
      const [ocrResults, detectedElements] = await Promise.all([
        enableOCR
          ? this.performOCRExtraction(imageData, options?.ocrOptions)
          : Promise.resolve([]),
        enableElementDetection
          ? this.performElementDetection(imageData)
          : Promise.resolve([]),
      ]);

      // Check accessibility with error recovery (depends on elements)
      let accessibilityCheck = null;
      if (enableAccessibilityCheck && detectedElements.length > 0) {
        try {
          accessibilityCheck =
            this.accessibilityChecker.checkAccessibility(detectedElements);
        } catch (error) {
          console.warn(
            "Accessibility check failed, continuing without accessibility results",
            error
          );
        }
      }

      // Detect issues with error recovery (depends on elements)
      let issueDetection = null;
      if (enableIssueDetection && detectedElements.length > 0) {
        try {
          issueDetection = this.issueDetector.detectIssues(
            detectedElements,
            800,
            600
          );
        } catch (error) {
          console.warn(
            "Issue detection failed, continuing without issue detection results",
            error
          );
        }
      }

      // Generate report
      const report = this.reportGenerator.generateReport(
        imageUrl,
        ocrResults,
        detectedElements,
        accessibilityCheck,
        issueDetection
      );

      // Store in history with LRU eviction
      this.addToHistory(report);

      return report;
    } catch (error) {
      throw new AppError(
        "CONTENT_ANALYSIS_FAILED",
        `Failed to analyze image: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get OCR engine
   */
  getOCREngine(): OCREngine {
    return this.ocrEngine;
  }

  /**
   * Get element detector
   */
  getElementDetector(): ElementDetector {
    return this.elementDetector;
  }

  /**
   * Get accessibility checker
   */
  getAccessibilityChecker(): AccessibilityChecker {
    return this.accessibilityChecker;
  }

  /**
   * Get issue detector
   */
  getIssueDetector(): IssueDetector {
    return this.issueDetector;
  }

  /**
   * Get report generator
   */
  getReportGenerator(): ReportGenerator {
    return this.reportGenerator;
  }

  /**
   * Export report
   */
  exportReport(report: AnalysisReport, options: ReportExportOptions): string {
    try {
      switch (options.format) {
        case "json":
          return this.reportGenerator.exportToJSON(report);
        case "html":
          return this.reportGenerator.exportToHTML(report);
        case "csv":
          return this.reportGenerator.exportToCSV(report);
        case "pdf":
          // PDF export would require additional library
          return this.reportGenerator.exportToHTML(report);
        default:
          throw new AppError(
            "INVALID_EXPORT_FORMAT",
            `Unsupported export format: ${options.format}`,
            ErrorSeverity.MEDIUM
          );
      }
    } catch (error) {
      throw new AppError(
        "REPORT_EXPORT_FAILED",
        `Failed to export report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get analysis by ID
   */
  getAnalysis(analysisId: string): AnalysisReport | undefined {
    return this.analysisHistory.get(analysisId);
  }

  /**
   * Get all analyses
   */
  getAllAnalyses(): AnalysisReport[] {
    return Array.from(this.analysisHistory.values());
  }

  /**
   * Clear analysis history
   */
  clearHistory(): void {
    this.analysisHistory.clear();
    this.ocrEngine.clearResults();
    this.elementDetector.clearElements();
    this.accessibilityChecker.clearResults();
    this.issueDetector.clearResults();
    this.reportGenerator.clearReports();
  }

  /**
   * Get analysis statistics
   */
  getStatistics() {
    const analyses = this.getAllAnalyses();
    const avgScore =
      analyses.length > 0
        ? Math.round(
            analyses.reduce((sum, a) => sum + a.overallScore, 0) /
              analyses.length
          )
        : 0;

    return {
      totalAnalyses: analyses.length,
      averageScore: avgScore,
      latestAnalysis: analyses[analyses.length - 1] || null,
    };
  }

  /**
   * Cleanup resources and clear history
   */
  cleanup(): void {
    this.analysisHistory.clear();
  }

  /**
   * Destroy the module and cleanup all resources
   */
  destroy(): void {
    this.cleanup();
  }
}

export {
  OCREngine,
  ElementDetector,
  AccessibilityChecker,
  IssueDetector,
  ReportGenerator,
};
export * from "./types";
