/**
 * Standardized Error Handler
 * Provides consistent error handling across all modules
 */

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorContext {
  module?: string;
  operation?: string;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

/**
 * Standardized application error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly isRecoverable: boolean;
  public readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    isRecoverable: boolean = false,
    retryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.context = { ...context, timestamp: new Date() };
    this.isRecoverable = isRecoverable;
    this.retryable = retryable;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      isRecoverable: this.isRecoverable,
      retryable: this.retryable,
    };
  }
}

/**
 * Error handler with recovery strategies
 */
export class ErrorHandler {
  private static errorStrategies: Map<string, (error: AppError) => string> = new Map();

  /**
   * Register error recovery strategy
   */
  static registerStrategy(errorCode: string, strategy: (error: AppError) => string): void {
    this.errorStrategies.set(errorCode, strategy);
  }

  /**
   * Get recovery strategy for error
   */
  static getRecoveryStrategy(error: AppError): string {
    const strategy = this.errorStrategies.get(error.code);
    if (strategy) {
      return strategy(error);
    }
    return "Check logs for more details";
  }

  /**
   * Handle error with logging and recovery
   */
  static async handleError(error: unknown, context?: ErrorContext): Promise<AppError> {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        "UNKNOWN_ERROR",
        error.message,
        ErrorSeverity.MEDIUM,
        context
      );
    } else {
      appError = new AppError(
        "UNKNOWN_ERROR",
        String(error),
        ErrorSeverity.MEDIUM,
        context
      );
    }

    // Log error
    this.logError(appError);

    return appError;
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: AppError): void {
    const logData = {
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: error.context,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error("[CRITICAL]", logData);
        break;
      case ErrorSeverity.HIGH:
        console.error("[ERROR]", logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn("[WARNING]", logData);
        break;
      case ErrorSeverity.LOW:
        console.log("[INFO]", logData);
        break;
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    return error.retryable;
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: AppError): boolean {
    return error.isRecoverable;
  }
}

/**
 * Retry handler with exponential backoff
 */
export class RetryHandler {
  /**
   * Retry operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 100,
    maxDelay: number = 10000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const delay = Math.min(
            initialDelay * Math.pow(2, attempt - 1),
            maxDelay
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error("Operation failed after retries");
  }

  /**
   * Sleep for specified duration
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

