enum TokenType {
  NUMBER,
  IDENTIFIER,
  EQUALS,
  LPAREN,
  RPAREN,
  VAR,
  PLUS,
  MINUS,
  MULTIP, // *
  DIVIDE,
  SEMICOL,
  LBRACES,
  RBRACES,
  COMMA,
  STRING, // ''
  IF,
  ELSE,
  BANG, // !
  EQUAL_EQUAL, // ==
  BANG_EQUAL, // !=
  AND_AND, // &&
  OR_OR, // ||
  LESS_EQUAL, // <=
  GREAT_EQUAL, // >=
  LESSER, // <
  GREATER, // >
  FUNCTION, // func
  RETURN, // back
  LBRACKET,
  RBRACKET,
  EOF,
}

interface Token {
  type: TokenType;
  value?: string;
}

const KEYWORDS = {
  var: TokenType.VAR,
  if: TokenType.IF,
  else: TokenType.ELSE,
  func: TokenType.FUNCTION,
  back: TokenType.RETURN,
} as const;

class Tokenize {
  private tokens = new Array<Token>();
  private pos = 0;

  private static SINGLE_QUOTE = 39;

  private static symbols = new Map<number, TokenType>([
    [33, TokenType.BANG],
    [40, TokenType.LPAREN],
    [41, TokenType.RPAREN],
    [42, TokenType.MULTIP],
    [43, TokenType.PLUS],
    [44, TokenType.COMMA],
    [45, TokenType.MINUS],
    [47, TokenType.DIVIDE],
    [59, TokenType.SEMICOL],
    [60, TokenType.LESSER],
    [61, TokenType.EQUALS],
    [62, TokenType.GREATER],
    [91, TokenType.LBRACKET],
    [93, TokenType.RBRACKET],
    [123, TokenType.LBRACES],
    [125, TokenType.RBRACES],
  ]);

  private static multiSymbols = new Map<string, TokenType>([
    ["==", TokenType.EQUAL_EQUAL],
    ["!=", TokenType.BANG_EQUAL],
    ["&&", TokenType.AND_AND],
    ["||", TokenType.OR_OR],
    ["<=", TokenType.LESS_EQUAL],
    [">=", TokenType.GREAT_EQUAL],
  ]);

  constructor(private code: string) {}

  isDigit(charCode: number): boolean {
    return charCode >= 48 && charCode <= 57;
  }

  isAlpha(charCode: number): boolean {
    return (
      (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)
    );
  }

  isAlphaNumeric(charCode: number): boolean {
    return this.isAlpha(charCode) || this.isDigit(charCode) || charCode === 95;
  }

  isIgnored(charCode: number): boolean {
    return charCode === 10 || charCode === 32 || charCode === 9;
  }

  run(): Token[] {
    while (this.pos < this.code.length) {
      const curr = this.code.charCodeAt(this.pos);

      if (this.isIgnored(curr)) {
        this.pos++;
        continue;
      }

      // Number
      if (this.isDigit(curr)) {
        const startPos = this.pos;
        let hasDot = false;

        while (this.pos < this.code.length) {
          const currCode = this.code.charCodeAt(this.pos);

          if (this.isDigit(currCode)) {
            this.pos++;
            continue;
          }

          if (this.code[this.pos] === "." && !hasDot) {
            hasDot = true;
            this.pos++;
            continue;
          }

          break;
        }

        this.tokens.push({
          type: TokenType.NUMBER,
          value: this.code.slice(startPos, this.pos),
        });

        continue;
      }

      // Identifier
      if (this.isAlpha(curr)) {
        const startPos = this.pos;

        while (
          this.pos < this.code.length &&
          this.isAlphaNumeric(this.code.charCodeAt(this.pos))
        ) {
          this.pos++;
        }

        const id = this.code.slice(startPos, this.pos);
        const keywordsType = KEYWORDS[id as keyof typeof KEYWORDS];

        if (keywordsType !== undefined) {
          this.tokens.push({ type: keywordsType, value: id });
        } else {
          this.tokens.push({ type: TokenType.IDENTIFIER, value: id });
        }

        continue;
      }

      // Strings
      if (curr === Tokenize.SINGLE_QUOTE) {
        this.pos++; // Skip open quote
        const startPos = this.pos;

        while (
          this.pos < this.code.length &&
          this.code.charCodeAt(this.pos) !== Tokenize.SINGLE_QUOTE
        ) {
          this.pos++;
        }

        if (this.pos >= this.code.length)
          throw new Error("Unterminated string.");

        const str = this.code.slice(startPos, this.pos);
        this.pos++; // Skip close quote

        this.tokens.push({ type: TokenType.STRING, value: str });

        continue;
      }

      // Multiple Symbols
      if (this.pos + 1 < this.code.length) {
        const twoCharacters = this.code[this.pos] + this.code[this.pos + 1];
        const multiSymbol = Tokenize.multiSymbols.get(twoCharacters);
        if (multiSymbol) {
          this.tokens.push({
            type: multiSymbol,
            value: twoCharacters,
          } as Token);
          this.pos += 2;
          continue;
        }
      }

      // Singular Symbols
      const supportedSymbol = Tokenize.symbols.get(curr);
      if (supportedSymbol) {
        this.tokens.push({
          type: supportedSymbol,
          value: this.code[this.pos],
        } as Token);
        this.pos++;
        continue;
      }

      // Safe fallback
      throw new Error(`Unrecognized token found '${this.code[this.pos]}'`);
    }

    this.tokens.push({ type: TokenType.EOF });
    return this.tokens;
  }
}

export { Tokenize, TokenType, Token };
