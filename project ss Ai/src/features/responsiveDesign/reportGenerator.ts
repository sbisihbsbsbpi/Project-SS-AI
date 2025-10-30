/**
 * Report Generator - Generate responsive design reports
 */

import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import { validateString } from '../../utils/validation';
import {
  ResponsiveDesignReport,
  MultiViewportCapture,
  ViewportComparison,
  ResponsiveIssue,
  ResponsiveReportExportOptions,
} from './types';

export class ReportGenerator {
  private reports: Map<string, ResponsiveDesignReport> = new Map();

  /**
   * Generate responsive design report
   */
  generateReport(
    url: string,
    multiCapture: MultiViewportCapture,
    comparisons: ViewportComparison[],
    issues: ResponsiveIssue[]
  ): ResponsiveDesignReport {
    try {
      validateString(url, 'url');

      const responsiveScore = this.calculateResponsiveScore(comparisons, issues);
      const breakpoints = this.detectBreakpoints(comparisons);
      const summary = this.generateSummary(url, multiCapture, comparisons, issues);
      const recommendations = this.generateRecommendations(issues, responsiveScore);

      const report: ResponsiveDesignReport = {
        id: uuidv4(),
        url,
        generatedAt: new Date(),
        captures: multiCapture,
        comparisons,
        issues,
        responsiveScore,
        summary,
        recommendations,
        breakpoints,
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
   * Calculate responsive score
   */
  private calculateResponsiveScore(
    comparisons: ViewportComparison[],
    issues: ResponsiveIssue[]
  ): number {
    if (comparisons.length === 0) return 100;

    const responsiveCount = comparisons.filter(c => c.isResponsive).length;
    const comparisonScore = (responsiveCount / comparisons.length) * 100;

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const issueScore = Math.max(0, 100 - criticalIssues * 10);

    return Math.round((comparisonScore + issueScore) / 2);
  }

  /**
   * Detect breakpoints
   */
  private detectBreakpoints(comparisons: ViewportComparison[]) {
    const breakpoints = new Set<string>();

    comparisons.forEach(c => {
      if (c.differences > 15 || c.issues.length > 0) {
        breakpoints.add(JSON.stringify(c.viewport2));
      }
    });

    return Array.from(breakpoints).map(bp => JSON.parse(bp));
  }

  /**
   * Generate summary
   */
  private generateSummary(
    url: string,
    multiCapture: MultiViewportCapture,
    comparisons: ViewportComparison[],
    issues: ResponsiveIssue[]
  ): string {
    const parts: string[] = [];

    parts.push(`Responsive Design Report for: ${url}`);
    parts.push(`Generated: ${new Date().toISOString()}`);
    parts.push(`\nCapture Summary:`);
    parts.push(`- Total viewports tested: ${multiCapture.captures.length}`);
    parts.push(`- Total capture time: ${multiCapture.totalTime}ms`);
    parts.push(`- Average render time: ${Math.round(multiCapture.totalTime / multiCapture.captures.length)}ms`);

    parts.push(`\nComparison Summary:`);
    parts.push(`- Total comparisons: ${comparisons.length}`);
    parts.push(`- Responsive layouts: ${comparisons.filter(c => c.isResponsive).length}`);
    parts.push(`- Average differences: ${Math.round(comparisons.reduce((sum, c) => sum + c.differences, 0) / comparisons.length)}%`);

    parts.push(`\nIssue Summary:`);
    parts.push(`- Total issues: ${issues.length}`);
    parts.push(`- Critical: ${issues.filter(i => i.severity === 'critical').length}`);
    parts.push(`- High: ${issues.filter(i => i.severity === 'high').length}`);
    parts.push(`- Medium: ${issues.filter(i => i.severity === 'medium').length}`);
    parts.push(`- Low: ${issues.filter(i => i.severity === 'low').length}`);

    return parts.join('\n');
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    issues: ResponsiveIssue[],
    responsiveScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (responsiveScore < 70) {
      recommendations.push('Overall responsive design needs significant improvement');
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Fix ${criticalIssues.length} critical issues immediately`);
    }

    const layoutIssues = issues.filter(i => i.type === 'layout');
    if (layoutIssues.length > 0) {
      recommendations.push('Review and adjust CSS media queries for better layout responsiveness');
    }

    const overflowIssues = issues.filter(i => i.type === 'overflow');
    if (overflowIssues.length > 0) {
      recommendations.push('Ensure all content fits within viewport width');
    }

    const textIssues = issues.filter(i => i.type === 'text');
    if (textIssues.length > 0) {
      recommendations.push('Increase font sizes for mobile devices');
    }

    const imageIssues = issues.filter(i => i.type === 'image');
    if (imageIssues.length > 0) {
      recommendations.push('Implement responsive image techniques (srcset, picture element)');
    }

    if (recommendations.length === 0) {
      recommendations.push('Website is responsive and well-designed across all viewports');
    }

    return recommendations;
  }

  /**
   * Export report to JSON
   */
  exportToJSON(report: ResponsiveDesignReport): string {
    try {
      return JSON.stringify(report, null, 2);
    } catch (error) {
      throw new AppError(
        'JSON_EXPORT_FAILED',
        `Failed to export to JSON: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Export report to HTML
   */
  exportToHTML(report: ResponsiveDesignReport): string {
    try {
      return `
<!DOCTYPE html>
<html>
<head>
  <title>Responsive Design Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .score { font-size: 32px; font-weight: bold; color: #0066cc; }
    .section { margin: 20px 0; padding: 15px; border-left: 4px solid #0066cc; }
    .issue { margin: 10px 0; padding: 10px; background: #f5f5f5; }
    .critical { border-left: 4px solid #ff0000; }
    .high { border-left: 4px solid #ff9900; }
  </style>
</head>
<body>
  <h1>Responsive Design Report</h1>
  <p>URL: ${report.url}</p>
  <p>Generated: ${report.generatedAt.toISOString()}</p>
  
  <div class="section">
    <h2>Responsive Score: <span class="score">${report.responsiveScore}/100</span></h2>
  </div>
  
  <div class="section">
    <h2>Summary</h2>
    <pre>${report.summary}</pre>
  </div>
  
  <div class="section">
    <h2>Issues (${report.issues.length})</h2>
    ${report.issues.map(i => `
      <div class="issue ${i.severity}">
        <strong>${i.type.toUpperCase()}</strong> - ${i.severity.toUpperCase()}
        <p>${i.description}</p>
        <p><em>${i.recommendation}</em></p>
      </div>
    `).join('')}
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
    } catch (error) {
      throw new AppError(
        'HTML_EXPORT_FAILED',
        `Failed to export to HTML: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Export report to CSV
   */
  exportToCSV(report: ResponsiveDesignReport): string {
    try {
      const rows: string[] = [];
      rows.push('Metric,Value');
      rows.push(`URL,${report.url}`);
      rows.push(`Responsive Score,${report.responsiveScore}`);
      rows.push(`Total Viewports,${report.captures.captures.length}`);
      rows.push(`Total Comparisons,${report.comparisons.length}`);
      rows.push(`Total Issues,${report.issues.length}`);
      rows.push(`Critical Issues,${report.issues.filter(i => i.severity === 'critical').length}`);
      rows.push(`Breakpoints,${report.breakpoints.length}`);

      return rows.join('\n');
    } catch (error) {
      throw new AppError(
        'CSV_EXPORT_FAILED',
        `Failed to export to CSV: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Get report
   */
  getReport(reportId: string): ResponsiveDesignReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports
   */
  getAllReports(): ResponsiveDesignReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Clear reports
   */
  clearReports(): void {
    this.reports.clear();
  }
}

