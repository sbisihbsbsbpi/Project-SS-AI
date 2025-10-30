/**
 * Visual Regression Testing Module
 * Exports all visual regression testing components
 */

export * from './types';
export { BaselineManager } from './baselineManager';
export { ImageComparator } from './imageComparator';
export { DiffVisualizer } from './diffVisualizer';
export { ReportGenerator } from './reportGenerator';
export { HistoryTracker } from './historyTracker';

/**
 * Visual Regression Testing System
 * Provides complete visual regression testing capabilities
 */
export class VisualRegressionSystem {
  private baselineManager: any;
  private imageComparator: any;
  private diffVisualizer: any;
  private reportGenerator: any;
  private historyTracker: any;

  constructor(
    baselineDir?: string,
    reportDir?: string,
    historyDir?: string
  ) {
    const { BaselineManager } = require('./baselineManager');
    const { ImageComparator } = require('./imageComparator');
    const { DiffVisualizer } = require('./diffVisualizer');
    const { ReportGenerator } = require('./reportGenerator');
    const { HistoryTracker } = require('./historyTracker');

    this.baselineManager = new BaselineManager(baselineDir);
    this.imageComparator = new ImageComparator();
    this.diffVisualizer = new DiffVisualizer();
    this.reportGenerator = new ReportGenerator(reportDir);
    this.historyTracker = new HistoryTracker(historyDir);
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    await this.baselineManager.initialize();
    await this.reportGenerator.initialize();
    await this.historyTracker.initialize();
  }

  /**
   * Get baseline manager
   */
  getBaselineManager() {
    return this.baselineManager;
  }

  /**
   * Get image comparator
   */
  getImageComparator() {
    return this.imageComparator;
  }

  /**
   * Get diff visualizer
   */
  getDiffVisualizer() {
    return this.diffVisualizer;
  }

  /**
   * Get report generator
   */
  getReportGenerator() {
    return this.reportGenerator;
  }

  /**
   * Get history tracker
   */
  getHistoryTracker() {
    return this.historyTracker;
  }
}

