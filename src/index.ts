import { ParseError } from './error';
import Node, { type Node as NodeType, type NodeId } from './node';
import Tokenizer, { type Token } from './tokenize';

export type { NodeType as Node };

type GenerateId = (previousId?: NodeId) => NodeId;

export interface ParseResult {
  tree: Node;
  tokens: Token[];
}

function nodeFromToken(id: NodeId, token: Token, index = 0): Node {
  const { line, column, length, value, element } = token;
  return new Node({
    id,
    value,
    element,
    index,
    metadata: { line: line ?? 0, column: column ?? 0, length },
  });
}

function createNodeFromTokens(genId: GenerateId, root: Node, tokens: Token[], targetNode?: Node): [Node, Node] {
  return tokens.reduce(
    ([root, leaf], token) => {
      try {
        const node = nodeFromToken(genId(leaf.id), token, leaf.index + 1);
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
  genId: GenerateId,
  root?: Node,
  target?: Node,
  group?: boolean,
): [Token[], Node, Node] {
  let targetNode = target;
  const tokenizer = new Tokenizer(text, group);
  let rootNode = root ?? Node.initRoot(genId());
  let tokens = tokenizer.tokenize();

  if (targetNode) {
    const [firstToken, ...remainingTokens] = tokens;
    tokens = remainingTokens;
    const [updatedNode] = targetNode
      .update({ ...firstToken })
      .add(nodeFromToken(genId(targetNode.id), firstToken), targetNode);

    targetNode = updatedNode;
    rootNode = rootNode.updateById(updatedNode.id, () => updatedNode);

    if (tokens.length === 0) {
      return [tokens, rootNode, updatedNode.leaf()];
    }
  }

  const [node, leafNode] = createNodeFromTokens(genId, rootNode, tokens, targetNode);
  return [tokens, node, leafNode];
}

export function parse(text: string, generateId?: GenerateId): ParseResult {
  const genId = generateId ?? defaultGenerateId;
  const [tokens, tree] = createNodeFromText(text, genId);
  return { tree, tokens };
}

const defaultGenerateId: GenerateId = (previousId?: NodeId): NodeId => {
  if (previousId === undefined) return 0;
  return Number(previousId) + 1;
}