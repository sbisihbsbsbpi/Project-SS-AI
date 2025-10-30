/**
 * Issue Detector - Detect common UI/UX issues
 */

import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorSeverity } from '../../utils/errorHandler';
import { DetectedElement, DetectedIssue, IssueDetectionResult, IssueType } from './types';

export class IssueDetector {
  private detectionResults: Map<string, IssueDetectionResult> = new Map();

  /**
   * Detect issues in elements
   */
  detectIssues(elements: DetectedElement[], imageWidth: number, imageHeight: number): IssueDetectionResult {
    try {
      const issues = this.analyzeElements(elements, imageWidth, imageHeight);
      const score = this.calculateIssueScore(issues);

      const result: IssueDetectionResult = {
        id: uuidv4(),
        issues,
        score,
        timestamp: new Date(),
      };

      this.detectionResults.set(result.id, result);
      return result;
    } catch (error) {
      throw new AppError(
        'ISSUE_DETECTION_FAILED',
        `Failed to detect issues: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Analyze elements for issues
   */
  private analyzeElements(
    elements: DetectedElement[],
    imageWidth: number,
    imageHeight: number
  ): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for overlapping elements
    const overlaps = this.findOverlappingElements(elements);
    overlaps.forEach(([elem1, elem2]) => {
      issues.push({
        id: uuidv4(),
        type: IssueType.OVERLAPPING_ELEMENTS,
        severity: 'high',
        title: 'Overlapping Elements',
        description: 'Two or more elements are overlapping, which may cause usability issues',
        affectedElements: [elem1, elem2],
        recommendation: 'Adjust element positioning to prevent overlaps',
        impact: 'Users may have difficulty interacting with overlapped elements',
      });
    });

    // Check for broken layout
    const brokenLayout = this.detectBrokenLayout(elements, imageWidth, imageHeight);
    if (brokenLayout) {
      issues.push(brokenLayout);
    }

    // Check for unreadable text
    const unreadableText = this.detectUnreadableText(elements);
    if (unreadableText) {
      issues.push(...unreadableText);
    }

    // Check for missing elements
    const missingElements = this.detectMissingElements(elements);
    if (missingElements) {
      issues.push(missingElements);
    }

    return issues;
  }

  /**
   * Detect broken layout
   */
  private detectBrokenLayout(
    elements: DetectedElement[],
    imageWidth: number,
    imageHeight: number
  ): DetectedIssue | null {
    // Check if elements extend beyond viewport
    const outOfBounds = elements.filter(e => {
      const box = e.boundingBox;
      return box.x + box.width > imageWidth || box.y + box.height > imageHeight;
    });

    if (outOfBounds.length > 0) {
      return {
        id: uuidv4(),
        type: IssueType.BROKEN_LAYOUT,
        severity: 'high',
        title: 'Broken Layout',
        description: 'Some elements extend beyond the viewport boundaries',
        affectedElements: outOfBounds,
        recommendation: 'Adjust element sizes and positions to fit within viewport',
        impact: 'Content may be cut off or inaccessible to users',
      };
    }

    return null;
  }

  /**
   * Detect unreadable text
   */
  private detectUnreadableText(elements: DetectedElement[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    const textElements = elements.filter(e => e.type === 'text' || e.type === 'heading');
    textElements.forEach(element => {
      // Check for very small text
      if (element.boundingBox.height < 12) {
        issues.push({
          id: uuidv4(),
          type: IssueType.UNREADABLE_TEXT,
          severity: 'medium',
          title: 'Small Text',
          description: 'Text is too small and may be difficult to read',
          affectedElements: [element],
          recommendation: 'Increase font size to at least 12px',
          impact: 'Users may have difficulty reading the content',
        });
      }
    });

    return issues;
  }

  /**
   * Detect missing elements
   */
  private detectMissingElements(elements: DetectedElement[]): DetectedIssue | null {
    // Check if page has no interactive elements
    const interactiveElements = elements.filter(
      e => e.type === 'button' || e.type === 'link' || e.type === 'input'
    );

    if (interactiveElements.length === 0) {
      return {
        id: uuidv4(),
        type: IssueType.MISSING_ELEMENT,
        severity: 'medium',
        title: 'No Interactive Elements',
        description: 'Page has no buttons, links, or input fields',
        affectedElements: [],
        recommendation: 'Add interactive elements to enable user engagement',
        impact: 'Users cannot interact with the page',
      };
    }

    return null;
  }

  /**
   * Find overlapping elements
   */
  private findOverlappingElements(elements: DetectedElement[]): Array<[DetectedElement, DetectedElement]> {
    const overlaps: Array<[DetectedElement, DetectedElement]> = [];

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        if (this.boxesOverlap(elements[i].boundingBox, elements[j].boundingBox)) {
          overlaps.push([elements[i], elements[j]]);
        }
      }
    }

    return overlaps;
  }

  /**
   * Check if two bounding boxes overlap
   */
  private boxesOverlap(box1: any, box2: any): boolean {
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }

  /**
   * Calculate issue score
   */
  private calculateIssueScore(issues: DetectedIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Get issues by type
   */
  getIssuesByType(result: IssueDetectionResult, type: IssueType): DetectedIssue[] {
    return result.issues.filter(issue => issue.type === type);
  }

  /**
   * Get critical issues
   */
  getCriticalIssues(result: IssueDetectionResult): DetectedIssue[] {
    return result.issues.filter(issue => issue.severity === 'critical');
  }

  /**
   * Clear cached results
   */
  clearResults(): void {
    this.detectionResults.clear();
  }
}

