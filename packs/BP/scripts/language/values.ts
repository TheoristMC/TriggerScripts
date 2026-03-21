import { Node } from "./ast";
import Environment from "./env";

type ValueType =
  | "NULL"
  | "NUMBER"
  | "BOOLEAN"
  | "STRING"
  | "FUNCTION"
  | "NATIVEFUNCTION"
  | "RETURN";

interface RuntimeValue {
  type: ValueType;
}

interface NullValue extends RuntimeValue {
  type: "NULL";
  value: null;
}

interface NumberValue extends RuntimeValue {
  type: "NUMBER";
  value: number;
}

interface BooleanValue extends RuntimeValue {
  type: "BOOLEAN";
  value: boolean;
}

interface StringValue extends RuntimeValue {
  type: "STRING";
  value: string;
}

interface FunctionValue extends RuntimeValue {
  type: "FUNCTION";
  params: string[];
  nodes: Node[];
  env: Environment;
}

interface NativeFunctionValue extends RuntimeValue {
  type: "NATIVEFUNCTION";
  call: (args: RuntimeValue[], env: Environment) => RuntimeValue;
}

interface ReturnThrow extends RuntimeValue {
  type: "RETURN";
  value: RuntimeValue;
}

function macroNull(): NullValue {
  return { type: "NULL", value: null } as NullValue;
}

function macroNumber(value: number): NumberValue {
  return { type: "NUMBER", value } as NumberValue;
}

function macroBoolean(value: boolean): BooleanValue {
  return { type: "BOOLEAN", value } as BooleanValue;
}

function macroString(value: string): StringValue {
  return { type: "STRING", value } as StringValue;
}

function macroNativeFunc(
  cb: (args: RuntimeValue[], env: Environment) => RuntimeValue,
): NativeFunctionValue {
  return { type: "NATIVEFUNCTION", call: cb } as NativeFunctionValue;
}

export {
  ValueType,
  RuntimeValue,
  NullValue,
  NumberValue,
  BooleanValue,
  StringValue,
  FunctionValue,
  NativeFunctionValue,
  ReturnThrow,
};

export { macroNull, macroNumber, macroBoolean, macroString, macroNativeFunc };
