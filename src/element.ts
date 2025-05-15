export const Element = {
  H1: "h1",
  H2: "h2",
  H3: "h3",
  H4: "h4",
  H5: "h5",
  H6: "h6",
  PARAGRAPH: "p",
  SENTENCE: "s",
  LIST: "ul",
  ITEM: "li",
  HTML: "html",
  ROOT: "root",
} as const;

export type ElementType = (typeof Element)[keyof typeof Element];

type HierarchyLevel = {
  level: number;
  element: ElementType;
  groupingElement?: ElementType;
  allowedParents: ElementType[];
  allowedChildren: ElementType[];
};

/**
 * Arrays are used instead of Sets for better performance,
 * since the number of elements is small and the lookup is not frequent.
 */
const hierarchy: Record<ElementType, HierarchyLevel> = {
  [Element.ROOT]: {
    level: 0,
    element: Element.ROOT,
    allowedParents: [],
    allowedChildren: [
      Element.H1,
      Element.H2,
      Element.H3,
      Element.H4,
      Element.H5,
      Element.H6,
      Element.PARAGRAPH,
      Element.LIST,
      Element.HTML,
    ],
  },
  [Element.H1]: {
    level: 1,
    element: Element.H1,
    allowedParents: [Element.ROOT],
    allowedChildren: [
      Element.H2,
      Element.H3,
      Element.H4,
      Element.H5,
      Element.H6,
      Element.PARAGRAPH,
      Element.LIST,
      Element.HTML,
    ],
  },
  [Element.H2]: {
    level: 2,
    element: Element.H2,
    allowedParents: [Element.ROOT, Element.H1],
    allowedChildren: [
      Element.H3,
      Element.PARAGRAPH,
      Element.LIST,
      Element.HTML,
    ],
  },
  [Element.H3]: {
    level: 3,
    element: Element.H3,
    allowedParents: [Element.ROOT, Element.H1, Element.H2],
    allowedChildren: [
      Element.H4,
      Element.PARAGRAPH,
      Element.LIST,
      Element.HTML,
    ],
  },
  [Element.H4]: {
    level: 4,
    element: Element.H4,
    allowedParents: [Element.ROOT, Element.H1, Element.H2, Element.H3],
    allowedChildren: [
      Element.H5,
      Element.PARAGRAPH,
      Element.LIST,
      Element.HTML,
    ],
  },
  [Element.H5]: {
    level: 5,
    element: Element.H5,
    allowedParents: [
      Element.ROOT,
      Element.H1,
      Element.H2,
      Element.H3,
      Element.H4,
    ],
    allowedChildren: [
      Element.H6,
      Element.PARAGRAPH,
      Element.LIST,
      Element.HTML,
    ],
  },
  [Element.H6]: {
    level: 6,
    element: Element.H6,
    allowedParents: [
      Element.ROOT,
      Element.H1,
      Element.H2,
      Element.H3,
      Element.H4,
      Element.H5,
    ],
    allowedChildren: [Element.PARAGRAPH, Element.LIST, Element.HTML],
  },
  [Element.PARAGRAPH]: {
    level: 7,
    element: Element.PARAGRAPH,
    allowedParents: [
      Element.ROOT,
      Element.H1,
      Element.H2,
      Element.H3,
      Element.H4,
      Element.H5,
      Element.H6,
    ],
    allowedChildren: [Element.SENTENCE],
  },
  [Element.LIST]: {
    level: 7,
    element: Element.LIST,
    allowedParents: [
      Element.ROOT,
      Element.H1,
      Element.H2,
      Element.H3,
      Element.H4,
      Element.H5,
      Element.H6,
      Element.ITEM,
    ],
    allowedChildren: [Element.ITEM],
  },
  [Element.HTML]: {
    level: 7,
    element: Element.HTML,
    allowedParents: [
      Element.ROOT,
      Element.H1,
      Element.H2,
      Element.H3,
      Element.H4,
      Element.H5,
      Element.H6,
    ],
    allowedChildren: [],
  },
  [Element.ITEM]: {
    level: 8,
    element: Element.ITEM,
    groupingElement: Element.LIST,
    allowedParents: [Element.LIST],
    allowedChildren: [Element.SENTENCE],
  },
  [Element.SENTENCE]: {
    level: 9,
    element: Element.SENTENCE,
    groupingElement: Element.PARAGRAPH,
    allowedParents: [Element.PARAGRAPH, Element.ITEM],
    allowedChildren: [],
  },
} as const;

export const ElementUtils = {
  headingFromLevel: (level: number): ElementType => {
    if (level < 1 || level > 6) {
      throw new Error(`Invalid heading level: ${level}`);
    }
    return `h${level}` as ElementType;
  },

  validParent: (element: ElementType, parent: ElementType): boolean => {
    return hierarchy[element].allowedParents.includes(parent);
  },

  validChild: (element: ElementType, child: ElementType): boolean => {
    return hierarchy[element].allowedChildren.includes(child);
  },

  validParentLevel: (child: ElementType, parent: ElementType): boolean => {
    return ElementUtils.getLevel(child) > ElementUtils.getLevel(parent);
  },

  getGroupingElement: (element: ElementType): ElementType | undefined => {
    return hierarchy[element].groupingElement;
  },

  validRelation: (parent: ElementType, child: ElementType): boolean => {
    if (!ElementUtils.validChild(parent, child)) {
      return false;
    }

    if (!ElementUtils.validParent(child, parent)) {
      return false;
    }

    return ElementUtils.validParentLevel(child, parent);
  },

  getLevel: (element: ElementType): number => {
    return hierarchy[element].level;
  },

  determineElement: (value: string): ElementType => {
    if (/^#+\s/.test(value)) {
      const level = value.split(" ")[0].length;
      return ElementUtils.headingFromLevel(level);
    }

    if (/^-+\s/.test(value)) {
      return Element.ITEM;
    }

    if (value.startsWith("\n")) {
      return Element.PARAGRAPH;
    }

    if (value.trim().startsWith("<")) {
      const trimmedValue = value.trim();
      const startsWithTag = /^<\w+[^>]*>/i.test(trimmedValue);
      if (startsWithTag) {
        return Element.HTML;
      }
    }

    return Element.SENTENCE;
  },
};
