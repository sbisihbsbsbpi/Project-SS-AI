/**
 * Visual Regression Testing Types and Interfaces
 * Defines all types used in the visual regression testing module
 */

/**
 * Baseline metadata for version tracking
 */
export interface BaselineMetadata {
  id: string;
  name: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  tags?: string[];
  width: number;
  height: number;
  hash: string;
}

/**
 * Baseline image with metadata
 */
export interface Baseline {
  metadata: BaselineMetadata;
  imagePath: string;
  buffer?: Buffer;
}

/**
 * Comparison result between two images
 */
export interface ComparisonResult {
  id: string;
  baselineId: string;
  currentImagePath: string;
  timestamp: Date;
  pixelDifferences: number;
  totalPixels: number;
  percentageDifference: number;
  isSimilar: boolean;
  threshold: number;
  diffImagePath?: string;
  metadata?: Record<string, any>;
}

/**
 * Image comparison options
 */
export interface ComparisonOptions {
  threshold?: number; // 0-1, default 0.1 (10%)
  includeAA?: boolean; // Include anti-aliasing differences
  alpha?: number; // Alpha channel weight
  aaColor?: [number, number, number]; // Anti-aliasing color
  diffColor?: [number, number, number]; // Diff highlight color
}

/**
 * Diff visualization options
 */
export interface DiffVisualizationOptions {
  highlightColor?: [number, number, number]; // RGB color for differences
  opacity?: number; // Opacity of highlight (0-1)
  includeOverlay?: boolean; // Include overlay on original
  generateBeforeAfter?: boolean; // Generate side-by-side view
}

/**
 * Report data structure
 */
export interface RegressionReport {
  id: string;
  timestamp: Date;
  baselineId: string;
  baselineName: string;
  comparisonResults: ComparisonResult[];
  totalComparisons: number;
  passedComparisons: number;
  failedComparisons: number;
  averageDifference: number;
  reportPath?: string;
  htmlReportPath?: string;
  metadata?: Record<string, any>;
}

/**
 * History entry for tracking comparisons
 */
export interface HistoryEntry {
  id: string;
  timestamp: Date;
  baselineId: string;
  comparisonId: string;
  result: 'pass' | 'fail';
  percentageDifference: number;
  notes?: string;
}

/**
 * History query options
 */
export interface HistoryQueryOptions {
  baselineId?: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'pass' | 'fail';
  limit?: number;
  offset?: number;
}

/**
 * Baseline manager interface
 */
export interface IBaselineManager {
  saveBaseline(baseline: Baseline): Promise<void>;
  loadBaseline(id: string): Promise<Baseline | null>;
  getBaselines(): Promise<Baseline[]>;
  deleteBaseline(id: string): Promise<void>;
  updateBaseline(baseline: Baseline): Promise<void>;
  getBaselineHistory(id: string): Promise<BaselineMetadata[]>;
}

/**
 * Image comparator interface
 */
export interface IImageComparator {
  compare(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    options?: ComparisonOptions
  ): Promise<ComparisonResult>;
  generateDiffImage(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    diffBuffer: Buffer,
    options?: ComparisonOptions
  ): Promise<Buffer>;
}

/**
 * Diff visualizer interface
 */
export interface IDiffVisualizer {
  generateDiffVisualization(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    diffBuffer: Buffer,
    options?: DiffVisualizationOptions
  ): Promise<Buffer>;
  generateBeforeAfterView(
    baselineBuffer: Buffer,
    currentBuffer: Buffer
  ): Promise<Buffer>;
  generateOverlay(
    baselineBuffer: Buffer,
    diffBuffer: Buffer,
    opacity?: number
  ): Promise<Buffer>;
}

/**
 * Report generator interface
 */
export interface IReportGenerator {
  generateReport(results: ComparisonResult[]): Promise<RegressionReport>;
  exportToJSON(report: RegressionReport): Promise<string>;
  exportToHTML(report: RegressionReport): Promise<string>;
}

/**
 * History tracker interface
 */
export interface IHistoryTracker {
  addEntry(entry: HistoryEntry): Promise<void>;
  getHistory(options?: HistoryQueryOptions): Promise<HistoryEntry[]>;
  deleteOldEntries(daysToKeep: number): Promise<number>;
  clearHistory(baselineId?: string): Promise<void>;
}

