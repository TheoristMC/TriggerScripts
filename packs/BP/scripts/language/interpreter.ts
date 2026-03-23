import {
  RuntimeValue,
  NumberValue,
  macroNull,
  macroNumber,
  macroString,
  StringValue,
  BooleanValue,
  FunctionValue,
  ReturnThrow,
  NativeFunctionValue,
  macroBoolean,
  ArrayValue,
} from "./values";

import {
  ArrayLiteral,
  AssignmentExpression,
  BinaryExpression,
  EqualityExpression,
  FunctionCall,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  IndexExpression,
  LogicalExpression,
  Node,
  NumericLiteral,
  Program,
  ReturnStatement,
  StringLiteral,
  UnaryExpression,
  VariableDeclaration,
} from "./ast";

import { assertNever } from "./parser";
import { TokenType } from "./lexer";

import Environment from "./env";

class Interpreter {
  private evaluateProgram(program: Program, scope: Environment): RuntimeValue {
    let lastEvaluatedNode: RuntimeValue = macroNull();

    for (const node of program.nodes) {
      lastEvaluatedNode = this.evaluate(node, scope);
    }

    return lastEvaluatedNode;
  }

  private evaluateBinaryExpNum(
    left: NumberValue,
    right: NumberValue,
    operator: string,
  ): NumberValue {
    const leftValue = left.value;
    const rightValue = right.value;

    switch (operator) {
      case "+":
        return macroNumber(leftValue + rightValue);
      case "-":
        return macroNumber(leftValue - rightValue);
      case "/": {
        if (rightValue === 0) throw new Error("You cannot divide by zero.");
        return macroNumber(leftValue / rightValue);
      }
      case "*":
        return macroNumber(leftValue * rightValue);
      default:
        return assertNever(
          operator as never,
          "Unexpected value on 'evaluateBinaryExpNum'",
        );
    }
  }

  private evaluateBinaryExpStr(
    left: StringValue,
    right: StringValue,
    operator: string,
  ): StringValue {
    const leftValue = left.value;
    const rightValue = right.value;

    switch (operator) {
      case "+":
        return macroString(leftValue + rightValue);
      case "-":
        return macroString(leftValue.replaceAll(rightValue, ""));
      default:
        return assertNever(
          operator as never,
          "Unexpected value on 'evaluateBinaryExpStr'",
        );
    }
  }

  private evaluateComparisonExp(
    left: NumberValue,
    right: NumberValue,
    operator: string,
  ): BooleanValue {
    const leftValue = left.value;
    const rightValue = right.value;

    switch (operator) {
      case ">":
        return macroBoolean(leftValue > rightValue);
      case "<":
        return macroBoolean(leftValue < rightValue);
      case "<=":
        return macroBoolean(leftValue <= rightValue);
      case ">=":
        return macroBoolean(leftValue >= rightValue);
      default:
        return macroBoolean(false);
    }
  }

  private evaluateBinaryExp(
    node: BinaryExpression,
    scope: Environment,
  ): RuntimeValue {
    const nodeLeft = this.evaluate(node.left, scope);
    const nodeRight = this.evaluate(node.right, scope);
    const operator = node.operator;
    const leftType = nodeLeft.type;
    const rightType = nodeRight.type;

    // Comparison (higher precedence)
    if (leftType === "NUMBER" && rightType === "NUMBER") {
      if (
        operator === "<" ||
        operator === ">" ||
        operator === "<=" ||
        operator === ">="
      ) {
        return this.evaluateComparisonExp(
          nodeLeft as NumberValue,
          nodeRight as NumberValue,
          operator,
        );
      }
      // Numeric operations
      return this.evaluateBinaryExpNum(
        nodeLeft as NumberValue,
        nodeRight as NumberValue,
        operator,
      );
    }

    // Strings
    if (leftType === "STRING" && rightType === "STRING") {
      return this.evaluateBinaryExpStr(
        nodeLeft as StringValue,
        nodeRight as StringValue,
        operator,
      );
    }

    // Mixed Types Addition
    if (leftType === "STRING" && rightType === "NUMBER" && operator === "+") {
      const leftValue = (nodeLeft as StringValue).value;
      const rightValue = (nodeRight as NumberValue).value;
      return macroString(leftValue + rightValue);
    }

    return macroNull();
  }

  private evaluateIdentifier(
    node: Identifier,
    scope: Environment,
  ): RuntimeValue {
    const varVal = scope.getScopeValue(node.exp);
    return varVal.value;
  }

  private evaluateVarDeclare(
    node: VariableDeclaration,
    scope: Environment,
  ): RuntimeValue {
    const varVal = node.value ? this.evaluate(node.value, scope) : macroNull();
    return scope.declareVar(node.identifier, varVal);
  }

  private evaluateAssignmentArray(
    node: AssignmentExpression,
    scope: Environment,
  ): RuntimeValue {
    const left = node.assignee as IndexExpression;
    const right = this.evaluate(node.value, scope);

    const arr = this.evaluate(left.array, scope) as ArrayValue;
    const index = this.evaluate(left.index, scope) as NumberValue;

    if (arr.type !== "ARRAY") throw new Error("Cannot index a non-array.");
    if (index.type !== "NUMBER")
      throw new Error("Expected number for array index.");

    arr.value[index.value] = right;
    return right;
  }

  private evaluateAssignment(
    node: AssignmentExpression,
    scope: Environment,
  ): RuntimeValue {
    if (node.assignee.type === "IDENTIFIER") {
      const varId = (node.assignee as Identifier).exp;
      const varVal = this.evaluate(node.value, scope);

      return scope.assignVar(varId, varVal);
    } else if (node.assignee.type === "INDEXEXP") {
      return this.evaluateAssignmentArray(node, scope);
    } else throw new Error("Invalid assignee on assignment expression.");
  }

  private isTruthy(value: RuntimeValue): boolean {
    switch (value.type) {
      case "BOOLEAN":
        return (value as BooleanValue).value;
      case "NUMBER":
        return (value as NumberValue).value !== 0;
      case "NULL":
        return false;
      case "STRING":
        return (value as StringValue).value.length !== 0;
      default:
        return true;
    }
  }

  private executeBlock(nodes: Node[], parentScope: Environment): RuntimeValue {
    const scope = new Environment(parentScope);

    let last: RuntimeValue = macroNull();

    for (const node of nodes) {
      last = this.evaluate(node, scope);
    }

    return last;
  }

  private evaluateIfStatement(
    node: IfStatement,
    scope: Environment,
  ): RuntimeValue {
    const condition = this.evaluate(node.condition, scope);

    if (this.isTruthy(condition)) {
      return this.executeBlock(node.thenBranch, scope);
    } else if (node.elseBranch) {
      return this.executeBlock(node.elseBranch, scope);
    }

    return macroNull();
  }

  private evaluateUnary(
    node: UnaryExpression,
    scope: Environment,
  ): RuntimeValue {
    const value = this.evaluate(node.operand, scope);

    switch (node.operator) {
      case "-":
        return macroNumber(-(value as NumberValue).value);
      case "!":
        return macroBoolean(!this.isTruthy(value));
      default:
        return macroNull();
    }
  }

  private evaluateLogicalExp(
    node: LogicalExpression,
    scope: Environment,
  ): RuntimeValue {
    const left = this.evaluate(node.left, scope);
    const right = this.evaluate(node.right, scope);

    if (node.operator === TokenType.AND_AND) {
      if (!this.isTruthy(left)) return left;
      return right;
    } else if (node.operator === TokenType.OR_OR) {
      if (this.isTruthy(left)) return left;
      return right;
    }

    return macroNull();
  }

  private isEqual(a: RuntimeValue, b: RuntimeValue): boolean {
    if (a.type !== b.type) return false;

    switch (a.type) {
      case "BOOLEAN":
      case "STRING":
      case "NUMBER":
        return (
          (a as BooleanValue | StringValue | NumberValue).value ===
          (b as BooleanValue | StringValue | NumberValue).value
        );
      case "NULL":
        return true;
      default:
        return false;
    }
  }

  private evaluateEqualityExp(
    node: EqualityExpression,
    scope: Environment,
  ): RuntimeValue {
    const left = this.evaluate(node.left, scope);
    const right = this.evaluate(node.right, scope);

    if (node.operator === TokenType.EQUAL_EQUAL) {
      return macroBoolean(this.isEqual(left, right));
    } else if (node.operator === TokenType.BANG_EQUAL) {
      return macroBoolean(!this.isEqual(left, right));
    }

    return macroNull();
  }

  private evaluateFuncDeclare(
    node: FunctionDeclaration,
    env: Environment,
  ): RuntimeValue {
    env.declareFunc(
      node.name,
      {
        type: "FUNCTION",
        params: node.params,
        nodes: node.nodes,
        env,
      } as FunctionValue,
      false,
    );

    return macroNull();
  }

  private evaluateFuncCall(node: FunctionCall, env: Environment): RuntimeValue {
    const fn = this.evaluate(node.caller, env);

    const args = node.args.map((arg) => this.evaluate(arg, env));

    if (fn.type === "NATIVEFUNCTION") {
      return (fn as NativeFunctionValue).call(args, env);
    }

    if (fn.type === "FUNCTION") {
      const scope = new Environment((fn as FunctionValue).env);

      (fn as FunctionValue).params.forEach((param, i) => {
        const argValue = args[i];

        if (argValue === undefined)
          throw new Error(
            `Expected value on parameter '${param}' but instead got undefined.`,
          );

        scope.declareVar(param, argValue, false);
      });

      let lastEvaluatedNode: RuntimeValue = macroNull();

      try {
        for (const node of (fn as FunctionValue).nodes) {
          lastEvaluatedNode = this.evaluate(node, scope);
        }
      } catch (e) {
        if ((e as ReturnThrow).type === "RETURN") {
          return (e as ReturnThrow).value;
        }
        throw e;
      }

      return lastEvaluatedNode;
    }

    throw new Error(`Cannot call value of type ${fn.type}`);
  }

  private evaluateReturnStatement(
    node: ReturnStatement,
    scope: Environment,
  ): RuntimeValue {
    const value = node.value ? this.evaluate(node.value, scope) : macroNull();

    throw {
      type: "RETURN",
      value,
    } as ReturnThrow;
  }

  private evaluateArrayLiteral(
    node: ArrayLiteral,
    scope: Environment,
  ): RuntimeValue {
    const elements = node.elements.map((element) =>
      this.evaluate(element, scope),
    );

    return { type: "ARRAY", value: elements } as ArrayValue;
  }

  private evaluateIndexExp(
    node: IndexExpression,
    scope: Environment,
  ): RuntimeValue {
    const arr = this.evaluate(node.array, scope) as ArrayValue;
    const index = this.evaluate(node.index, scope) as NumberValue;

    if (arr.type !== "ARRAY") throw new Error("Cannot index a non-array.");
    if (index.type !== "NUMBER")
      throw new Error("Expected number for array index.");

    return arr.value.at(index.value) ?? macroNull();
  }

  public evaluate(ASTNode: Node, scope: Environment): RuntimeValue {
    switch (ASTNode.type) {
      case "NUMERICLITERAL":
        return macroNumber((ASTNode as NumericLiteral).value);
      case "STRINGLITERAL":
        return macroString((ASTNode as StringLiteral).value);
      case "PROGRAM":
        return this.evaluateProgram(ASTNode as Program, scope);
      case "BINARYEXP":
        return this.evaluateBinaryExp(ASTNode as BinaryExpression, scope);
      case "IDENTIFIER":
        return this.evaluateIdentifier(ASTNode as Identifier, scope);
      case "VARIABLEDECLAR":
        return this.evaluateVarDeclare(ASTNode as VariableDeclaration, scope);
      case "ASSIGNEXP":
        return this.evaluateAssignment(ASTNode as AssignmentExpression, scope);
      case "IFSTATEMENTS":
        return this.evaluateIfStatement(ASTNode as IfStatement, scope);
      case "UNARYEXP":
        return this.evaluateUnary(ASTNode as UnaryExpression, scope);
      case "LOGICALEXP":
        return this.evaluateLogicalExp(ASTNode as LogicalExpression, scope);
      case "EQUALITYEXP":
        return this.evaluateEqualityExp(ASTNode as EqualityExpression, scope);
      case "FUNCTIONDECLARATION":
        return this.evaluateFuncDeclare(ASTNode as FunctionDeclaration, scope);
      case "FUNCTIONCALL":
        return this.evaluateFuncCall(ASTNode as FunctionCall, scope);
      case "RETURNSTATEMENT":
        return this.evaluateReturnStatement(ASTNode as ReturnStatement, scope);
      case "ARRAYLITERAL":
        return this.evaluateArrayLiteral(ASTNode as ArrayLiteral, scope);
      case "INDEXEXP":
        return this.evaluateIndexExp(ASTNode as IndexExpression, scope);
      default:
        return assertNever(
          ASTNode.type as never,
          "Unexpected value on 'evaluate'",
        );
    }
  }
}

export default Interpreter;
