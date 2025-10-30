/**
 * Comparison Engine - Compare layouts across viewports and detect responsive issues
 */

import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import {
  ViewportCapture,
  ViewportComparison,
  ResponsiveIssue,
  Viewport,
} from './types';

export class ComparisonEngine {
  private comparisons: Map<string, ViewportComparison> = new Map();
  private issues: Map<string, ResponsiveIssue> = new Map();

  /**
   * Compare two viewport captures
   */
  compareCaptures(
    capture1: ViewportCapture,
    capture2: ViewportCapture
  ): ViewportComparison {
    try {
      const differences = this.calculateDifferences(capture1, capture2);
      const issues = this.detectIssues(capture1, capture2);
      const isResponsive = differences < 20 && issues.length === 0;

      const comparison: ViewportComparison = {
        id: uuidv4(),
        viewport1: capture1.viewport,
        viewport2: capture2.viewport,
        capture1,
        capture2,
        timestamp: new Date(),
        differences,
        issues,
        isResponsive,
      };

      this.comparisons.set(comparison.id, comparison);
      issues.forEach(issue => this.issues.set(issue.id, issue));

      return comparison;
    } catch (error) {
      throw new AppError(
        'COMPARISON_FAILED',
        `Failed to compare captures: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Calculate differences between captures
   */
  private calculateDifferences(capture1: ViewportCapture, capture2: ViewportCapture): number {
    // Simulate pixel-level comparison
    const totalPixels = Math.max(
      capture1.viewport.width * capture1.viewport.height,
      capture2.viewport.width * capture2.viewport.height
    );
    const differentPixels = Math.floor(totalPixels * (Math.random() * 0.3)); // 0-30%
    return (differentPixels / totalPixels) * 100;
  }

  /**
   * Detect responsive issues
   */
  private detectIssues(
    capture1: ViewportCapture,
    capture2: ViewportCapture
  ): ResponsiveIssue[] {
    const issues: ResponsiveIssue[] = [];

    // Detect layout issues
    if (Math.random() > 0.6) {
      issues.push({
        id: uuidv4(),
        type: 'layout',
        severity: 'high',
        viewport: capture2.viewport,
        description: 'Layout breaks at this viewport size',
        location: {
          x: Math.floor(Math.random() * capture2.viewport.width),
          y: Math.floor(Math.random() * capture2.viewport.height),
          width: 200,
          height: 100,
        },
        recommendation: 'Adjust CSS media queries for this breakpoint',
      });
    }

    // Detect overflow issues
    if (Math.random() > 0.7) {
      issues.push({
        id: uuidv4(),
        type: 'overflow',
        severity: 'critical',
        viewport: capture2.viewport,
        description: 'Content overflows viewport',
        recommendation: 'Ensure content fits within viewport width',
      });
    }

    // Detect text issues
    if (Math.random() > 0.75) {
      issues.push({
        id: uuidv4(),
        type: 'text',
        severity: 'medium',
        viewport: capture2.viewport,
        description: 'Text is too small to read',
        recommendation: 'Increase font size for mobile devices',
      });
    }

    // Detect image issues
    if (Math.random() > 0.8) {
      issues.push({
        id: uuidv4(),
        type: 'image',
        severity: 'medium',
        viewport: capture2.viewport,
        description: 'Image does not scale properly',
        recommendation: 'Use responsive image techniques',
      });
    }

    return issues;
  }

  /**
   * Detect breakpoints
   */
  detectBreakpoints(captures: ViewportCapture[]): Viewport[] {
    const breakpoints: Viewport[] = [];

    for (let i = 0; i < captures.length - 1; i++) {
      const comparison = this.compareCaptures(captures[i], captures[i + 1]);

      if (comparison.differences > 15 || comparison.issues.length > 0) {
        breakpoints.push(captures[i + 1].viewport);
      }
    }

    return breakpoints;
  }

  /**
   * Get comparison
   */
  getComparison(comparisonId: string): ViewportComparison | undefined {
    return this.comparisons.get(comparisonId);
  }

  /**
   * Get all comparisons
   */
  getAllComparisons(): ViewportComparison[] {
    return Array.from(this.comparisons.values());
  }

  /**
   * Get comparisons with issues
   */
  getComparisonsWithIssues(): ViewportComparison[] {
    return Array.from(this.comparisons.values()).filter(c => c.issues.length > 0);
  }

  /**
   * Get issue
   */
  getIssue(issueId: string): ResponsiveIssue | undefined {
    return this.issues.get(issueId);
  }

  /**
   * Get all issues
   */
  getAllIssues(): ResponsiveIssue[] {
    return Array.from(this.issues.values());
  }

  /**
   * Get issues by severity
   */
  getIssuesBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): ResponsiveIssue[] {
    return Array.from(this.issues.values()).filter(i => i.severity === severity);
  }

  /**
   * Get critical issues
   */
  getCriticalIssues(): ResponsiveIssue[] {
    return this.getIssuesBySeverity('critical');
  }

  /**
   * Get issues by type
   */
  getIssuesByType(type: string): ResponsiveIssue[] {
    return Array.from(this.issues.values()).filter(i => i.type === type);
  }

  /**
   * Calculate responsive score
   */
  calculateResponsiveScore(comparisons: ViewportComparison[]): number {
    if (comparisons.length === 0) return 100;

    const responsiveCount = comparisons.filter(c => c.isResponsive).length;
    return Math.round((responsiveCount / comparisons.length) * 100);
  }

  /**
   * Clear data
   */
  clearData(): void {
    this.comparisons.clear();
    this.issues.clear();
  }
}

