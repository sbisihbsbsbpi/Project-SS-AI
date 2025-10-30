/**
 * Report Generator
 * Generates comparison reports in various formats
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../../utils/logger';
import { RegressionReport, ComparisonResult, IReportGenerator } from './types';
import { v4 as uuidv4 } from 'uuid';

export class ReportGenerator implements IReportGenerator {
  private reportDir: string;

  constructor(reportDir: string = './reports') {
    this.reportDir = reportDir;
  }

  /**
   * Initialize report generator
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.reportDir, { recursive: true });
      Logger.info('ReportGenerator initialized', { reportDir: this.reportDir });
    } catch (error) {
      Logger.error('Failed to initialize ReportGenerator', error);
      throw error;
    }
  }

  /**
   * Generate report from comparison results
   */
  async generateReport(results: ComparisonResult[]): Promise<RegressionReport> {
    try {
      const passedComparisons = results.filter((r) => r.isSimilar).length;
      const failedComparisons = results.length - passedComparisons;
      const averageDifference =
        results.reduce((sum, r) => sum + r.percentageDifference, 0) /
        results.length;

      const report: RegressionReport = {
        id: uuidv4(),
        timestamp: new Date(),
        baselineId: results[0]?.baselineId || '',
        baselineName: '',
        comparisonResults: results,
        totalComparisons: results.length,
        passedComparisons,
        failedComparisons,
        averageDifference,
      };

      Logger.info('Report generated', {
        totalComparisons: report.totalComparisons,
        passedComparisons,
        failedComparisons,
        averageDifference: averageDifference.toFixed(2),
      });

      return report;
    } catch (error) {
      Logger.error('Failed to generate report', error);
      throw error;
    }
  }

  /**
   * Export report to JSON format
   */
  async exportToJSON(report: RegressionReport): Promise<string> {
    try {
      const fileName = `report-${report.id}.json`;
      const filePath = path.join(this.reportDir, fileName);

      const jsonData = {
        id: report.id,
        timestamp: report.timestamp,
        baselineId: report.baselineId,
        baselineName: report.baselineName,
        totalComparisons: report.totalComparisons,
        passedComparisons: report.passedComparisons,
        failedComparisons: report.failedComparisons,
        averageDifference: report.averageDifference.toFixed(2),
        results: report.comparisonResults.map((r) => ({
          id: r.id,
          pixelDifferences: r.pixelDifferences,
          totalPixels: r.totalPixels,
          percentageDifference: r.percentageDifference.toFixed(2),
          isSimilar: r.isSimilar,
          threshold: r.threshold,
        })),
      };

      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

      Logger.info('Report exported to JSON', { filePath });

      return filePath;
    } catch (error) {
      Logger.error('Failed to export report to JSON', error);
      throw error;
    }
  }

  /**
   * Export report to HTML format
   */
  async exportToHTML(report: RegressionReport): Promise<string> {
    try {
      const fileName = `report-${report.id}.html`;
      const filePath = path.join(this.reportDir, fileName);

      const passRate = (
        (report.passedComparisons / report.totalComparisons) *
        100
      ).toFixed(1);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Regression Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .stat { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
    .stat-label { color: #666; font-size: 12px; margin-top: 5px; }
    .pass { color: #28a745; }
    .fail { color: #dc3545; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #007bff; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f5f5f5; }
    .timestamp { color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Visual Regression Report</h1>
    <p class="timestamp">Generated: ${report.timestamp.toISOString()}</p>
    
    <div class="summary">
      <div class="stat">
        <div class="stat-value">${report.totalComparisons}</div>
        <div class="stat-label">Total Comparisons</div>
      </div>
      <div class="stat">
        <div class="stat-value pass">${report.passedComparisons}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value fail">${report.failedComparisons}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${passRate}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
    </div>

    <h2>Comparison Results</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Pixel Differences</th>
          <th>Percentage</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.comparisonResults
          .map(
            (r) => `
        <tr>
          <td>${r.id}</td>
          <td>${r.pixelDifferences}</td>
          <td>${r.percentageDifference.toFixed(2)}%</td>
          <td class="${r.isSimilar ? 'pass' : 'fail'}">${
              r.isSimilar ? 'PASS' : 'FAIL'
            }</td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
      `;

      await fs.writeFile(filePath, html);

      Logger.info('Report exported to HTML', { filePath });

      return filePath;
    } catch (error) {
      Logger.error('Failed to export report to HTML', error);
      throw error;
    }
  }
}

