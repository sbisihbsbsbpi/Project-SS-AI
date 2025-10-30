/**
 * Configuration module for screenshot capture system
 * Loads configuration from environment variables with sensible defaults
 */

export interface CaptureConfig {
  scrollDelay: number;
  overlapPercentage: number;
  maxScrolls: number;
  waitForImages: boolean;
  handleDynamicContent: boolean;
}

export interface TimeoutConfig {
  navigation: number;
  waitForContent: number;
  imageStitch: number;
  pageEvaluation: number;
}

export interface PerformanceConfig {
  maxMemoryMB: number;
  enableCaching: boolean;
  maxCacheSize: number;
  cacheTTL: number;
  enableStreaming: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxLogSize: number;
}

export interface AppConfig {
  capture: CaptureConfig;
  timeout: TimeoutConfig;
  performance: PerformanceConfig;
  logging: LoggingConfig;
}

/**
 * Parse environment variable as number with fallback
 */
function parseEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable as boolean
 */
function parseEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    capture: {
      scrollDelay: parseEnvNumber('SCROLL_DELAY', 500),
      overlapPercentage: parseEnvNumber('OVERLAP_PERCENTAGE', 10),
      maxScrolls: parseEnvNumber('MAX_SCROLLS', 100),
      waitForImages: parseEnvBoolean('WAIT_FOR_IMAGES', true),
      handleDynamicContent: parseEnvBoolean('HANDLE_DYNAMIC_CONTENT', true),
    },
    timeout: {
      navigation: parseEnvNumber('NAV_TIMEOUT', 30000),
      waitForContent: parseEnvNumber('CONTENT_TIMEOUT', 5000),
      imageStitch: parseEnvNumber('STITCH_TIMEOUT', 60000),
      pageEvaluation: parseEnvNumber('PAGE_EVAL_TIMEOUT', 10000),
    },
    performance: {
      maxMemoryMB: parseEnvNumber('MAX_MEMORY_MB', 512),
      enableCaching: parseEnvBoolean('ENABLE_CACHING', true),
      maxCacheSize: parseEnvNumber('MAX_CACHE_SIZE', 100),
      cacheTTL: parseEnvNumber('CACHE_TTL', 3600000),
      enableStreaming: parseEnvBoolean('ENABLE_STREAMING', true),
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      enableConsole: parseEnvBoolean('LOG_CONSOLE', true),
      enableFile: parseEnvBoolean('LOG_FILE', false),
      logDir: process.env.LOG_DIR || './logs',
      maxLogSize: parseEnvNumber('MAX_LOG_SIZE', 10485760),
    },
  };

  validateConfig(config);
  return config;
}

/**
 * Validate configuration values
 */
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (config.capture.scrollDelay < 0) {
    errors.push('SCROLL_DELAY must be >= 0');
  }
  if (config.capture.overlapPercentage < 0 || config.capture.overlapPercentage > 100) {
    errors.push('OVERLAP_PERCENTAGE must be between 0 and 100');
  }
  if (config.capture.maxScrolls < 1) {
    errors.push('MAX_SCROLLS must be >= 1');
  }

  if (config.timeout.navigation < 1000) {
    errors.push('NAV_TIMEOUT must be >= 1000ms');
  }
  if (config.timeout.imageStitch < 5000) {
    errors.push('STITCH_TIMEOUT must be >= 5000ms');
  }

  if (config.performance.maxMemoryMB < 128) {
    errors.push('MAX_MEMORY_MB must be >= 128');
  }
  if (config.performance.maxCacheSize < 1) {
    errors.push('MAX_CACHE_SIZE must be >= 1');
  }

  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logging.level)) {
    errors.push(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export const config = loadConfig();
