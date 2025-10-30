/**
 * Screenshot Options
 */
export interface ScreenshotOptions {
  url: string;
  format?: 'png' | 'jpeg' | 'webp';
  fullPage?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  waitForSelector?: string;
  waitForTimeout?: number;
  emulateDevice?: string;
  cookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
  }>;
  headers?: Record<string, string>;
  userAgent?: string;
}

/**
 * Screenshot Result
 */
export interface ScreenshotResult {
  success: boolean;
  url: string;
  filePath?: string;
  buffer?: Buffer;
  error?: string;
  duration: number;
  timestamp: string;
}

/**
 * Batch Screenshot Request
 */
export interface BatchScreenshotRequest {
  urls: string[];
  options?: ScreenshotOptions;
}

/**
 * Batch Screenshot Result
 */
export interface BatchScreenshotResult {
  total: number;
  successful: number;
  failed: number;
  results: ScreenshotResult[];
  duration: number;
}

/**
 * API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Page Analysis Result
 */
export interface PageAnalysisResult {
  pageHeight: number;
  viewportHeight: number;
  scrollableElements: ScrollableElement[];
  fixedElements: FixedElement[];
  stickyElements: StickyElement[];
  hasInfiniteScroll: boolean;
  estimatedScrolls: number;
}

/**
 * Scrollable Element
 */
export interface ScrollableElement {
  selector: string;
  height: number;
  scrollHeight: number;
  isVisible: boolean;
}

/**
 * Fixed Element
 */
export interface FixedElement {
  selector: string;
  top: number;
  height: number;
  zIndex: number;
}

/**
 * Sticky Element
 */
export interface StickyElement {
  selector: string;
  top: number;
  height: number;
  zIndex: number;
}

/**
 * Scroll Position
 */
export interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Captured Frame
 */
export interface CapturedFrame {
  buffer: Buffer;
  scrollPosition: ScrollPosition;
  timestamp: number;
  width: number;
  height: number;
}

/**
 * Full Page Capture Options
 */
export interface FullPageCaptureOptions extends ScreenshotOptions {
  scrollDelay?: number;
  overlapPercentage?: number;
  maxScrolls?: number;
  handleDynamicContent?: boolean;
  waitForImages?: boolean;
  detectInfiniteScroll?: boolean;
}

/**
 * Full Page Capture Result
 */
export interface FullPageCaptureResult extends ScreenshotResult {
  totalHeight: number;
  totalWidth: number;
  frameCount: number;
  stitchingTime: number;
  frames?: CapturedFrame[];
}
