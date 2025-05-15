import { describe, it, expect } from "vitest";
import tokenize from "../tokenize";
import { Element } from "../element";

describe("tokenize", () => {
  it("should tokenize a simple sentence", () => {
    const input = "Hello world.";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 12,
        value: "Hello world.",
        element: Element.SENTENCE,
      },
    ]);
  });

  it("should tokenize multiple sentences with different delimiters", () => {
    const input = "First sentence. Second sentence! Third sentence?";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 14,
        value: "First sentence.",
        element: Element.SENTENCE,
      },
      {
        line: 1,
        column: 15,
        length: 16,
        value: "Second sentence!",
        element: Element.SENTENCE,
      },
      {
        line: 1,
        column: 31,
        length: 15,
        value: "Third sentence?",
        element: Element.SENTENCE,
      },
    ]);
  });

  it("should tokenize headings", () => {
    const input = "# Heading 1\n## Heading 2";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 10,
        value: "# Heading 1",
        element: Element.H1,
      },
      {
        line: 1,
        column: 11,
        length: 1,
        value: "\n",
        element: Element.PARAGRAPH,
      },
      {
        line: 2,
        column: 1,
        length: 11,
        value: "## Heading 2",
        element: Element.H2,
      },
    ]);
  });

  it("should tokenize list items", () => {
    const input = "- First item\n- Second item";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 11,
        value: "- First item",
        element: Element.ITEM,
      },
      {
        line: 1,
        column: 12,
        length: 1,
        value: "\n",
        element: Element.PARAGRAPH,
      },
      {
        line: 2,
        column: 1,
        length: 12,
        value: "- Second item",
        element: Element.ITEM,
      },
    ]);
  });

  it("should handle HTML content", () => {
    const input = "<div>Some content</div>";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 23,
        value: "<div>Some content</div>",
        element: Element.HTML,
      },
    ]);
  });

  it("should handle self-closing HTML tags", () => {
    const input = "<img src='test.jpg' />";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 21,
        value: "<img src='test.jpg' />",
        element: Element.HTML,
      },
    ]);
  });

  it("should handle mixed content types", () => {
    const input = "# Title\nParagraph here.\n- List item\n<div>HTML</div>";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 7,
        value: "# Title",
        element: Element.H1,
      },
      {
        line: 1,
        column: 8,
        length: 1,
        value: "\n",
        element: Element.PARAGRAPH,
      },
      {
        line: 2,
        column: 1,
        length: 14,
        value: "Paragraph here.",
        element: Element.SENTENCE,
      },
      {
        line: 2,
        column: 15,
        length: 1,
        value: "\n",
        element: Element.PARAGRAPH,
      },
      {
        line: 3,
        column: 1,
        length: 10,
        value: "- List item",
        element: Element.ITEM,
      },
      {
        line: 3,
        column: 11,
        length: 1,
        value: "\n",
        element: Element.PARAGRAPH,
      },
      {
        line: 4,
        column: 1,
        length: 14,
        value: "<div>HTML</div>",
        element: Element.HTML,
      },
    ]);
  });

  it("should handle empty lines", () => {
    const input = "First line.\n\nSecond line.";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 11,
        value: "First line.",
        element: Element.SENTENCE,
      },
      {
        line: 1,
        column: 12,
        length: 1,
        value: "\n",
        element: Element.PARAGRAPH,
      },
      {
        line: 2,
        column: 1,
        length: 1,
        value: "\n",
        element: Element.PARAGRAPH,
      },
      {
        line: 3,
        column: 1,
        length: 12,
        value: "Second line.",
        element: Element.SENTENCE,
      },
    ]);
  });

  it("should handle multiple delimiters in a row", () => {
    const input = "Really?!";
    const tokens = tokenize(input);

    expect(tokens).toEqual([
      {
        line: 1,
        column: 1,
        length: 7,
        value: "Really?",
        element: Element.SENTENCE,
      },
      {
        line: 1,
        column: 8,
        length: 1,
        value: "!",
        element: Element.SENTENCE,
      },
    ]);
  });
});
