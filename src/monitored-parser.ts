import { parse as baseParser } from "./index";
import type { ParseResult } from "./index";
import { monitor, type ParseMetrics } from "./performance";

export interface MonitoredParseResult extends ParseResult {
  metrics: ParseMetrics;
}

export function parse(text: string): MonitoredParseResult {
  monitor.start();

  try {
    const result = baseParser(text);

    // Count nodes for metrics
    let nodeCount = 0;
    const countNodes = (node: any) => {
      nodeCount++;
      if (node.children) {
        node.children.forEach(countNodes);
      }
    };
    countNodes(result.tree);

    // Record metrics for each node
    for (let i = 0; i < nodeCount; i++) {
      monitor.nodeProcessed();
    }

    monitor.finishTokenizing(result.tokens.length);

    return {
      ...result,
      metrics: monitor.getMetrics(),
    };
  } catch (error) {
    monitor.finishTokenizing(0);
    throw error;
  }
}
