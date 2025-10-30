import { Page, Browser } from 'playwright';
import { PageAnalyzer } from '../utils/pageAnalyzer';
import { ImageStitcher } from '../utils/imageStitcher';
import {
  FullPageCaptureOptions,
  FullPageCaptureResult,
  CapturedFrame,
  ScrollPosition,
} from '../types/index';

/**
 * FullPageCapture - Captures full-page screenshots with scroll and stitch
 */
export class FullPageCapture {
  private page: Page;
  private scrollDelay: number;
  private overlapPercentage: number;
  private maxScrolls: number;
  private handleDynamicContent: boolean;
  private waitForImages: boolean;

  constructor(page: Page, options: Partial<FullPageCaptureOptions> = {}) {
    this.page = page;
    this.scrollDelay = options.scrollDelay || 500;
    this.overlapPercentage = options.overlapPercentage || 10;
    this.maxScrolls = options.maxScrolls || 100;
    this.handleDynamicContent = options.handleDynamicContent !== false;
    this.waitForImages = options.waitForImages !== false;
  }

  /**
   * Capture full page
   */
  async captureFullPage(): Promise<FullPageCaptureResult> {
    const startTime = Date.now();

    try {
      // Analyze page
      const analysis = await PageAnalyzer.analyzePage(this.page);

      // Handle dynamic content
      if (this.handleDynamicContent) {
        await this.waitForDynamicContent();
      }

      // Capture frames
      const frames = await this.captureFrames(analysis.pageHeight);

      // Validate alignment
      const isAligned = await ImageStitcher.validateAlignment(frames);
      if (!isAligned) {
        const normalized = await ImageStitcher.normalizeFrames(
          frames,
          frames[0].width,
          frames[0].height
        );
        frames.splice(0, frames.length, ...normalized);
      }

      // Stitch frames
      const stitchStartTime = Date.now();
      const buffer = await ImageStitcher.stitchFrames(
        frames,
        this.overlapPercentage
      );
      const stitchingTime = Date.now() - stitchStartTime;

      const duration = Date.now() - startTime;

      return {
        success: true,
        url: this.page.url(),
        buffer,
        duration,
        timestamp: new Date().toISOString(),
        totalHeight: analysis.pageHeight,
        totalWidth: frames[0].width,
        frameCount: frames.length,
        stitchingTime,
        frames,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        url: this.page.url(),
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString(),
        totalHeight: 0,
        totalWidth: 0,
        frameCount: 0,
        stitchingTime: 0,
      };
    }
  }

  /**
   * Capture frames by scrolling
   */
  private async captureFrames(pageHeight: number): Promise<CapturedFrame[]> {
    const frames: CapturedFrame[] = [];
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error('No viewport size');

    const viewportHeight = viewport.height;
    const scrollDistance = viewportHeight * (1 - this.overlapPercentage / 100);

    let currentScroll = 0;
    let scrollCount = 0;

    while (currentScroll < pageHeight && scrollCount < this.maxScrolls) {
      // Scroll to position
      await this.page.evaluate((scroll) => {
        window.scrollTo(0, scroll);
      }, currentScroll);

      // Wait for content
      await this.page.waitForTimeout(this.scrollDelay);

      // Capture screenshot
      const buffer = await this.page.screenshot({ type: 'png' });

      frames.push({
        buffer: buffer as Buffer,
        scrollPosition: {
          x: 0,
          y: currentScroll,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        width: viewport.width,
        height: viewportHeight,
      });

      currentScroll += scrollDistance;
      scrollCount++;
    }

    // Scroll back to top
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    return frames;
  }

  /**
   * Wait for dynamic content to load
   */
  private async waitForDynamicContent(): Promise<void> {
    try {
      // Wait for images to load
      if (this.waitForImages) {
        await this.page.evaluate(() => {
          return Promise.all(
            Array.from(document.images).map((img) => {
              return new Promise((resolve) => {
                if (img.complete) {
                  resolve(null);
                } else {
                  img.onload = () => resolve(null);
                  img.onerror = () => resolve(null);
                }
              });
            })
          );
        });
      }

      // Wait for network to be idle
      await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(
        () => {}
      );
    } catch (error) {
      console.warn('Error waiting for dynamic content:', error);
    }
  }

  /**
   * Get scroll position
   */
  async getScrollPosition(): Promise<ScrollPosition> {
    const position = await this.page.evaluate(() => {
      return {
        x: window.scrollX,
        y: window.scrollY,
      };
    });

    return {
      ...position,
      timestamp: Date.now(),
    };
  }

  /**
   * Scroll to position
   */
  async scrollToPosition(x: number, y: number): Promise<void> {
    await this.page.evaluate(({ x, y }) => {
      window.scrollTo(x, y);
    }, { x, y });
  }
}
