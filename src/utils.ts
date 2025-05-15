export const HtmlUtils = {
  isStart(text: string, pos: number): boolean {
    return text[pos] === "<" && /[a-zA-Z]/.test(text[pos + 1] || "");
  },

  findEnd(text: string, startPos: number): number {
    const tagMatch = text.slice(startPos).match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
    if (!tagMatch) return startPos;

    const tagName = tagMatch[1];
    const remaining = text.slice(startPos);
    const closeTag = `</${tagName}>`;
    const closeTagIndex = remaining.indexOf(closeTag);
    const selfCloseIndex = remaining.indexOf("/>");

    if (
      selfCloseIndex !== -1 &&
      (closeTagIndex === -1 || selfCloseIndex < closeTagIndex)
    ) {
      return startPos + selfCloseIndex + 2;
    }
    if (closeTagIndex !== -1) {
      return startPos + closeTagIndex + closeTag.length;
    }
    return text.length;
  },
} as const;
