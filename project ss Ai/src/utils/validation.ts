/**
 * Comprehensive Validation Utilities
 * Provides consistent input validation across all modules
 */

import { AppError, ErrorSeverity } from "./errorHandler";

/**
 * Validate required parameter
 */
export function validateRequired<T>(
  value: T | null | undefined,
  paramName: string,
  context?: string
): T {
  if (value === null || value === undefined) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} is required${context ? ` (${context})` : ""}`,
      ErrorSeverity.HIGH
    );
  }
  return value;
}

/**
 * Validate string parameter
 */
export function validateString(
  value: unknown,
  paramName: string,
  options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
  }
): string {
  if (typeof value !== "string") {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be a string`,
      ErrorSeverity.HIGH
    );
  }

  if (!options?.allowEmpty && value.trim().length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} cannot be empty`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.minLength && value.length < options.minLength) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be at least ${options.minLength} characters`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be at most ${options.maxLength} characters`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} format is invalid`,
      ErrorSeverity.HIGH
    );
  }

  return value;
}

/**
 * Validate number parameter
 */
export function validateNumber(
  value: unknown,
  paramName: string,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be a number`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.integer && !Number.isInteger(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be an integer`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.min !== undefined && value < options.min) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be at least ${options.min}`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.max !== undefined && value > options.max) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be at most ${options.max}`,
      ErrorSeverity.HIGH
    );
  }

  return value;
}

/**
 * Validate array parameter
 */
export function validateArray<T>(
  value: unknown,
  paramName: string,
  options?: {
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: unknown) => T;
  }
): T[] {
  if (!Array.isArray(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be an array`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.minLength && value.length < options.minLength) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must have at least ${options.minLength} items`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must have at most ${options.maxLength} items`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.itemValidator) {
    return value.map((item, index) => {
      try {
        return options.itemValidator!(item);
      } catch (error) {
        throw new AppError(
          "VALIDATION_ERROR",
          `${paramName}[${index}] is invalid`,
          ErrorSeverity.HIGH
        );
      }
    });
  }

  return value as T[];
}

/**
 * Validate object parameter
 */
export function validateObject<T extends Record<string, any>>(
  value: unknown,
  paramName: string,
  schema?: Record<string, (val: unknown) => any>
): T {
  if (typeof value !== "object" || value === null) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be an object`,
      ErrorSeverity.HIGH
    );
  }

  if (schema) {
    const validated: Record<string, any> = {};
    for (const [key, validator] of Object.entries(schema)) {
      if (key in value) {
        validated[key] = validator((value as Record<string, any>)[key]);
      }
    }
    return validated as T;
  }

  return value as T;
}

/**
 * Validate URL
 */
export function validateUrl(value: unknown, paramName: string = "URL"): string {
  const urlString = validateString(value, paramName);
  try {
    new URL(urlString);
    return urlString;
  } catch {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} is not a valid URL`,
      ErrorSeverity.HIGH
    );
  }
}

/**
 * Validate email
 */
export function validateEmail(value: unknown, paramName: string = "Email"): string {
  const email = validateString(value, paramName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} is not a valid email`,
      ErrorSeverity.HIGH
    );
  }
  return email;
}

/**
 * Validate buffer
 */
export function validateBuffer(
  value: unknown,
  paramName: string,
  options?: {
    minSize?: number;
    maxSize?: number;
  }
): Buffer {
  if (!Buffer.isBuffer(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be a Buffer`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.minSize && value.length < options.minSize) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be at least ${options.minSize} bytes`,
      ErrorSeverity.HIGH
    );
  }

  if (options?.maxSize && value.length > options.maxSize) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${paramName} must be at most ${options.maxSize} bytes`,
      ErrorSeverity.HIGH
    );
  }

  return value;
}

