/**
 * Element Detector - Detect UI elements in screenshots
 */

import { v4 as uuidv4 } from "uuid";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateNumber } from "../../utils/validation";
import { DetectedElement, ElementType, BoundingBox } from "./types";

export class ElementDetector {
  private detectedElements: Map<string, DetectedElement[]> = new Map();

  /**
   * Detect elements in image
   */
  detectElements(imageData: string | ArrayBuffer): DetectedElement[] {
    try {
      const elements = this.generateMockElements();
      const sessionId = uuidv4();
      this.detectedElements.set(sessionId, elements);
      return elements;
    } catch (error) {
      throw new AppError(
        "ELEMENT_DETECTION_FAILED",
        `Failed to detect elements: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Detect elements in specific region
   */
  detectElementsInRegion(
    imageData: string | ArrayBuffer,
    region: BoundingBox
  ): DetectedElement[] {
    try {
      validateNumber(region.x, "region.x", { min: 0 });
      validateNumber(region.y, "region.y", { min: 0 });
      validateNumber(region.width, "region.width", { min: 1 });
      validateNumber(region.height, "region.height", { min: 1 });

      const allElements = this.detectElements(imageData);

      // Filter elements within region
      return allElements.filter((element) => {
        const box = element.boundingBox;
        return (
          box.x >= region.x &&
          box.y >= region.y &&
          box.x + box.width <= region.x + region.width &&
          box.y + box.height <= region.y + region.height
        );
      });
    } catch (error) {
      throw new AppError(
        "ELEMENT_REGION_DETECTION_FAILED",
        `Failed to detect elements in region: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get elements by type
   */
  getElementsByType(
    elements: DetectedElement[],
    type: ElementType
  ): DetectedElement[] {
    return elements.filter((e) => e.type === type);
  }

  /**
   * Get elements by confidence threshold
   */
  getElementsByConfidence(
    elements: DetectedElement[],
    minConfidence: number = 0.8
  ): DetectedElement[] {
    validateNumber(minConfidence, "minConfidence", { min: 0, max: 1 });
    return elements.filter((e) => e.confidence >= minConfidence);
  }

  /**
   * Get interactive elements (buttons, links, inputs)
   */
  getInteractiveElements(elements: DetectedElement[]): DetectedElement[] {
    const interactiveTypes = [
      ElementType.BUTTON,
      ElementType.INPUT,
      ElementType.LINK,
    ];
    return elements.filter((e) => interactiveTypes.includes(e.type));
  }

  /**
   * Get text elements
   */
  getTextElements(elements: DetectedElement[]): DetectedElement[] {
    const textTypes = [
      ElementType.TEXT,
      ElementType.HEADING,
      ElementType.PARAGRAPH,
    ];
    return elements.filter((e) => textTypes.includes(e.type));
  }

  /**
   * Calculate element coverage percentage
   */
  calculateCoverage(
    elements: DetectedElement[],
    imageWidth: number,
    imageHeight: number
  ): number {
    validateNumber(imageWidth, "imageWidth", { min: 1 });
    validateNumber(imageHeight, "imageHeight", { min: 1 });

    const totalArea = imageWidth * imageHeight;
    const elementArea = elements.reduce((sum, e) => {
      return sum + e.boundingBox.width * e.boundingBox.height;
    }, 0);

    return (elementArea / totalArea) * 100;
  }

  /**
   * Get average element confidence
   */
  getAverageConfidence(elements: DetectedElement[]): number {
    if (elements.length === 0) return 0;
    const sum = elements.reduce((acc, e) => acc + e.confidence, 0);
    return sum / elements.length;
  }

  /**
   * Find overlapping elements
   */
  findOverlappingElements(
    elements: DetectedElement[]
  ): Array<[DetectedElement, DetectedElement]> {
    const overlaps: Array<[DetectedElement, DetectedElement]> = [];

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        if (
          this.boxesOverlap(elements[i].boundingBox, elements[j].boundingBox)
        ) {
          overlaps.push([elements[i], elements[j]]);
        }
      }
    }

    return overlaps;
  }

  /**
   * Clear cached elements
   */
  clearElements(): void {
    this.detectedElements.clear();
  }

  /**
   * Check if two bounding boxes overlap
   */
  private boxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }

  /**
   * Generate mock elements for testing
   */
  private generateMockElements(): DetectedElement[] {
    return [
      {
        id: uuidv4(),
        type: ElementType.HEADING,
        text: "Welcome to Our Site",
        boundingBox: { x: 10, y: 10, width: 300, height: 40 },
        confidence: 0.95,
      },
      {
        id: uuidv4(),
        type: ElementType.BUTTON,
        text: "Get Started",
        boundingBox: { x: 10, y: 60, width: 100, height: 40 },
        confidence: 0.92,
      },
      {
        id: uuidv4(),
        type: ElementType.LINK,
        text: "Learn More",
        boundingBox: { x: 120, y: 60, width: 80, height: 40 },
        confidence: 0.88,
      },
      {
        id: uuidv4(),
        type: ElementType.INPUT,
        text: "Email",
        boundingBox: { x: 10, y: 110, width: 200, height: 30 },
        confidence: 0.9,
      },
      {
        id: uuidv4(),
        type: ElementType.IMAGE,
        boundingBox: { x: 220, y: 110, width: 100, height: 100 },
        confidence: 0.85,
      },
    ];
  }
}
