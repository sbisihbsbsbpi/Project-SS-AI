/**
 * Responsive Design Testing Module
 * Orchestrates multi-viewport capture, comparison, reporting, and visualization
 */

import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateString } from "../../utils/validation";
import { MultiViewportCapture } from "./multiViewportCapture";
import { ComparisonEngine } from "./comparisonEngine";
import { ReportGenerator } from "./reportGenerator";
import { VisualizationEngine } from "./visualizationEngine";
import {
  ResponsiveTestingConfig,
  ResponsiveDesignTestingOptions,
  ResponsiveDesignReport,
  ResponsiveReportExportOptions,
  Viewport,
  COMMON_VIEWPORTS,
} from "./types";

export class ResponsiveDesignTesting {
  private captureEngine: MultiViewportCapture;
  private comparisonEngine: ComparisonEngine;
  private reportGenerator: ReportGenerator;
  private visualizationEngine: VisualizationEngine;
  private config: ResponsiveTestingConfig;
  private options: ResponsiveDesignTestingOptions;

  constructor(config: ResponsiveTestingConfig) {
    validateString(config.url, "url");

    this.config = config;
    this.options = config.options || {};
    this.captureEngine = new MultiViewportCapture();
    this.comparisonEngine = new ComparisonEngine();
    this.reportGenerator = new ReportGenerator();
    this.visualizationEngine = new VisualizationEngine();
  }

  /**
   * Run responsive design test
   */
  runTest(): ResponsiveDesignReport {
    try {
      // Capture at multiple viewports
      const multiCapture = this.captureEngine.captureMultipleViewports(
        this.config.url,
        this.config.viewports
      );

      // Compare captures
      const comparisons = [];
      for (let i = 0; i < multiCapture.captures.length - 1; i++) {
        const comparison = this.comparisonEngine.compareCaptures(
          multiCapture.captures[i],
          multiCapture.captures[i + 1]
        );
        comparisons.push(comparison);
      }

      // Get all issues
      const issues = this.comparisonEngine.getAllIssues();

      // Generate report
      const report = this.reportGenerator.generateReport(
        this.config.url,
        multiCapture,
        comparisons,
        issues
      );

      // Generate visualizations if enabled
      if (this.options.enableVisualization !== false) {
        comparisons.forEach((c) => {
          this.visualizationEngine.generateSideBySideComparison(c);
        });
        this.visualizationEngine.generateGridVisualization(report);
      }

      return report;
    } catch (error) {
      throw new AppError(
        "TEST_FAILED",
        `Failed to run responsive design test: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Test common viewports
   */
  testCommonViewports(): ResponsiveDesignReport {
    try {
      const viewports = Object.values(COMMON_VIEWPORTS);
      this.config.viewports = viewports;
      return this.runTest();
    } catch (error) {
      throw new AppError(
        "TEST_FAILED",
        `Failed to test common viewports: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Test by device type
   */
  testByDeviceType(
    deviceType: "mobile" | "tablet" | "desktop"
  ): ResponsiveDesignReport {
    try {
      const viewports = Object.values(COMMON_VIEWPORTS).filter(
        (v) => v.deviceType === deviceType
      );

      if (viewports.length === 0) {
        throw new AppError(
          "NO_VIEWPORTS",
          `No viewports found for device type: ${deviceType}`,
          ErrorSeverity.MEDIUM
        );
      }

      this.config.viewports = viewports;
      return this.runTest();
    } catch (error) {
      throw new AppError(
        "TEST_FAILED",
        `Failed to test by device type: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Export report
   */
  exportReport(
    report: ResponsiveDesignReport,
    options: ResponsiveReportExportOptions
  ): string {
    try {
      switch (options.format) {
        case "json":
          return this.reportGenerator.exportToJSON(report);
        case "html":
          return this.reportGenerator.exportToHTML(report);
        case "csv":
          return this.reportGenerator.exportToCSV(report);
        case "pdf":
          return this.reportGenerator.exportToHTML(report); // PDF would require additional library
        default:
          throw new AppError(
            "INVALID_FORMAT",
            `Unsupported export format: ${options.format}`,
            ErrorSeverity.MEDIUM
          );
      }
    } catch (error) {
      throw new AppError(
        "EXPORT_FAILED",
        `Failed to export report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get capture engine
   */
  getCaptureEngine(): MultiViewportCapture {
    return this.captureEngine;
  }

  /**
   * Get comparison engine
   */
  getComparisonEngine(): ComparisonEngine {
    return this.comparisonEngine;
  }

  /**
   * Get report generator
   */
  getReportGenerator(): ReportGenerator {
    return this.reportGenerator;
  }

  /**
   * Get visualization engine
   */
  getVisualizationEngine(): VisualizationEngine {
    return this.visualizationEngine;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const captures = this.captureEngine.getAllCaptures();
    const comparisons = this.comparisonEngine.getAllComparisons();
    const issues = this.comparisonEngine.getAllIssues();
    const reports = this.reportGenerator.getAllReports();

    return {
      totalCaptures: captures.length,
      totalComparisons: comparisons.length,
      totalIssues: issues.length,
      criticalIssues: issues.filter((i) => i.severity === "critical").length,
      totalReports: reports.length,
      averageResponsiveScore:
        reports.length > 0
          ? Math.round(
              reports.reduce((sum, r) => sum + r.responsiveScore, 0) /
                reports.length
            )
          : 0,
    };
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.captureEngine.clearCaptures();
    this.comparisonEngine.clearData();
    this.reportGenerator.clearReports();
    this.visualizationEngine.clearVisualizations();
  }
}

export * from "./types";
