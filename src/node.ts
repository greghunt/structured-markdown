import type { ElementType } from './element';
import { Element, ElementUtils } from './element';
import NodeError from './error';

export type OptionalNode = Node | null;

interface TokenMetadata {
  line: number;
  column: number;
  length: number;
}

interface NodeParams {
  value: string;
  element: ElementType;
  parent?: OptionalNode;
  children?: Node[];
  id?: string;
  index?: number;
  metadata?: TokenMetadata;
}

export interface SerializedNode {
  id: string;
  value: string;
  el: ElementType;
  pid: string | null;
  children: string[];
}

class Node {
  readonly id: string;
  readonly value: string;
  readonly element: ElementType;
  readonly metadata: TokenMetadata;
  readonly parent: OptionalNode;
  readonly children: Node[];
  readonly index: number;

  constructor({
    value,
    element,
    parent = null,
    children = [],
    id,
    index = 0,
    metadata = { line: 0, column: 0, length: 0 },
  }: NodeParams) {
    this.value = value;
    this.element = element;
    this.id = id ?? Math.random().toString(36).substring(2, 15);
    this.index = index;
    this.metadata = metadata;
    this.parent = parent;
    this.children = children.map((child) => {
      return child.update({ parent: this });
    });
  }

  get content(): string {
    return this.value + this.children.map((child) => child.content).join('');
  }

  get position(): number {
    return this.parent ? this.parent.children.indexOf(this) : 0;
  }

  get firstChild(): Node | null {
    return this.children.length > 0 ? this.children[0] : null;
  }

  get lastChild(): Node | null {
    return this.children.length > 0 ? this.children[this.children.length - 1] : null;
  }

  visit(callback: (node: Node) => void): void {
    this.map((node) => {
      callback(node);
      return node;
    });
  }

  map(transform: (node: Node) => Node): Node {
    const transformedNode = transform(this);

    if (transformedNode.children.length === 0) {
      return transformedNode;
    }

    // Transform all children and check if any changed
    let hasChanges = false;
    const newChildren = transformedNode.children.map((child) => {
      const transformedChild = child.map(transform);
      if (transformedChild !== child) hasChanges = true;
      return transformedChild;
    });

    // Only create new node if children changed
    return hasChanges ? transformedNode.update({ children: newChildren }) : transformedNode;
  }

  findById(id: string): OptionalNode {
    if (this.id === id) return this;

    for (const child of this.children) {
      const found = child.findById(id);
      if (found) return found;
    }

    return null;
  }

  leaf(): Node {
    return this.children.length > 0 ? this.children[0].leaf() : this;
  }

  add(newNode: Node, targetNode: Node, editing = false): [Node, Node] {
    const [validParent, index] = targetNode.climbToValidNode(newNode);
    // @todo: consider when editing, that we want to create the next index differently.
    const updated = validParent.addChildAt(newNode, index);
    const root = this.updateById(updated.id, () => updated);
    return [root, root.findById(newNode.id) ?? newNode];
  }

  addChildAt(child: Node, index: number): Node {
    const valid = this.validChild(child, index);
    if (!valid) throw valid;

    const newChildren = [
      ...this.children.slice(0, index),
      child.update({ parent: this }),
      ...this.children.slice(index)
    ];

    return this.update({ children: newChildren });
  }

  previous(): Node | null {
    if (!this.parent) return null;

    return this.position > 0 ? this.parent.children[this.position - 1] : this.parent;
  }

  next(): Node | null {
    if (!this.parent) return null;

    return this.position < this.parent.children.length - 1
      ? this.parent.children[this.position + 1]
      : this.parent;
  }

  delete(node: Node): Node {
    const parent = this.findById(node.parent?.id ?? '');
    if (!parent) return this;

    const children = parent.children.filter((child) => child.id !== node.id);
    return this.updateById(parent.id, () => ({ children }));
  }

  update(params: Partial<NodeParams>): Node {
    return new Node({
      value: params.value ?? this.value,
      element: params.element ?? this.element,
      parent: params.parent ?? this.parent,
      children: params.children ?? this.children,
      id: params.id ?? this.id,
      index: params.index ?? this.index,
      metadata: params.metadata ?? this.metadata,
    });
  }

  updateById(id: string, updater: (node: Node) => Partial<NodeParams>): Node {
    return this.map((node) => {
      if (node.id === id) {
        return node.update(updater(node));
      }
      return node;
    });
  }

  climbToValidNode(node: Node): [Node, number] {
    let current: Node = this;
    let child: Node = this;
    while (current.parent && !current.validRelation(node)) {
      let parent = current.parent;
      parent = parent.update({
        children: parent.children.map((c) => (c.id === current.id ? current : c)),
      });
      current = parent;
      child = current;
    }

    const index = current !== child ? child.position + 1 : current.children.length;

    return [current, index];
  }

  /**
   * Serialization
   */

  toJSON() {
    return {
      id: this.id,
      index: this.index,
      value: this.value,
      element: this.element,
      metadata: this.metadata,
      parent: this.parent?.id ?? null,
      content: this.content,
      children: this.children,
    };
  }

  toArray(): Node[] {
    return [this, ...this.children.flatMap((child) => child.toArray())];
  }

  /**
   * Validators
   */

  validHierarchy(child: Node): Error | boolean {
    if (!ElementUtils.validRelation(this.element, child.element)) {
      return new NodeError(
        `Invalid hierarchy: ${child.element} cannot be added to ${this.element}`,
      );
    }
    if (child.id === this.id) {
      return new NodeError('A node cannot be added as its own child.');
    }

    return true;
  }

  validPosition(index: number): boolean {
    return index >= 0 && index <= this.children.length;
  }

  validChild(child: Node, index: number): Error | boolean {
    if (!this.validPosition(index)) {
      return new NodeError('Index out of bounds');
    }

    return this.validHierarchy(child);
  }

  validRelation(child: Node): boolean {
    return ElementUtils.validRelation(this.element, child.element);
  }

  /**
   * Static methods
   */

  static deserialize(nodes: SerializedNode[]): Node {
    const rootId = nodes[0].id;
    const nodeMap = new Map<string, SerializedNode>();
    const childrenMap = new Map<string, string[]>();

    // Build maps for quick lookup
    for (const n of nodes) {
      nodeMap.set(n.id, n);
      if (n.pid) {
        if (!childrenMap.has(n.pid)) childrenMap.set(n.pid, []);
        childrenMap.get(n.pid)!.push(n.id);
      }
    }

    // Recursive function to build immutable Node tree
    const buildNode = (id: string, parent: OptionalNode = null): Node => {
      const record = nodeMap.get(id)!;
      const childrenIds = childrenMap.get(id) || [];
      const children = childrenIds.map((childId) => buildNode(childId));
      return new Node({
        id: record.id,
        value: record.value,
        element: record.el,
        parent,
        children,
      });
    };

    return buildNode(rootId);
  }

  static initRoot(): Node {
    return new Node({
      value: '',
      element: Element.ROOT,
      index: 0,
    });
  }
}

export default Node;

export type { Node };
