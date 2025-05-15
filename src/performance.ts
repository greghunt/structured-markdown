export interface ParseMetrics {
  tokens: {
    time: number;
    count: number;
  };
  nodes: {
    time: number;
    count: number;
    averageTimePerNode: number;
  };
  total: {
    time: number;
  };
}

class PerformanceMonitor {
  private tokenStart = 0;
  private nodeStart = 0;
  private tokenCount = 0;
  private nodeCount = 0;
  private nodeTime = 0;

  start(): void {
    this.tokenStart = performance.now();
    this.tokenCount = 0;
    this.nodeCount = 0;
    this.nodeTime = 0;
  }

  finishTokenizing(tokenCount: number): void {
    this.tokenCount = tokenCount;
    this.nodeStart = performance.now();
  }

  nodeProcessed(): void {
    this.nodeCount++;
  }

  getMetrics(): ParseMetrics {
    const end = performance.now();
    const tokenTime = this.nodeStart - this.tokenStart;
    this.nodeTime = end - this.nodeStart;
    const totalTime = end - this.tokenStart;

    return {
      tokens: {
        time: tokenTime,
        count: this.tokenCount,
      },
      nodes: {
        time: this.nodeTime,
        count: this.nodeCount,
        averageTimePerNode: this.nodeCount ? this.nodeTime / this.nodeCount : 0,
      },
      total: {
        time: totalTime,
      },
    };
  }
}

export const monitor = new PerformanceMonitor();
