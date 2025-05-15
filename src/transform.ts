import type { ElementType } from "./element";
import { Element } from "./element";
import type Node from "./node";

export interface TransformResult {
  element: ElementType;
  shouldGroup: boolean;
  skip?: boolean;
}

export interface TransformRule {
  match: (node: Node, context: TransformContext) => boolean;
  transform: (node: Node, context: TransformContext) => TransformResult;
}

export interface TransformContext {
  previousNode: Node | null;
  nextNode: Node | null;
  parentElement?: ElementType;
}

export const defaultRules: TransformRule[] = [
  // Transform empty paragraphs before list items into unordered lists
  {
    match: (node: Node, context: TransformContext) => {
      return (
        node.element === Element.PARAGRAPH &&
        node.value.trim() === "" &&
        context.nextNode?.element === Element.ITEM
      );
    },
    transform: () => ({
      element: Element.LIST,
      shouldGroup: false, // Already becoming a container
    }),
  },
  // Remove empty paragraphs before HTML blocks
  {
    match: (node: Node, context: TransformContext) => {
      return (
        node.element === Element.PARAGRAPH &&
        node.value.trim() === "" &&
        context.nextNode?.element === Element.HTML
      );
    },
    transform: () => ({
      element: Element.PARAGRAPH,
      shouldGroup: false,
      skip: true,
    }),
  },
  // Group list items under lists
  {
    match: (node: Node, context: TransformContext) => {
      return (
        node.element === Element.ITEM && context.parentElement !== Element.LIST
      );
    },
    transform: () => ({
      element: Element.ITEM,
      shouldGroup: true,
    }),
  },
  // Group sentences under paragraphs
  {
    match: (node: Node, context: TransformContext) => {
      return (
        node.element === Element.SENTENCE &&
        context.parentElement !== Element.PARAGRAPH &&
        context.parentElement !== Element.ITEM
      );
    },
    transform: () => ({
      element: Element.SENTENCE,
      shouldGroup: true,
    }),
  },
];

export class Transformer {
  constructor(private rules: TransformRule[] = defaultRules) {}

  transform(node: Node, context: TransformContext): TransformResult {
    for (const rule of this.rules) {
      if (rule.match(node, context)) {
        return rule.transform(node, context);
      }
    }
    return {
      element: node.element,
      shouldGroup: false,
    };
  }

  addRule(rule: TransformRule): void {
    this.rules.push(rule);
  }
}
