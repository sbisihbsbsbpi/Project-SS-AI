import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import { ScreenshotOptions, ScreenshotResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ScreenshotService {
  private browser: Browser | null = null;
  private browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium';

  /**
   * Initialize the browser
   */
  async initialize(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium'): Promise<void> {
    this.browserType = browserType;
    
    const launcher = {
      chromium,
      firefox,
      webkit
    }[browserType];

    this.browser = await launcher.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });

    console.log(`✅ Browser initialized: ${browserType}`);
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      if (!this.browser) {
        throw new Error('Browser not initialized. Call initialize() first.');
      }

      // Create a new page
      const page = await this.browser.newPage();

      try {
        // Set viewport if specified
        if (options.viewport) {
          await page.setViewportSize(options.viewport);
        }

        // Set user agent if specified
        if (options.userAgent) {
          await page.setUserAgent(options.userAgent);
        }

        // Set headers if specified
        if (options.headers) {
          await page.setExtraHTTPHeaders(options.headers);
        }

        // Set cookies if specified
        if (options.cookies && options.cookies.length > 0) {
          await page.context().addCookies(options.cookies as any);
        }

        // Navigate to URL
        await page.goto(options.url, { waitUntil: 'networkidle' });

        // Wait for selector if specified
        if (options.waitForSelector) {
          await page.waitForSelector(options.waitForSelector, {
            timeout: options.waitForTimeout || 5000
          });
        }

        // Wait for timeout if specified
        if (options.waitForTimeout && !options.waitForSelector) {
          await page.waitForTimeout(options.waitForTimeout);
        }

        // Take screenshot
        const format = options.format || 'png';
        const buffer = await page.screenshot({
          fullPage: options.fullPage !== false,
          type: format as 'png' | 'jpeg' | 'webp'
        });

        const duration = Date.now() - startTime;

        return {
          success: true,
          url: options.url,
          buffer,
          duration,
          timestamp
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        url: options.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp
      };
    }
  }

  /**
   * Save screenshot to file
   */
  async saveScreenshot(
    options: ScreenshotOptions,
    outputDir: string = './screenshots'
  ): Promise<ScreenshotResult> {
    const result = await this.takeScreenshot(options);

    if (result.success && result.buffer) {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate filename
      const urlHash = Buffer.from(options.url).toString('base64').substring(0, 8);
      const timestamp = Date.now();
      const format = options.format || 'png';
      const filename = `screenshot-${urlHash}-${timestamp}.${format}`;
      const filePath = path.join(outputDir, filename);

      // Save file
      fs.writeFileSync(filePath, result.buffer);
      result.filePath = filePath;
    }

    return result;
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ Browser closed');
    }
  }
}
