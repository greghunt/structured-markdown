import { ElementUtils } from './element';
import { HtmlUtils } from './utils';
import type { ElementType } from './element';

export interface Token {
  line?: number;
  column?: number;
  length: number;
  value: string;
  element: ElementType;
}

export enum Delimiter {
  Newline = '\n',
  Semicolon = ';',
  ExclamationMark = '!',
  QuestionMark = '?',
  Period = '.',
}

export const DELIMITERS: readonly string[] = Object.values(Delimiter);

interface Position {
  line: number;
  column: number;
  index: number;
}

class TokenBuilder {
  private value: string = '';
  private readonly startPos: Position;

  constructor(startPos: Position) {
    this.startPos = { ...startPos };
  }

  append(char: string): void {
    this.value += char;
  }

  createToken(): Token {
    return {
      line: this.startPos.line,
      column: this.startPos.column,
      length: this.value.length,
      value: this.value,
      element: ElementUtils.determineElement(this.value),
    };
  }

  get isEmpty(): boolean {
    return this.value.length === 0;
  }

  static ghostToken(element: ElementType): Token {
    return {
      value: '',
      length: 0,
      element,
    };
  }
}

export default class Tokenizer {
  private pos: Position;
  private currentToken: TokenBuilder;
  private tokens: Token[];
  private group: boolean;
  private ignored: boolean;

  constructor(
    private text: string,
    group: boolean = true,
  ) {
    this.pos = { line: 1, column: 1, index: 0 };
    this.currentToken = new TokenBuilder(this.pos);
    this.tokens = [];
    this.ignored = false;
    this.group = group;
  }

  tokenize(): Token[] {
    while (this.pos.index < this.text.length) {
      const char = this.text[this.pos.index];

      this.ignored = this.ignore();

      this.currentToken.append(char);

      // If we hit a delimiter and we're not in HTML, end the current token and start a new one
      if (!this.ignored && DELIMITERS.includes(char)) {
        this.addToken();
        this.currentToken = new TokenBuilder({
          ...this.pos,
          index: this.pos.index + 1,
        });
      }

      this.updatePosition(char);
    }

    // Handle any remaining token
    if (!this.currentToken.isEmpty) {
      this.addToken();
    }

    return this.tokens;
  }

  private addToken(): void {
    const token = this.currentToken.createToken();
    if (this.group) {
      this.addGhostToken(token.element);
    }
    this.tokens.push(token);
  }

  private addGhostToken(element: ElementType): void {
    const prevEl = this.previous?.element;

    // Sequences of the same element are never grouped.
    if (prevEl === element) return;

    const groupEl = ElementUtils.getGroupingElement(element);
    if (groupEl && groupEl !== prevEl) {
      this.tokens.push(TokenBuilder.ghostToken(groupEl));
    }
  }

  get previous(): Token | null {
    return this.tokens[this.tokens.length - 1] ?? null;
  }

  private ignore(): boolean {
    if (!this.ignored && this.startIgnoredBlock()) {
      return true;
    }

    if (this.ignored && this.endIgnoredBlock()) {
      return false;
    }

    return this.ignored;
  }

  private updatePosition(char: string): void {
    if (char === Delimiter.Newline) {
      this.pos.line++;
      this.pos.column = 1;
    } else {
      this.pos.column++;
    }
    this.pos.index++;
  }

  private startIgnoredBlock(): boolean {
    return HtmlUtils.isStart(this.text, this.pos.index);
  }

  private endIgnoredBlock(): boolean {
    return (
      this.pos.index ===
      HtmlUtils.findEnd(this.text, this.pos.index - this.currentToken.createToken().length)
    );
  }
}
