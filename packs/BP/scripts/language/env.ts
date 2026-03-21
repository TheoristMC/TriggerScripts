import {
  FunctionValue,
  macroNativeFunc,
  macroNumber,
  NativeFunctionValue,
  RuntimeValue,
  StringValue,
} from "./values";
import { macroBoolean, macroNull } from "./values";

type VariableValue = {
  constant: boolean;
  value: RuntimeValue;
};

type FuncValue = {
  native: boolean;
  value: FunctionValue | NativeFunctionValue | RuntimeValue;
};

class Environment {
  private parent?: Environment;
  private variables: Map<string, VariableValue>;
  private functions: Map<string, FuncValue>;

  constructor(parent?: Environment) {
    this.parent = parent;
    this.variables = new Map();
    this.functions = new Map();

    if (!parent) Environment.setGlobal(this);
  }

  private static setGlobal(scope: Environment) {
    scope.declareVar("true", macroBoolean(true), true);
    scope.declareVar("false", macroBoolean(false), true);
    scope.declareVar("null", macroNull(), true);

    scope.declareFunc(
      "len",
      macroNativeFunc((args) => {
        const input = args[0] as StringValue;
        if (!input || input.type !== "STRING")
          throw new Error("Invalid parameter received at function 'len'");

        return macroNumber(input.value.length);
      }),
      true,
    );
  }

  public declareFunc(
    identifier: string,
    value: NativeFunctionValue | FunctionValue,
    native = false,
  ): RuntimeValue {
    if (this.functions.get(identifier)?.native) {
      throw new Error(`Cannot override native functions: ${identifier}`);
    }

    if (this.functions.has(identifier)) {
      throw new Error(`Cannot have function with a same name: ${identifier}`);
    }

    this.functions.set(identifier, { value, native });
    return value;
  }

  public declareVar(
    identifier: string,
    value: RuntimeValue,
    constant = false,
  ): RuntimeValue {
    if (this.variables.has(identifier)) {
      throw new Error(`Cannot redeclare variable: ${identifier}`);
    }

    this.variables.set(identifier, { constant, value });
    return value;
  }

  public assignVar(identifier: string, value: RuntimeValue): RuntimeValue {
    const scope = this.resolveScope(identifier);
    const variable = scope.variables.get(identifier)!;

    if (variable.constant) {
      throw new Error("Cannot assign to a constant variable.");
    }

    scope.variables.set(identifier, {
      constant: variable.constant,
      value,
    });

    return value;
  }

  public getScopeValue(identifier: string): VariableValue | FuncValue {
    const scope = this.resolveScope(identifier);

    const variable = scope.variables.get(identifier);
    const func = scope.functions.get(identifier);

    if (variable) return variable;
    else if (func) return func;

    throw new Error("Cannot get scoped value.");
  }

  public resolveScope(identifier: string): Environment {
    if (this.variables.has(identifier) || this.functions.has(identifier)) {
      return this;
    }

    if (this.parent) {
      return this.parent.resolveScope(identifier);
    }

    throw new Error(`Unresolved variable or function name '${identifier}'.`);
  }
}

export default Environment;
