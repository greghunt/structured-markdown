import { describe, it, expect, beforeEach } from "vitest";
import Node from "../node";
import { Element } from "../element";

describe("Node", () => {
  let rootNode: Node;
  let childNode: Node;

  beforeEach(() => {
    rootNode = new Node({
      value: "root",
      element: Element.ROOT,
    });
    childNode = new Node({
      value: "child",
      element: Element.PARAGRAPH,
    });
  });

  describe("construction", () => {
    it("creates a node with default values", () => {
      const node = new Node({
        value: "test",
        element: Element.PARAGRAPH,
      });

      expect(node.value).toBe("test");
      expect(node.element).toBe(Element.PARAGRAPH);
      expect(node.id).toBeDefined();
      expect(node.index).toBe(0);
      expect(node.metadata).toEqual({ line: 0, column: 0, length: 0 });
      expect(node.parent).toBeNull();
      expect(node.children).toEqual([]);
    });

    it("creates a node with custom values", () => {
      const metadata = { line: 1, column: 2, length: 3 };
      const node = new Node({
        value: "test",
        element: Element.PARAGRAPH,
        index: 5,
        metadata,
        id: "custom-id",
      });

      expect(node.value).toBe("test");
      expect(node.element).toBe(Element.PARAGRAPH);
      expect(node.id).toBe("custom-id");
      expect(node.index).toBe(5);
      expect(node.metadata).toEqual(metadata);
    });
  });

  describe("node properties", () => {
    it("gets content including children", () => {
      const parent = new Node({
        value: "parent",
        element: Element.PARAGRAPH,
      });
      const child1 = new Node({
        value: "child1",
        element: Element.SENTENCE,
      });
      const child2 = new Node({
        value: "child2",
        element: Element.SENTENCE,
      });

      parent.add(child1);
      parent.add(child2);

      expect(parent.content).toBe("parentchild1child2");
    });

    it("gets correct position in parent's children", () => {
      rootNode.add(new Node({ value: "first", element: Element.PARAGRAPH }));
      rootNode.add(childNode);
      rootNode.add(new Node({ value: "third", element: Element.PARAGRAPH }));

      expect(childNode.position).toBe(1);
    });
  });

  describe("node manipulation", () => {
    it("adds child node at the end", () => {
      rootNode.add(childNode);

      expect(rootNode.children).toHaveLength(1);
      expect(rootNode.children[0]).toBe(childNode);
      expect(childNode.parent).toBe(rootNode);
    });

    it("adds child node at specific position", () => {
      const first = new Node({ value: "first", element: Element.PARAGRAPH });
      const middle = new Node({ value: "middle", element: Element.PARAGRAPH });
      const last = new Node({ value: "last", element: Element.PARAGRAPH });

      rootNode.add(first);
      rootNode.add(last);
      rootNode.addChildAt(middle, 1);

      expect(rootNode.children).toHaveLength(3);
      expect(rootNode.children[1]).toBe(middle);
      expect(middle.parent).toBe(rootNode);
    });

    it("groups nodes by element when needed", () => {
      const sentence = new Node({
        value: "test sentence",
        element: Element.SENTENCE,
      });

      rootNode.add(sentence);

      // Sentence should be wrapped in a paragraph
      expect(rootNode.children[0].element).toBe(Element.PARAGRAPH);
      expect(rootNode.children[0].children[0]).toBe(sentence);
    });
  });

  describe("node operations", () => {
    it("splits node correctly", () => {
      const originalNode = new Node({
        value: "original",
        element: Element.PARAGRAPH,
      });
      rootNode.add(originalNode);

      const newNode = originalNode.updateAndSplit(
        { value: "updated", element: Element.PARAGRAPH },
        { value: "new", element: Element.PARAGRAPH },
      );

      expect(rootNode.children[0].value).toBe("updated");
      expect(rootNode.children[0].children[0]).toBe(newNode);
      expect(newNode.value).toBe("new");
    });

    it("deletes node and returns previous node", () => {
      const first = new Node({ value: "first", element: Element.PARAGRAPH });
      const second = new Node({ value: "second", element: Element.PARAGRAPH });

      rootNode.add(first);
      rootNode.add(second);

      const previousNode = second.delete();

      expect(rootNode.children).toHaveLength(1);
      expect(previousNode).toBe(first);
      expect(second.parent).toBeNull();
    });

    it("returns parent when deleting first child", () => {
      rootNode.add(childNode);
      const previousNode = childNode.delete();

      expect(previousNode).toBe(rootNode);
    });

    it("returns null when deleting root", () => {
      const previousNode = rootNode.delete();
      expect(previousNode).toBeNull();
    });
  });
});
