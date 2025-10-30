/**
 * Structured logging utility for debugging and monitoring
 */

import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: string;
  stack?: string;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private static logFile: string | null = null;
  private static logBuffer: LogEntry[] = [];
  private static readonly MAX_BUFFER_SIZE = 100;

  /**
   * Initialize logger
   */
  static initialize(): void {
    if (config.logging.enableFile) {
      const logDir = config.logging.logDir;
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFile = path.join(logDir, `app-${timestamp}.log`);
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  static info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  static warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error | any): void {
    const errorData = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
    } : { error };
    this.log('error', message, errorData);
  }

  /**
   * Internal log method
   */
  private static log(level: LogLevel, message: string, data?: any): void {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(config.logging.level);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex < currentLevelIndex) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    if (config.logging.enableConsole) {
      this.logToConsole(entry);
    }

    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
    }

    if (config.logging.enableFile && this.logFile) {
      this.logToFile(entry);
    }
  }

  /**
   * Log to console with colors
   */
  private static logToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };

    const color = colors[entry.level];
    const prefix = `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}]${colors.reset}`;
    
    if (entry.data) {
      console.log(`${prefix} ${entry.message}`, entry.data);
    } else {
      console.log(`${prefix} ${entry.message}`);
    }
  }

  /**
   * Log to file
   */
  private static logToFile(entry: LogEntry): void {
    if (!this.logFile) return;

    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logLine);

      const stats = fs.statSync(this.logFile);
      if (stats.size > config.logging.maxLogSize) {
        this.rotateLogFile();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log file
   */
  private static rotateLogFile(): void {
    if (!this.logFile) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dir = path.dirname(this.logFile);
      const ext = path.extname(this.logFile);
      const name = path.basename(this.logFile, ext);
      const newName = `${name}-${timestamp}${ext}`;
      const newPath = path.join(dir, newName);

      fs.renameSync(this.logFile, newPath);
      this.logFile = path.join(dir, `app-${timestamp}${ext}`);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Flush log buffer to file
   */
  static flush(): void {
    if (!config.logging.enableFile || !this.logFile || this.logBuffer.length === 0) {
      return;
    }

    try {
      const logs = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      fs.appendFileSync(this.logFile, logs);
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush log buffer:', error);
    }
  }

  /**
   * Get all logs
   */
  static getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear logs
   */
  static clear(): void {
    this.logBuffer = [];
  }
}

Logger.initialize();
