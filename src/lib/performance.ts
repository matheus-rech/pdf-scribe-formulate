/**
 * Performance monitoring utilities
 *
 * Provides utilities for measuring and tracking application performance.
 * In production, these metrics can be sent to analytics services like
 * Google Analytics, Sentry, or custom monitoring solutions.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;

  /**
   * Measure the execution time of a synchronous function
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: { ...metadata, error: String(error) },
      });
      throw error;
    }
  }

  /**
   * Measure the execution time of an async function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: { ...metadata, error: String(error) },
      });
      throw error;
    }
  }

  /**
   * Start a manual performance mark
   */
  startMark(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * End a manual performance mark and record the metric
   */
  endMark(name: string, metadata?: Record<string, unknown>): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure?.duration || 0;

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata,
    });

    // Clean up marks and measures
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);

    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}${metric.unit}`, metric.metadata);
    }

    // In production, send to analytics service
    // this.sendToAnalytics(metric);
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(filterName?: string): PerformanceMetric[] {
    if (filterName) {
      return this.metrics.filter(m => m.name.includes(filterName));
    }
    return [...this.metrics];
  }

  /**
   * Get average value for a specific metric name
   */
  getAverage(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Send metrics to analytics service (implement as needed)
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Example: Send to Google Analytics
    // if (window.gtag) {
    //   window.gtag('event', 'performance_metric', {
    //     event_category: 'Performance',
    //     event_label: metric.name,
    //     value: Math.round(metric.value),
    //     ...metric.metadata
    //   });
    // }

    // Example: Send to custom backend
    // fetch('/api/metrics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric)
    // }).catch(console.error);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for React components to measure render performance
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric({
      name: `render_${componentName}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });
  };
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || propertyKey;

    descriptor.value = function (...args: unknown[]) {
      return performanceMonitor.measure(metricName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Monitor Web Vitals (Core Web Vitals)
 */
export function monitorWebVitals(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      performanceMonitor.recordMetric({
        name: 'web_vital_lcp',
        value: lastEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP monitoring not supported');
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry & { processingStart?: number }) => {
        const fid = entry.processingStart ? entry.processingStart - entry.startTime : 0;
        performanceMonitor.recordMetric({
          name: 'web_vital_fid',
          value: fid,
          unit: 'ms',
          timestamp: Date.now(),
        });
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID monitoring not supported');
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry & { value?: number; hadRecentInput?: boolean }) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value || 0;
        }
      });
      performanceMonitor.recordMetric({
        name: 'web_vital_cls',
        value: clsValue,
        unit: 'count',
        timestamp: Date.now(),
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS monitoring not supported');
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Monitor web vitals
  monitorWebVitals();

  // Log page load performance
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (perfData) {
      performanceMonitor.recordMetric({
        name: 'page_load',
        value: perfData.loadEventEnd - perfData.fetchStart,
        unit: 'ms',
        timestamp: Date.now(),
      });

      performanceMonitor.recordMetric({
        name: 'dom_content_loaded',
        value: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        unit: 'ms',
        timestamp: Date.now(),
      });

      performanceMonitor.recordMetric({
        name: 'first_paint',
        value: perfData.responseStart - perfData.fetchStart,
        unit: 'ms',
        timestamp: Date.now(),
      });
    }
  });
}
