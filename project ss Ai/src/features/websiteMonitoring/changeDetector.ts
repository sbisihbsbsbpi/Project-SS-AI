/**
 * Change Detector - Detect changes between screenshots
 */

import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import { validateNumber } from '../../utils/validation';
import {
  ChangeDetectionResult,
  ChangedRegion,
  ScreenshotCapture,
} from './types';

export class ChangeDetector {
  private results: Map<string, ChangeDetectionResult> = new Map();
  private changeThreshold: number = 5; // percentage

  constructor(changeThreshold?: number) {
    if (changeThreshold !== undefined) {
      validateNumber(changeThreshold, 'changeThreshold', { min: 0, max: 100 });
      this.changeThreshold = changeThreshold;
    }
  }

  /**
   * Compare two screenshots
   */
  compareCaptures(
    previousCapture: ScreenshotCapture,
    currentCapture: ScreenshotCapture
  ): ChangeDetectionResult {
    try {
      const changePercentage = this.calculateChangePercentage(
        previousCapture,
        currentCapture
      );

      const hasChanges = changePercentage >= this.changeThreshold;
      const changeType = this.determineChangeType(previousCapture, currentCapture);
      const severity = this.determineSeverity(changePercentage);

      const changedRegions = this.detectChangedRegions(
        previousCapture,
        currentCapture
      );

      const result: ChangeDetectionResult = {
        id: uuidv4(),
        previousCaptureId: previousCapture.id,
        currentCaptureId: currentCapture.id,
        timestamp: new Date(),
        changePercentage,
        hasChanges,
        changedRegions,
        changeType,
        severity,
      };

      this.results.set(result.id, result);
      return result;
    } catch (error) {
      throw new AppError(
        'COMPARISON_FAILED',
        `Failed to compare captures: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Calculate change percentage
   */
  private calculateChangePercentage(
    previous: ScreenshotCapture,
    current: ScreenshotCapture
  ): number {
    // Simulate pixel-level comparison
    const totalPixels = previous.width * previous.height;
    const changedPixels = Math.floor(totalPixels * (Math.random() * 0.3)); // 0-30% random
    return (changedPixels / totalPixels) * 100;
  }

  /**
   * Detect changed regions
   */
  private detectChangedRegions(
    previous: ScreenshotCapture,
    current: ScreenshotCapture
  ): ChangedRegion[] {
    const regions: ChangedRegion[] = [];

    // Simulate region detection
    const regionCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < regionCount; i++) {
      regions.push({
        x: Math.floor(Math.random() * previous.width),
        y: Math.floor(Math.random() * previous.height),
        width: Math.floor(Math.random() * 200) + 50,
        height: Math.floor(Math.random() * 200) + 50,
        changePercentage: Math.floor(Math.random() * 100),
        type: ['added', 'removed', 'modified'][Math.floor(Math.random() * 3)] as any,
      });
    }

    return regions;
  }

  /**
   * Determine change type
   */
  private determineChangeType(
    previous: ScreenshotCapture,
    current: ScreenshotCapture
  ): 'layout' | 'content' | 'style' | 'mixed' | 'none' {
    const types = ['layout', 'content', 'style', 'mixed', 'none'];
    return types[Math.floor(Math.random() * types.length)] as any;
  }

  /**
   * Determine severity
   */
  private determineSeverity(
    changePercentage: number
  ): 'critical' | 'high' | 'medium' | 'low' | 'none' {
    if (changePercentage >= 50) return 'critical';
    if (changePercentage >= 30) return 'high';
    if (changePercentage >= 15) return 'medium';
    if (changePercentage >= 5) return 'low';
    return 'none';
  }

  /**
   * Get result
   */
  getResult(resultId: string): ChangeDetectionResult | undefined {
    return this.results.get(resultId);
  }

  /**
   * Get all results
   */
  getAllResults(): ChangeDetectionResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get results by severity
   */
  getResultsBySeverity(
    severity: 'critical' | 'high' | 'medium' | 'low' | 'none'
  ): ChangeDetectionResult[] {
    return Array.from(this.results.values()).filter(r => r.severity === severity);
  }

  /**
   * Get critical changes
   */
  getCriticalChanges(): ChangeDetectionResult[] {
    return this.getResultsBySeverity('critical');
  }

  /**
   * Get average change percentage
   */
  getAverageChangePercentage(): number {
    const results = Array.from(this.results.values());
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.changePercentage, 0);
    return sum / results.length;
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results.clear();
  }
}

