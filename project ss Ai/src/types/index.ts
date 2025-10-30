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
