/**
 * Website Monitor - Periodic screenshot capture and monitoring
 */

import { v4 as uuidv4 } from "uuid";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateString, validateNumber } from "../../utils/validation";
import {
  MonitoringConfig,
  MonitoringSession,
  ScreenshotCapture,
  WebsiteMonitoringOptions,
} from "./types";

export class WebsiteMonitor {
  private sessions: Map<string, MonitoringSession> = new Map();
  private captures: Map<string, ScreenshotCapture> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    validateString(config.url, "url");
    validateNumber(config.interval, "interval", { min: 1000 });
    validateNumber(config.timeout, "timeout", { min: 1000 });
    validateNumber(config.retries, "retries", { min: 0, integer: true });

    this.config = config;
  }

  /**
   * Start monitoring session
   */
  startSession(): MonitoringSession {
    try {
      const session: MonitoringSession = {
        id: uuidv4(),
        url: this.config.url,
        startTime: new Date(),
        status: "active",
        captureCount: 0,
        changeCount: 0,
      };

      this.sessions.set(session.id, session);

      // Start periodic capture
      this.startPeriodicCapture(session.id);

      return session;
    } catch (error) {
      throw new AppError(
        "SESSION_START_FAILED",
        `Failed to start monitoring session: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Stop monitoring session
   */
  stopSession(sessionId: string): MonitoringSession | undefined {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new AppError(
          "SESSION_NOT_FOUND",
          `Session ${sessionId} not found`,
          ErrorSeverity.MEDIUM
        );
      }

      session.status = "stopped";
      session.endTime = new Date();

      // Clear interval
      const interval = this.intervals.get(sessionId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(sessionId);
      }

      return session;
    } catch (error) {
      throw new AppError(
        "SESSION_STOP_FAILED",
        `Failed to stop monitoring session: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Pause monitoring session
   */
  pauseSession(sessionId: string): MonitoringSession | undefined {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new AppError(
          "SESSION_NOT_FOUND",
          `Session ${sessionId} not found`,
          ErrorSeverity.MEDIUM
        );
      }

      session.status = "paused";

      // Clear interval
      const interval = this.intervals.get(sessionId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(sessionId);
      }

      return session;
    } catch (error) {
      throw new AppError(
        "SESSION_PAUSE_FAILED",
        `Failed to pause monitoring session: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Resume monitoring session
   */
  resumeSession(sessionId: string): MonitoringSession | undefined {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new AppError(
          "SESSION_NOT_FOUND",
          `Session ${sessionId} not found`,
          ErrorSeverity.MEDIUM
        );
      }

      session.status = "active";

      // Restart periodic capture
      this.startPeriodicCapture(sessionId);

      return session;
    } catch (error) {
      throw new AppError(
        "SESSION_RESUME_FAILED",
        `Failed to resume monitoring session: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Start periodic capture
   */
  private startPeriodicCapture(sessionId: string): void {
    const interval = setInterval(() => {
      this.captureScreenshot(sessionId);
    }, this.config.interval);

    this.intervals.set(sessionId, interval);
  }

  /**
   * Capture screenshot
   */
  captureScreenshot(sessionId: string): ScreenshotCapture {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new AppError(
          "SESSION_NOT_FOUND",
          `Session ${sessionId} not found`,
          ErrorSeverity.MEDIUM
        );
      }

      const capture: ScreenshotCapture = {
        id: uuidv4(),
        sessionId,
        timestamp: new Date(),
        imageUrl: this.config.url,
        imageData: "mock-screenshot-data",
        width: 1920,
        height: 1080,
        fileSize: 1024 * 100, // 100KB
      };

      this.captures.set(capture.id, capture);
      session.captureCount++;

      return capture;
    } catch (error) {
      throw new AppError(
        "CAPTURE_FAILED",
        `Failed to capture screenshot: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get session
   */
  getSession(sessionId: string): MonitoringSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): MonitoringSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get captures for session
   */
  getSessionCaptures(sessionId: string): ScreenshotCapture[] {
    return Array.from(this.captures.values()).filter(
      (c) => c.sessionId === sessionId
    );
  }

  /**
   * Get capture
   */
  getCapture(captureId: string): ScreenshotCapture | undefined {
    return this.captures.get(captureId);
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.stopSession(sessionId);
    this.sessions.delete(sessionId);

    // Delete captures for this session
    const captureIds = Array.from(this.captures.entries())
      .filter(([_, c]) => c.sessionId === sessionId)
      .map(([id, _]) => id);

    captureIds.forEach((id) => this.captures.delete(id));
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.sessions.clear();
    this.captures.clear();
  }
}
