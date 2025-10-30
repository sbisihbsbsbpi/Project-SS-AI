/**
 * Report Generator - Generate comprehensive analysis reports
 */

import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import { validateString } from '../../utils/validation';
import { AnalysisReport, ReportExportOptions, OCRResult } from './types';

export class ReportGenerator {
  private reports: Map<string, AnalysisReport> = new Map();

  /**
   * Generate analysis report
   */
  generateReport(
    imageUrl: string,
    ocrResults: OCRResult[],
    detectedElements: any[],
    accessibilityCheck: any,
    issueDetection: any
  ): AnalysisReport {
    try {
      validateString(imageUrl, 'imageUrl');

      const overallScore = this.calculateOverallScore(
        ocrResults,
        accessibilityCheck,
        issueDetection
      );

      const summary = this.generateSummary(
        ocrResults,
        detectedElements,
        accessibilityCheck,
        issueDetection
      );

      const recommendations = this.generateRecommendations(
        accessibilityCheck,
        issueDetection
      );

      const report: AnalysisReport = {
        id: uuidv4(),
        imageUrl,
        timestamp: new Date(),
        ocrResults,
        detectedElements,
        accessibilityCheck,
        issueDetection,
        overallScore,
        summary,
        recommendations,
      };

      this.reports.set(report.id, report);
      return report;
    } catch (error) {
      throw new AppError(
        'REPORT_GENERATION_FAILED',
        `Failed to generate report: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    ocrResults: OCRResult[],
    accessibilityCheck: any,
    issueDetection: any
  ): number {
    const ocrScore = ocrResults.length > 0 ? 100 : 50;
    const accessibilityScore = accessibilityCheck?.score || 0;
    const issueScore = issueDetection?.score || 0;

    return Math.round((ocrScore + accessibilityScore + issueScore) / 3);
  }

  /**
   * Generate summary
   */
  private generateSummary(
    ocrResults: OCRResult[],
    detectedElements: any[],
    accessibilityCheck: any,
    issueDetection: any
  ): string {
    const parts: string[] = [];

    parts.push(`Analysis Report Generated: ${new Date().toISOString()}`);
    parts.push(`\nContent Analysis:`);
    parts.push(`- Text blocks detected: ${ocrResults.length}`);
    parts.push(`- UI elements detected: ${detectedElements.length}`);

    parts.push(`\nAccessibility:`);
    parts.push(`- Score: ${accessibilityCheck?.score || 0}/100`);
    parts.push(`- Issues found: ${accessibilityCheck?.issues?.length || 0}`);

    parts.push(`\nIssue Detection:`);
    parts.push(`- Score: ${issueDetection?.score || 0}/100`);
    parts.push(`- Issues found: ${issueDetection?.issues?.length || 0}`);

    return parts.join('\n');
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(accessibilityCheck: any, issueDetection: any): string[] {
    const recommendations: string[] = [];

    // Accessibility recommendations
    if (accessibilityCheck?.issues?.length > 0) {
      recommendations.push('Fix accessibility issues to improve WCAG compliance');
      recommendations.push('Add alt text to all images');
      recommendations.push('Ensure proper color contrast ratios');
    }

    // Issue recommendations
    if (issueDetection?.issues?.length > 0) {
      recommendations.push('Resolve layout issues to improve user experience');
      recommendations.push('Ensure all interactive elements are properly positioned');
      recommendations.push('Verify text readability across all screen sizes');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring for accessibility and usability issues');
    }

    return recommendations;
  }

  /**
   * Export report to JSON
   */
  exportToJSON(report: AnalysisReport): string {
    try {
      return JSON.stringify(report, null, 2);
    } catch (error) {
      throw new AppError(
        'JSON_EXPORT_FAILED',
        `Failed to export report to JSON: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Export report to HTML
   */
  exportToHTML(report: AnalysisReport): string {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .score { font-size: 24px; font-weight: bold; color: #0066cc; }
    .section { margin: 20px 0; padding: 10px; border-left: 4px solid #0066cc; }
    .issue { margin: 10px 0; padding: 10px; background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Content Analysis Report</h1>
  <p>Generated: ${report.timestamp.toISOString()}</p>
  
  <div class="section">
    <h2>Overall Score: <span class="score">${report.overallScore}/100</span></h2>
  </div>
  
  <div class="section">
    <h2>Summary</h2>
    <pre>${report.summary}</pre>
  </div>
  
  <div class="section">
    <h2>Recommendations</h2>
    <ul>
      ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
  </div>
</body>
</html>
      `;
      return html;
    } catch (error) {
      throw new AppError(
        'HTML_EXPORT_FAILED',
        `Failed to export report to HTML: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Export report to CSV
   */
  exportToCSV(report: AnalysisReport): string {
    try {
      const rows: string[] = [];
      rows.push('Metric,Value');
      rows.push(`Overall Score,${report.overallScore}`);
      rows.push(`OCR Results,${report.ocrResults.length}`);
      rows.push(`Detected Elements,${report.detectedElements.length}`);
      rows.push(`Accessibility Score,${report.accessibilityCheck?.score || 0}`);
      rows.push(`Issue Score,${report.issueDetection?.score || 0}`);

      return rows.join('\n');
    } catch (error) {
      throw new AppError(
        'CSV_EXPORT_FAILED',
        `Failed to export report to CSV: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): AnalysisReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports
   */
  getAllReports(): AnalysisReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Clear cached reports
   */
  clearReports(): void {
    this.reports.clear();
  }
}

