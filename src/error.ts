export default class NodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NodeError';
  }
}

export class ParseError extends Error {
  constructor(message: string, line?: number) {
    const lineInfo = line ? `at line ${line}` : 'in Token';
    super(`${message}: ${lineInfo}`);
    this.name = 'ParseError';
  }
}
