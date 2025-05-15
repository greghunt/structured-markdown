import { ParseError } from './error';
import Node, { type Node as NodeType } from './node';
import Tokenizer, { type Token } from './tokenize';

export type { NodeType as Node };

export interface ParseResult {
  tree: Node;
  tokens: Token[];
}

function nodeFromToken(token: Token, index = 0): Node {
  const { line, column, length, value, element } = token;
  return new Node({
    value,
    element,
    index,
    metadata: { line: line ?? 0, column: column ?? 0, length },
  });
}

function createNodeFromTokens(root: Node, tokens: Token[], targetNode?: Node): [Node, Node] {
  return tokens.reduce(
    ([root, leaf], token) => {
      try {
        const node = nodeFromToken(token, root.index + 1);
        return root.add(node, leaf, Boolean(targetNode));
      } catch (error) {
        if (error instanceof ParseError) throw error;
        throw new ParseError(
          error instanceof Error ? error.message : 'Unknown parsing error',
          token.line,
        );
      }
    },
    [root, targetNode ?? root] as [Node, Node],
  );
}

export function createNodeFromText(
  text: string,
  root?: Node,
  target?: Node,
  group?: boolean,
): [Token[], Node, Node] {
  let targetNode = target;
  const tokenizer = new Tokenizer(text, group);
  let rootNode = root ?? Node.initRoot();
  let tokens = tokenizer.tokenize();

  if (targetNode) {
    const [firstToken, ...remainingTokens] = tokens;
    tokens = remainingTokens;
    const [updatedNode] = targetNode
      .update({ ...firstToken })
      .add(nodeFromToken(firstToken), targetNode);

    targetNode = updatedNode;
    rootNode = rootNode.updateById(updatedNode.id, () => updatedNode);

    if (tokens.length === 0) {
      return [tokens, rootNode, updatedNode.leaf()];
    }
  }

  const [node, leafNode] = createNodeFromTokens(rootNode, tokens, targetNode);
  return [tokens, node, leafNode];
}

export function parse(text: string): ParseResult {
  const [tokens, tree] = createNodeFromText(text);
  return { tree, tokens };
}
