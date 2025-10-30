import { Page, Browser } from 'playwright';
import { PageAnalyzer } from '../utils/pageAnalyzer';
import { ImageStitcher } from '../utils/imageStitcher';
import { Logger } from '../utils/logger';
import { config } from '../config';
import {
  FullPageCaptureOptions,
  FullPageCaptureResult,
  CapturedFrame,
  ScrollPosition,
} from '../types/index';

/**
 * FullPageCapture - Captures full-page screenshots with scroll and stitch
 * Improved version with memory management and logging
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
    this.scrollDelay = options.scrollDelay ?? config.capture.scrollDelay;
    this.overlapPercentage = options.overlapPercentage ?? config.capture.overlapPercentage;
    this.maxScrolls = options.maxScrolls ?? config.capture.maxScrolls;
    this.handleDynamicContent = options.handleDynamicContent ?? config.capture.handleDynamicContent;
    this.waitForImages = options.waitForImages ?? config.capture.waitForImages;
    
    Logger.debug('FullPageCapture initialized', {
      scrollDelay: this.scrollDelay,
      overlapPercentage: this.overlapPercentage,
      maxScrolls: this.maxScrolls,
    });
  }

  /**
   * Capture full page
   */
  async captureFullPage(): Promise<FullPageCaptureResult> {
    const startTime = Date.now();
    Logger.info('Starting full page capture', { url: this.page.url() });

    try {
      // Analyze page
      Logger.debug('Analyzing page structure');
      const analysis = await PageAnalyzer.analyzePage(this.page);
      Logger.debug('Page analysis complete', {
        pageHeight: analysis.pageHeight,
        viewportHeight: analysis.viewportHeight,
        estimatedScrolls: analysis.estimatedScrolls,
      });

      // Handle dynamic content
      if (this.handleDynamicContent) {
        Logger.debug('Waiting for dynamic content');
        await this.waitForDynamicContent();
      }

      // Capture frames
      Logger.debug('Capturing frames');
      const frames = await this.captureFrames(analysis.pageHeight);
      Logger.info('Frames captured', { frameCount: frames.length });

      // Validate alignment
      Logger.debug('Validating frame alignment');
      const isAligned = await ImageStitcher.validateAlignment(frames);
      if (!isAligned) {
        Logger.warn('Frames misaligned, normalizing');
        const normalized = await ImageStitcher.normalizeFrames(
          frames,
          frames[0].width,
          frames[0].height
        );
        frames.splice(0, frames.length, ...normalized);
      }

      // Stitch frames
      Logger.debug('Stitching frames');
      const stitchStartTime = Date.now();
      const buffer = await ImageStitcher.stitchFrames(
        frames,
        this.overlapPercentage
      );
      const stitchingTime = Date.now() - stitchStartTime;
      Logger.debug('Frames stitched', { stitchingTime });

      const duration = Date.now() - startTime;
      Logger.info('Full page capture complete', {
        duration,
        frameCount: frames.length,
        totalHeight: analysis.pageHeight,
      });

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
      Logger.error('Full page capture failed', error as Error);
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
   * Capture frames by scrolling with memory management
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
      try {
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

        Logger.debug('Frame captured', {
          frameNumber: scrollCount + 1,
          scrollPosition: currentScroll,
          bufferSize: (buffer as Buffer).length,
        });

        currentScroll += scrollDistance;
        scrollCount++;

        // Memory check - log if using too much memory
        if (process.memoryUsage().heapUsed > config.performance.maxMemoryMB * 1024 * 1024) {
          Logger.warn('High memory usage detected', {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            maxAllowed: config.performance.maxMemoryMB,
          });
        }
      } catch (error) {
        Logger.error(`Error capturing frame ${scrollCount}`, error as Error);
        throw error;
      }
    }

    // Scroll back to top
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    return frames;
  }

  /**
   * Wait for dynamic content to load with error handling
   */
  private async waitForDynamicContent(): Promise<void> {
    try {
      // Wait for images to load
      if (this.waitForImages) {
        Logger.debug('Waiting for images to load');
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
        Logger.debug('Images loaded');
      }

      // Wait for network to be idle
      await this.page.waitForLoadState('networkidle', { timeout: config.timeout.waitForContent }).catch(
        () => {
          Logger.warn('Network idle timeout reached');
        }
      );
    } catch (error) {
      Logger.warn('Error waiting for dynamic content', error as Error);
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
