import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parse } from "../index";
import { Element } from "../element";
import Node from "../node";

describe("Parser Property Tests", () => {
  // Test that any valid text input produces a tree with a root node
  it("should always produce a tree with a root node", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = parse(text);
        expect(result.tree).toBeInstanceOf(Node);
        expect(result.tree.element).toBe(Element.ROOT);
      }),
    );
  });

  // Test that node indices are always increasing
  it("should create nodes with strictly increasing indices", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = parse(text);
        const indices: number[] = [];

        function collectIndices(node: Node) {
          indices.push(node.index);
          node.children.forEach(collectIndices);
        }

        collectIndices(result.tree);

        // Check if indices are strictly increasing
        for (let i = 1; i < indices.length; i++) {
          expect(indices[i]).toBeGreaterThan(indices[i - 1]);
        }
      }),
    );
  });

  // Test that parent-child relationships are always valid
  it("should maintain valid parent-child relationships", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = parse(text);

        function validateNode(node: Node) {
          node.children.forEach((child) => {
            // Check parent reference
            expect(child.parent).toBe(node);

            // Check element hierarchy
            const validRelation =
              node.element === Element.ROOT ||
              child.element === Element.ROOT ||
              node.children.indexOf(child) !== -1;
            expect(validRelation).toBe(true);

            validateNode(child);
          });
        }

        validateNode(result.tree);
      }),
    );
  });

  // Test that metrics are always present and valid
  it("should always produce valid metrics", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = parse(text);

        expect(result.metrics).toBeDefined();
        expect(result.metrics.total.time).toBeGreaterThanOrEqual(0);
        expect(result.metrics.tokens.count).toBeGreaterThanOrEqual(0);
        expect(result.metrics.nodes.count).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  // Test that tokens array length matches metrics
  it("should have consistent token count in metrics and tokens array", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = parse(text);
        expect(result.tokens.length).toBe(result.metrics.tokens.count);
      }),
    );
  });

  // Test specific content patterns
  it("should handle heading patterns correctly", () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom("#", " ", "a", "\n"), { minLength: 1 }),
        (text) => {
          const result = parse(text);

          function validateHeadings(node: Node) {
            if (node.element.startsWith("h") && node.element !== "html") {
              const level = parseInt(node.element.substring(1));
              expect(level).toBeGreaterThanOrEqual(1);
              expect(level).toBeLessThanOrEqual(6);
            }

            node.children.forEach(validateHeadings);
          }

          validateHeadings(result.tree);
        },
      ),
    );
  });
});
