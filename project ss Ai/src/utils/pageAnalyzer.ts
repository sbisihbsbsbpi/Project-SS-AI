import { Page } from 'playwright';
import {
  PageAnalysisResult,
  ScrollableElement,
  FixedElement,
  StickyElement,
} from '../types/index';

/**
 * PageAnalyzer - Analyzes page structure for full-page capture
 * Detects page height, scrollable elements, fixed/sticky elements
 */
export class PageAnalyzer {
  /**
   * Analyze page structure
   */
  static async analyzePage(page: Page): Promise<PageAnalysisResult> {
    const pageHeight = await this.getPageHeight(page);
    const viewportHeight = await this.getViewportHeight(page);
    const scrollableElements = await this.detectScrollableElements(page);
    const fixedElements = await this.detectFixedElements(page);
    const stickyElements = await this.detectStickyElements(page);
    const hasInfiniteScroll = await this.detectInfiniteScroll(page);
    const estimatedScrolls = Math.ceil(pageHeight / viewportHeight);

    return {
      pageHeight,
      viewportHeight,
      scrollableElements,
      fixedElements,
      stickyElements,
      hasInfiniteScroll,
      estimatedScrolls,
    };
  }

  /**
   * Get page height
   */
  static async getPageHeight(page: Page): Promise<number> {
    return await page.evaluate(() => {
      return Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.clientHeight,
        document.body.clientHeight
      );
    });
  }

  /**
   * Get viewport height
   */
  static async getViewportHeight(page: Page): Promise<number> {
    const viewport = page.viewportSize();
    return viewport?.height || 768;
  }

  /**
   * Detect scrollable elements
   */
  static async detectScrollableElements(page: Page): Promise<ScrollableElement[]> {
    return await page.evaluate(() => {
      const scrollableElements: ScrollableElement[] = [];
      const elements = document.querySelectorAll('*');

      elements.forEach((el) => {
        const element = el as HTMLElement;
        const style = window.getComputedStyle(element);
        const overflow = style.overflow || style.overflowY;

        if (
          (overflow === 'auto' || overflow === 'scroll') &&
          element.scrollHeight > element.clientHeight
        ) {
          scrollableElements.push({
            selector: '',
            height: element.clientHeight,
            scrollHeight: element.scrollHeight,
            isVisible: element.offsetParent !== null,
          });
        }
      });

      return scrollableElements;
    });
  }

  /**
   * Detect fixed elements
   */
  static async detectFixedElements(page: Page): Promise<FixedElement[]> {
    return await page.evaluate(() => {
      const fixedElements: FixedElement[] = [];
      const elements = document.querySelectorAll('*');

      elements.forEach((el) => {
        const element = el as HTMLElement;
        const style = window.getComputedStyle(element);

        if (style.position === 'fixed' && element.offsetParent !== null) {
          fixedElements.push({
            selector: '',
            top: parseInt(style.top) || 0,
            height: element.offsetHeight,
            zIndex: parseInt(style.zIndex) || 0,
          });
        }
      });

      return fixedElements;
    });
  }

  /**
   * Detect sticky elements
   */
  static async detectStickyElements(page: Page): Promise<StickyElement[]> {
    return await page.evaluate(() => {
      const stickyElements: StickyElement[] = [];
      const elements = document.querySelectorAll('*');

      elements.forEach((el) => {
        const element = el as HTMLElement;
        const style = window.getComputedStyle(element);

        if (style.position === 'sticky' && element.offsetParent !== null) {
          stickyElements.push({
            selector: '',
            top: parseInt(style.top) || 0,
            height: element.offsetHeight,
            zIndex: parseInt(style.zIndex) || 0,
          });
        }
      });

      return stickyElements;
    });
  }

  /**
   * Detect infinite scroll
   */
  static async detectInfiniteScroll(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      const hasIntersectionObserver = 'IntersectionObserver' in window;
      const hasMutationObserver = 'MutationObserver' in window;
      const hasScrollListener = window.onscroll !== null;
      return hasIntersectionObserver && (hasScrollListener || hasMutationObserver);
    });
  }
}
