/**
 * Batch Report Generator
 * Generates reports in multiple formats: JSON, PDF, HTML, CSV
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger';
import {
  BatchJob,
  BatchReport,
  ReportSummary,
  ReportItem,
  IReportGenerator,
} from './types';

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
      Logger.info('ReportGenerator initialized');
    } catch (error) {
      Logger.error('Failed to initialize ReportGenerator', error);
      throw error;
    }
  }

  /**
   * Generate report from batch job
   */
  async generateReport(job: BatchJob): Promise<BatchReport> {
    try {
      const summary = this.calculateSummary(job);
      const items = this.createReportItems(job);

      const report: BatchReport = {
        id: uuidv4(),
        jobId: job.id,
        title: `Batch Report - ${new Date().toISOString()}`,
        summary,
        items,
        generatedAt: new Date(),
        exportFormats: ['json', 'pdf', 'html', 'csv'],
      };

      Logger.info(`Generated report: ${report.id}`);
      return report;
    } catch (error) {
      Logger.error('Failed to generate report', error);
      throw error;
    }
  }

  /**
   * Export report to JSON
   */
  async exportJSON(report: BatchReport): Promise<string> {
    try {
      const json = JSON.stringify(report, null, 2);
      const filePath = path.join(this.reportDir, `${report.id}.json`);
      await fs.writeFile(filePath, json);

      Logger.info(`Exported report to JSON: ${filePath}`);
      return json;
    } catch (error) {
      Logger.error('Failed to export JSON report', error);
      throw error;
    }
  }

  /**
   * Export report to PDF (simplified - returns buffer)
   */
  async exportPDF(report: BatchReport): Promise<Buffer> {
    try {
      // Simplified PDF generation - in production use a library like pdfkit
      const html = await this.exportHTML(report);
      const buffer = Buffer.from(html);

      Logger.info(`Exported report to PDF`);
      return buffer;
    } catch (error) {
      Logger.error('Failed to export PDF report', error);
      throw error;
    }
  }

  /**
   * Export report to HTML
   */
  async exportHTML(report: BatchReport): Promise<string> {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .stat { display: inline-block; margin-right: 30px; }
    .stat-label { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #4CAF50; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .success { color: green; }
    .failed { color: red; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <div class="summary">
    <div class="stat">
      <span class="stat-label">Total Items:</span> ${report.summary.totalItems}
    </div>
    <div class="stat">
      <span class="stat-label">Success:</span> <span class="success">${report.summary.successCount}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Failed:</span> <span class="failed">${report.summary.failureCount}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Success Rate:</span> ${report.summary.successRate.toFixed(2)}%
    </div>
    <div class="stat">
      <span class="stat-label">Total Duration:</span> ${(report.summary.totalDuration / 1000).toFixed(2)}s
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item ID</th>
        <th>URL</th>
        <th>Status</th>
        <th>Duration (ms)</th>
        <th>Error</th>
      </tr>
    </thead>
    <tbody>
      ${report.items.map(item => `
        <tr>
          <td>${item.itemId}</td>
          <td>${item.url}</td>
          <td class="${item.status}">${item.status}</td>
          <td>${item.duration}</td>
          <td>${item.error || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <p><small>Generated: ${report.generatedAt.toISOString()}</small></p>
</body>
</html>
      `;

      const filePath = path.join(this.reportDir, `${report.id}.html`);
      await fs.writeFile(filePath, html);

      Logger.info(`Exported report to HTML: ${filePath}`);
      return html;
    } catch (error) {
      Logger.error('Failed to export HTML report', error);
      throw error;
    }
  }

  /**
   * Export report to CSV
   */
  async exportCSV(report: BatchReport): Promise<string> {
    try {
      const headers = ['Item ID', 'URL', 'Status', 'Duration (ms)', 'Error'];
      const rows = report.items.map(item => [
        item.itemId,
        item.url,
        item.status,
        item.duration,
        item.error || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const filePath = path.join(this.reportDir, `${report.id}.csv`);
      await fs.writeFile(filePath, csv);

      Logger.info(`Exported report to CSV: ${filePath}`);
      return csv;
    } catch (error) {
      Logger.error('Failed to export CSV report', error);
      throw error;
    }
  }

  /**
   * Calculate report summary
   */
  private calculateSummary(job: BatchJob): ReportSummary {
    const successCount = job.results.filter(r => r.status === 'success').length;
    const failureCount = job.results.filter(r => r.status === 'failed').length;
    const totalDuration = job.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalItems: job.items.length,
      successCount,
      failureCount,
      successRate: (successCount / job.items.length) * 100,
      totalDuration,
      averageDuration: job.results.length > 0 ? totalDuration / job.results.length : 0,
    };
  }

  /**
   * Create report items from job results
   */
  private createReportItems(job: BatchJob): ReportItem[] {
    return job.results.map(result => ({
      itemId: result.itemId,
      url: job.items.find(i => i.id === result.itemId)?.url || 'unknown',
      status: result.status,
      duration: result.duration,
      output: result.output,
      error: result.error,
    }));
  }
}

