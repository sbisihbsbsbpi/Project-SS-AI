/**
 * OCR Engine - Text extraction from images using Tesseract.js
 */

import { v4 as uuidv4 } from "uuid";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateString, validateNumber } from "../../utils/validation";
import { OCRResult, OCROptions, BoundingBox } from "./types";

export class OCREngine {
  private results: Map<string, OCRResult[]> = new Map();
  private defaultLanguages: string[] = ["eng"];
  private timeout: number = 30000; // 30 seconds

  constructor(options?: OCROptions) {
    if (options?.languages) {
      this.defaultLanguages = options.languages;
    }
    if (options?.timeout) {
      this.timeout = options.timeout;
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractText(
    imageData: string | ArrayBuffer,
    options?: OCROptions
  ): Promise<OCRResult[]> {
    try {
      validateString(
        typeof imageData === "string" ? imageData : "buffer",
        "imageData"
      );

      const languages = options?.languages || this.defaultLanguages;
      const results: OCRResult[] = [];

      // Simulate OCR processing (in production, would use Tesseract.js)
      const mockResults = this.generateMockOCRResults(imageData, languages);
      results.push(...mockResults);

      // Store results
      const sessionId = uuidv4();
      this.results.set(sessionId, results);

      return results;
    } catch (error) {
      throw new AppError(
        "OCR_EXTRACTION_FAILED",
        `Failed to extract text from image: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Extract text from specific region
   */
  async extractTextFromRegion(
    imageData: string | ArrayBuffer,
    region: BoundingBox,
    options?: OCROptions
  ): Promise<OCRResult[]> {
    try {
      validateNumber(region.x, "region.x", { min: 0 });
      validateNumber(region.y, "region.y", { min: 0 });
      validateNumber(region.width, "region.width", { min: 1 });
      validateNumber(region.height, "region.height", { min: 1 });

      const allResults = await this.extractText(imageData, options);

      // Filter results within region
      return allResults.filter((result) => {
        const box = result.boundingBox;
        return (
          box.x >= region.x &&
          box.y >= region.y &&
          box.x + box.width <= region.x + region.width &&
          box.y + box.height <= region.y + region.height
        );
      });
    } catch (error) {
      throw new AppError(
        "OCR_REGION_EXTRACTION_FAILED",
        `Failed to extract text from region: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get all extracted text
   */
  getAllText(results: OCRResult[]): string {
    return results.map((r) => r.text).join("\n");
  }

  /**
   * Get text by confidence threshold
   */
  getTextByConfidence(
    results: OCRResult[],
    minConfidence: number = 0.8
  ): OCRResult[] {
    validateNumber(minConfidence, "minConfidence", { min: 0, max: 1 });
    return results.filter((r) => r.confidence >= minConfidence);
  }

  /**
   * Get text by language
   */
  getTextByLanguage(results: OCRResult[], language: string): OCRResult[] {
    validateString(language, "language");
    return results.filter((r) => r.language === language);
  }

  /**
   * Calculate average confidence
   */
  getAverageConfidence(results: OCRResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.confidence, 0);
    return sum / results.length;
  }

  /**
   * Clear cached results
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Generate mock OCR results for testing
   */
  private generateMockOCRResults(
    imageData: string | ArrayBuffer,
    languages: string[]
  ): OCRResult[] {
    const mockTexts = [
      "Welcome to our website",
      "Click here to learn more",
      "Contact us for support",
      "Terms and Conditions",
      "Privacy Policy",
    ];

    return mockTexts.map((text, index) => ({
      id: uuidv4(),
      text,
      confidence: 0.85 + Math.random() * 0.15,
      boundingBox: {
        x: 10 + index * 50,
        y: 20 + index * 30,
        width: 100 + Math.random() * 50,
        height: 20 + Math.random() * 10,
      },
      language: languages[0] || "eng",
      timestamp: new Date(),
    }));
  }
}
