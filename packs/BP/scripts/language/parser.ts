import {
  Node,
  Program,
  Expression,
  BinaryExpression,
  Identifier,
  NumericLiteral,
  VariableDeclaration,
  AssignmentExpression,
  StringLiteral,
  IfStatement,
  UnaryExpression,
  LogicalExpression,
  EqualityExpression,
  FunctionDeclaration,
  FunctionCall,
  ReturnStatement,
  ArrayLiteral,
  IndexExpression,
} from "./ast";

import { Tokenize, Token, TokenType } from "./lexer";

function assertNever(x: never, err: string): never {
  throw new Error(`${err}: ${JSON.stringify(x)}`);
}

class Parser {
  private tokens: Token[] = [];
  private pos = 0;

  private get currentToken(): Token {
    return this.tokens[this.pos];
  }

  private isEOF(): boolean {
    return this.currentToken.type === TokenType.EOF;
  }

  private eatToken(): Token {
    return this.tokens[this.pos++];
  }

  private expectToken(type: TokenType, error: string) {
    const token = this.eatToken();
    if (token.type != type) {
      throw new Error(error);
    }

    return token;
  }

  private peekToken(step: number = 1): Token {
    const token = this.tokens[this.pos + step];
    return token ?? { type: TokenType.EOF };
  }

  private isCurrentTokenType(...types: TokenType[]): boolean {
    return types.includes(this.currentToken.type);
  }

  // EXPRESSIONS (order matter)

  private parseExpression(): Expression {
    return this.parseAssignmentExp();
  }

  private parseAssignmentExp(): Expression {
    const left = this.parseLogicalOR();

    if (this.isCurrentTokenType(TokenType.EQUALS)) {
      this.eatToken();

      const value = this.parseAssignmentExp();

      return {
        type: "ASSIGNEXP",
        assignee: left,
        value,
      } as AssignmentExpression;
    }

    return left;
  }

  private parseLogicalOR(): Expression {
    let left = this.parseLogicalAND();

    while (this.isCurrentTokenType(TokenType.OR_OR)) {
      const token = this.eatToken();

      left = {
        type: "LOGICALEXP",
        operator: token.type,
        left,
        right: this.parseLogicalAND(),
      } as LogicalExpression;
    }

    return left;
  }

  private parseLogicalAND(): Expression {
    let left = this.parseEqualityExp();

    while (this.isCurrentTokenType(TokenType.AND_AND)) {
      const token = this.eatToken();

      left = {
        type: "LOGICALEXP",
        operator: token.type,
        left,
        right: this.parseEqualityExp(),
      } as LogicalExpression;
    }

    return left;
  }

  private parseEqualityExp(): Expression {
    let left = this.parseComparisonExp();

    while (
      this.isCurrentTokenType(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)
    ) {
      const token = this.eatToken();

      left = {
        type: "EQUALITYEXP",
        operator: token.type,
        left,
        right: this.parseComparisonExp(),
      } as EqualityExpression;
    }

    return left;
  }

  private parseComparisonExp(): Expression {
    let left = this.parseAdditiveExp();

    while (
      this.isCurrentTokenType(
        TokenType.LESSER,
        TokenType.GREATER,
        TokenType.LESS_EQUAL,
        TokenType.GREAT_EQUAL,
      )
    ) {
      const operator = this.eatToken();

      left = {
        type: "BINARYEXP",
        operator: operator.value,
        left,
        right: this.parseAdditiveExp(),
      } as BinaryExpression;
    }

    return left;
  }

  private parseAdditiveExp(): Expression {
    let left = this.parseMultiplicativeExp();

    while (this.isCurrentTokenType(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.eatToken();
      const right = this.parseMultiplicativeExp();

      left = {
        type: "BINARYEXP",
        left,
        operator: operator.value,
        right,
      } as BinaryExpression;
    }

    return left;
  }

  private parseMultiplicativeExp(): Expression {
    let left = this.parseUnary();

    while (this.isCurrentTokenType(TokenType.DIVIDE, TokenType.MULTIP)) {
      const operator = this.eatToken();
      const right = this.parseUnary();
      left = {
        type: "BINARYEXP",
        left,
        operator: operator.value,
        right,
      } as BinaryExpression;
    }

    return left;
  }

  private parseUnary(): Expression {
    const token = this.currentToken;

    if (this.isCurrentTokenType(TokenType.MINUS, TokenType.BANG)) {
      this.eatToken();

      return {
        type: "UNARYEXP",
        operator: token.value,
        operand: this.parseUnary(),
      } as UnaryExpression;
    }

    return this.parseCallMember();
  }

  private parseFuncCall(caller: Expression): Expression {
    this.eatToken(); // Eat '('

    const args = new Array<Expression>();

    while (!this.isCurrentTokenType(TokenType.RPAREN)) {
      args.push(this.parseExpression());
      if (this.isCurrentTokenType(TokenType.COMMA)) this.eatToken();
    }

    this.expectToken(TokenType.RPAREN, "Expected ')'");

    return { type: "FUNCTIONCALL", caller, args } as FunctionCall;
  }

  private parseArrCall(caller: Expression): Expression {
    this.eatToken(); // Eat '['

    const index = this.parseExpression();

    this.expectToken(TokenType.RBRACKET, "Expected ']'");

    return {
      type: "INDEXEXP",
      array: caller,
      index,
    } as IndexExpression;
  }

  private parseCallMember(): Expression {
    let member = this.parsePrimaryExp();

    while (true) {
      if (this.isCurrentTokenType(TokenType.LPAREN)) {
        member = this.parseFuncCall(member);
      } else if (this.isCurrentTokenType(TokenType.LBRACKET)) {
        member = this.parseArrCall(member);
      } else break;
    }

    return member;
  }

  private parsePrimaryExp(): Expression {
    const token = this.eatToken();

    switch (token.type) {
      case TokenType.IDENTIFIER:
        return { type: "IDENTIFIER", exp: token.value } as Identifier;
      case TokenType.STRING:
        return { type: "STRINGLITERAL", value: token.value } as StringLiteral;
      case TokenType.NUMBER:
        return {
          type: "NUMERICLITERAL",
          value: parseFloat(token.value!),
        } as NumericLiteral;
      case TokenType.LPAREN: {
        const value = this.parseExpression();
        this.expectToken(TokenType.RPAREN, "Expected ')'");
        return value;
      }
      case TokenType.LBRACKET:
        return this.parseArrayLiteral();
      case TokenType.EOF:
        throw new Error("Unexpected end of input.");
      default:
        return assertNever(
          token.type as never,
          "Unexpected value on 'parsePrimaryExp'",
        );
    }
  }

  private parseArrayLiteral(): Expression {
    const elements = new Array<Expression>();

    while (!this.isCurrentTokenType(TokenType.RBRACKET)) {
      elements.push(this.parseExpression());

      if (this.isCurrentTokenType(TokenType.COMMA)) {
        if (this.peekToken().type === TokenType.RBRACKET)
          throw new Error("Expected an expression after a comma.");

        this.eatToken();
      }
    }

    this.expectToken(TokenType.RBRACKET, "Expected ']'");

    return {
      type: "ARRAYLITERAL",
      elements,
    } as ArrayLiteral;
  }

  // STATEMENTS (order doesn't matter)

  private parseBlock(): Node[] {
    this.expectToken(TokenType.LBRACES, "Expected '{'");

    const nodes = new Array<Node>();

    while (!this.isCurrentTokenType(TokenType.RBRACES)) {
      nodes.push(this.parseNodes());
    }

    this.expectToken(TokenType.RBRACES, "Expected '}'");

    return nodes;
  }

  private parseVarDeclaration(): VariableDeclaration {
    this.eatToken(); // Eat the variable declaration

    const identifier = this.expectToken(
      TokenType.IDENTIFIER,
      "Expected variable name after variable declaration.",
    ).value;

    if (this.isCurrentTokenType(TokenType.SEMICOL)) {
      this.eatToken();
      return { type: "VARIABLEDECLAR", identifier } as VariableDeclaration;
    }

    this.expectToken(
      TokenType.EQUALS,
      "Expected equals token following variable declaration.",
    );

    const declaration = {
      type: "VARIABLEDECLAR",
      identifier,
      value: this.parseExpression(),
    } as VariableDeclaration;

    this.expectToken(
      TokenType.SEMICOL,
      "Variable declaration must end with a semi-colon.",
    );
    return declaration;
  }

  private parseIfStatement(): IfStatement {
    const tokenAte = this.eatToken(); // Eat the if-statement declaration

    if (tokenAte.type !== TokenType.IF)
      throw new Error("Unexpected 'else' without preceding 'if'");

    this.expectToken(
      TokenType.LPAREN,
      "Expected '(' after if-statement declaration.",
    );
    const condition = this.parseExpression();
    this.expectToken(TokenType.RPAREN, "Expected ')'");

    const thenBranch = this.parseBlock();

    let elseBranch: Node[] | undefined;
    if (this.isCurrentTokenType(TokenType.ELSE)) {
      this.eatToken();

      elseBranch = this.parseBlock();
    }

    return {
      type: "IFSTATEMENTS",
      condition,
      thenBranch,
      elseBranch,
    } as IfStatement;
  }

  private parseFunctionDeclare(): FunctionDeclaration {
    this.eatToken(); // Eat the function declaration

    const name = this.expectToken(
      TokenType.IDENTIFIER,
      "Expected function name after declaration.",
    ).value;

    this.expectToken(
      TokenType.LPAREN,
      "Expected '(' after function name declaration.",
    );

    const params = new Array<string>();

    while (!this.isCurrentTokenType(TokenType.RPAREN)) {
      const param = this.expectToken(
        TokenType.IDENTIFIER,
        "Expected function parameter or ')'",
      ).value;

      if (param) params.push(param);
      if (this.isCurrentTokenType(TokenType.COMMA)) {
        if (this.peekToken().type !== TokenType.IDENTIFIER)
          throw new Error("Expected function parameter after a comma.");

        this.eatToken();
      }
    }

    this.expectToken(TokenType.RPAREN, "Expected ')'");

    const nodes = this.parseBlock();

    return {
      type: "FUNCTIONDECLARATION",
      name,
      params,
      nodes,
    } as FunctionDeclaration;
  }

  private parseReturnStatement(): ReturnStatement {
    this.eatToken(); // Eat return statement declaration

    let value: Expression | undefined;
    if (!this.isCurrentTokenType(TokenType.SEMICOL)) {
      value = this.parseExpression();
    }

    this.expectToken(
      TokenType.SEMICOL,
      "Return statement must end with a semi-colon.",
    );

    return {
      type: "RETURNSTATEMENT",
      value,
    } as ReturnStatement;
  }

  private parseNodes(): Node {
    switch (this.currentToken.type) {
      case TokenType.VAR:
        return this.parseVarDeclaration();
      case TokenType.IF:
      case TokenType.ELSE:
        return this.parseIfStatement();
      case TokenType.FUNCTION:
        return this.parseFunctionDeclare();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpression();
    }
  }

  public AST(code: string): Program {
    this.tokens = new Tokenize(code).run();
    this.pos = 0;

    const program: Program = { type: "PROGRAM", nodes: [] };

    while (!this.isEOF()) {
      const expr = this.parseNodes();
      program.nodes.push(expr);
    }

    return program;
  }
}

export default Parser;
export { assertNever };
