/**
 * Caching Utilities
 * Provides LRU cache and memoization for performance optimization
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

/**
 * LRU (Least Recently Used) Cache
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;
  private defaultTTL?: number;

  constructor(maxSize: number = 100, defaultTTL?: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V, ttl?: number): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as K | undefined;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }
}

/**
 * Memoization decorator
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: any[]) => string;
  }
): T {
  const cache = new LRUCache<string, any>(
    options?.maxSize || 100,
    options?.ttl
  );
  const keyGenerator =
    options?.keyGenerator || ((...args: any[]) => JSON.stringify(args));

  return ((...args: any[]) => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result, options?.ttl);
    return result;
  }) as T;
}

/**
 * Async memoization decorator
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: any[]) => string;
  }
): T {
  const cache = new LRUCache<string, any>(
    options?.maxSize || 100,
    options?.ttl
  );
  const keyGenerator =
    options?.keyGenerator || ((...args: any[]) => JSON.stringify(args));

  return (async (...args: any[]) => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, options?.ttl);
    return result;
  }) as T;
}

/**
 * Cache decorator for class methods
 */
export function Cacheable(options?: { maxSize?: number; ttl?: number }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new LRUCache<string, any>(
      options?.maxSize || 100,
      options?.ttl
    );

    descriptor.value = function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached !== undefined) {
        return cached;
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

/**
 * Async cache decorator for class methods
 */
export function CacheableAsync(options?: { maxSize?: number; ttl?: number }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new LRUCache<string, any>(
      options?.maxSize || 100,
      options?.ttl
    );

    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached !== undefined) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}
