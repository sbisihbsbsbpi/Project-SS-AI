import { Page } from 'playwright';
import { Logger } from './logger';
import {
  PageAnalysisResult,
  ScrollableElement,
  FixedElement,
  StickyElement,
} from '../types/index';

/**
 * PageAnalyzer - Analyzes page structure for full-page capture
 * Optimized version with error handling and caching
 */
export class PageAnalyzer {
  private static cache = new Map<string, PageAnalysisResult>();
  private static readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Analyze page structure with caching
   */
  static async analyzePage(page: Page): Promise<PageAnalysisResult> {
    const url = page.url();
    const cached = this.cache.get(url);
    
    if (cached) {
      Logger.debug('Using cached page analysis', { url });
      return cached;
    }

    Logger.debug('Analyzing page structure', { url });
    
    try {
      const pageHeight = await this.getPageHeight(page);
      const viewportHeight = await this.getViewportHeight(page);
      const scrollableElements = await this.detectScrollableElements(page);
      const fixedElements = await this.detectFixedElements(page);
      const stickyElements = await this.detectStickyElements(page);
      const hasInfiniteScroll = await this.detectInfiniteScroll(page);
      const estimatedScrolls = Math.ceil(pageHeight / viewportHeight);

      const result: PageAnalysisResult = {
        pageHeight,
        viewportHeight,
        scrollableElements,
        fixedElements,
        stickyElements,
        hasInfiniteScroll,
        estimatedScrolls,
      };

      // Cache result
      this.cache.set(url, result);
      setTimeout(() => this.cache.delete(url), this.CACHE_TTL);

      Logger.debug('Page analysis complete', {
        pageHeight,
        viewportHeight,
        estimatedScrolls,
        hasInfiniteScroll,
      });

      return result;
    } catch (error) {
      Logger.error('Page analysis failed', error as Error);
      throw error;
    }
  }

  /**
   * Get page height with error handling
   */
  static async getPageHeight(page: Page): Promise<number> {
    try {
      return await page.evaluate(() => {
        return Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          document.documentElement.clientHeight,
          document.body.clientHeight
        );
      });
    } catch (error) {
      Logger.warn('Failed to get page height, using default', error as Error);
      return 1000; // Default fallback
    }
  }

  /**
   * Get viewport height with error handling
   */
  static async getViewportHeight(page: Page): Promise<number> {
    try {
      const viewport = page.viewportSize();
      return viewport?.height || 768;
    } catch (error) {
      Logger.warn('Failed to get viewport height, using default', error as Error);
      return 768;
    }
  }

  /**
   * Detect scrollable elements - OPTIMIZED
   * Uses specific selectors instead of querySelectorAll('*')
   */
  static async detectScrollableElements(page: Page): Promise<ScrollableElement[]> {
    try {
      return await page.evaluate(() => {
        const scrollableElements: ScrollableElement[] = [];
        
        // Use more specific selectors instead of '*'
        const selectors = [
          '[style*="overflow"]',
          '.scrollable',
          '[class*="scroll"]',
          'div[style*="height"]',
        ];

        const checked = new Set<HTMLElement>();

        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            
            for (let i = 0; i < Math.min(elements.length, 50); i++) {
              const el = elements[i] as HTMLElement;
              
              if (checked.has(el)) continue;
              checked.add(el);

              const style = window.getComputedStyle(el);
              const overflow = style.overflow || style.overflowY;

              if (
                (overflow === 'auto' || overflow === 'scroll') &&
                el.scrollHeight > el.clientHeight
              ) {
                scrollableElements.push({
                  selector: el.className || el.tagName,
                  height: el.clientHeight,
                  scrollHeight: el.scrollHeight,
                  isVisible: el.offsetParent !== null,
                });
              }
            }
          } catch (e) {
            // Skip invalid selectors
          }
        }

        return scrollableElements;
      });
    } catch (error) {
      Logger.warn('Failed to detect scrollable elements', error as Error);
      return [];
    }
  }

  /**
   * Detect fixed elements - OPTIMIZED
   */
  static async detectFixedElements(page: Page): Promise<FixedElement[]> {
    try {
      return await page.evaluate(() => {
        const fixedElements: FixedElement[] = [];
        
        // Use more specific selectors
        const selectors = [
          '[style*="position: fixed"]',
          '.fixed',
          '[class*="fixed"]',
          'header',
          'nav',
        ];

        const checked = new Set<HTMLElement>();

        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            
            for (let i = 0; i < Math.min(elements.length, 20); i++) {
              const el = elements[i] as HTMLElement;
              
              if (checked.has(el)) continue;
              checked.add(el);

              const style = window.getComputedStyle(el);

              if (style.position === 'fixed' && el.offsetParent !== null) {
                const topStr = style.top;
                const top = topStr && topStr !== 'auto' ? parseInt(topStr) : 0;
                
                fixedElements.push({
                  selector: el.className || el.tagName,
                  top: isNaN(top) ? 0 : top,
                  height: el.offsetHeight,
                  zIndex: parseInt(style.zIndex) || 0,
                });
              }
            }
          } catch (e) {
            // Skip invalid selectors
          }
        }

        return fixedElements;
      });
    } catch (error) {
      Logger.warn('Failed to detect fixed elements', error as Error);
      return [];
    }
  }

  /**
   * Detect sticky elements - OPTIMIZED
   */
  static async detectStickyElements(page: Page): Promise<StickyElement[]> {
    try {
      return await page.evaluate(() => {
        const stickyElements: StickyElement[] = [];
        
        // Use more specific selectors
        const selectors = [
          '[style*="position: sticky"]',
          '.sticky',
          '[class*="sticky"]',
        ];

        const checked = new Set<HTMLElement>();

        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            
            for (let i = 0; i < Math.min(elements.length, 20); i++) {
              const el = elements[i] as HTMLElement;
              
              if (checked.has(el)) continue;
              checked.add(el);

              const style = window.getComputedStyle(el);

              if (style.position === 'sticky' && el.offsetParent !== null) {
                const topStr = style.top;
                const top = topStr && topStr !== 'auto' ? parseInt(topStr) : 0;
                
                stickyElements.push({
                  selector: el.className || el.tagName,
                  top: isNaN(top) ? 0 : top,
                  height: el.offsetHeight,
                  zIndex: parseInt(style.zIndex) || 0,
                });
              }
            }
          } catch (e) {
            // Skip invalid selectors
          }
        }

        return stickyElements;
      });
    } catch (error) {
      Logger.warn('Failed to detect sticky elements', error as Error);
      return [];
    }
  }

  /**
   * Detect infinite scroll with improved detection
   */
  static async detectInfiniteScroll(page: Page): Promise<boolean> {
    try {
      return await page.evaluate(() => {
        const hasIntersectionObserver = 'IntersectionObserver' in window;
        const hasMutationObserver = 'MutationObserver' in window;
        
        // Check for common infinite scroll patterns
        const hasScrollListener = window.onscroll !== null;
        const hasLoadMore = document.querySelector('[class*="load-more"]') !== null;
        const hasInfiniteScroll = document.querySelector('[class*="infinite"]') !== null;
        
        return hasIntersectionObserver && (hasScrollListener || hasMutationObserver || hasLoadMore || hasInfiniteScroll);
      });
    } catch (error) {
      Logger.warn('Failed to detect infinite scroll', error as Error);
      return false;
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
    Logger.debug('Page analysis cache cleared');
  }
}
