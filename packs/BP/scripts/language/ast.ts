import { TokenType } from "./lexer";

type NodeTypes =
  // STATEMENTS
  | "PROGRAM"
  | "VARIABLEDECLAR"
  | "IFSTATEMENTS"
  | "FUNCTIONDECLARATION"
  | "RETURNSTATEMENT"
  // EXPRESSIONS
  | "FUNCTIONCALL"
  | "STRINGLITERAL"
  | "EQUALITYEXP"
  | "LOGICALEXP"
  | "UNARYEXP"
  | "ASSIGNEXP"
  | "NUMERICLITERAL"
  | "BINARYEXP"
  | "IDENTIFIER";

interface Node {
  type: NodeTypes;
}

interface Program extends Node {
  type: "PROGRAM";
  nodes: Node[];
}

interface Expression extends Node {}

interface VariableDeclaration extends Node {
  type: "VARIABLEDECLAR";
  identifier: string;
  value?: Expression;
}

interface IfStatement extends Node {
  type: "IFSTATEMENTS";
  condition: Expression;
  thenBranch: Node[];
  elseBranch?: Node[];
}

interface FunctionDeclaration extends Node {
  type: "FUNCTIONDECLARATION";
  name: string;
  params: string[];
  nodes: Node[];
}

interface ReturnStatement extends Node {
  type: "RETURNSTATEMENT";
  value?: Expression;
}

interface FunctionCall extends Expression {
  type: "FUNCTIONCALL";
  caller: Expression;
  args: Expression[];
}

interface StringLiteral extends Expression {
  type: "STRINGLITERAL";
  value: string;
}

interface AssignmentExpression extends Expression {
  type: "ASSIGNEXP";
  assignee: Expression;
  value: Expression;
}

interface EqualityExpression extends Expression {
  type: "EQUALITYEXP";
  left: Expression;
  right: Expression;
  operator: TokenType.EQUAL_EQUAL | TokenType.BANG_EQUAL;
}

interface LogicalExpression extends Expression {
  type: "LOGICALEXP";
  left: Expression;
  right: Expression;
  operator: TokenType.AND_AND | TokenType.OR_OR;
}

interface BinaryExpression extends Expression {
  type: "BINARYEXP";
  left: Expression;
  right: Expression;
  operator: string;
}

interface UnaryExpression extends Expression {
  type: "UNARYEXP";
  operator: string;
  operand: Expression;
}

interface Identifier extends Expression {
  type: "IDENTIFIER";
  exp: string;
}

interface NumericLiteral extends Expression {
  type: "NUMERICLITERAL";
  value: number;
}

export {
  NodeTypes,
  // STATEMENTS
  Node,
  Program,
  VariableDeclaration,
  IfStatement,
  FunctionDeclaration,
  ReturnStatement,
  // EXPRESSIONS
  Expression,
  BinaryExpression,
  Identifier,
  NumericLiteral,
  AssignmentExpression,
  StringLiteral,
  UnaryExpression,
  LogicalExpression,
  EqualityExpression,
  FunctionCall,
};
