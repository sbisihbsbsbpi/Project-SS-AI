/**
 * Performance Monitoring Utilities
 * Tracks and optimizes performance metrics
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  lastTime: number;
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private timers: Map<string, number> = new Map();
  private static instance: PerformanceMonitor;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timer
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timer and record metric
   */
  endTimer(name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Record metric
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    return duration;
  }

  /**
   * Record metric directly
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);
  }

  /**
   * Get stats for metric
   */
  getStats(name: string): PerformanceStats | null {
    const metricList = this.metrics.get(name);
    if (!metricList || metricList.length === 0) {
      return null;
    }

    const durations = metricList.map((m) => m.duration);
    const totalTime = durations.reduce((a, b) => a + b, 0);

    return {
      count: metricList.length,
      totalTime,
      avgTime: totalTime / metricList.length,
      minTime: Math.min(...durations),
      maxTime: Math.max(...durations),
      lastTime: durations[durations.length - 1],
    };
  }

  /**
   * Get all stats
   */
  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};
    for (const [name] of this.metrics) {
      const stat = this.getStats(name);
      if (stat) {
        stats[name] = stat;
      }
    }
    return stats;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  /**
   * Clear specific metric
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
    this.timers.delete(name);
  }
}

/**
 * Performance decorator
 */
export function Timed(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = function (...args: any[]) {
      monitor.startTimer(metricName);
      try {
        const result = originalMethod.apply(this, args);
        monitor.endTimer(metricName);
        return result;
      } catch (error) {
        monitor.endTimer(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Async performance decorator
 */
export function TimedAsync(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      monitor.startTimer(metricName);
      try {
        const result = await originalMethod.apply(this, args);
        monitor.endTimer(metricName);
        return result;
      } catch (error) {
        monitor.endTimer(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  monitor.startTimer(name);
  try {
    const result = await fn();
    monitor.endTimer(name);
    return result;
  } catch (error) {
    monitor.endTimer(name);
    throw error;
  }
}

/**
 * Measure function execution time (sync)
 */
export function measure<T>(name: string, fn: () => T): T {
  const monitor = PerformanceMonitor.getInstance();
  monitor.startTimer(name);
  try {
    const result = fn();
    monitor.endTimer(name);
    return result;
  } catch (error) {
    monitor.endTimer(name);
    throw error;
  }
}

