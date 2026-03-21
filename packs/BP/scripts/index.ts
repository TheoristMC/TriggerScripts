import { Player, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

import Parser from "./language/parser";
import Interpreter from "./language/interpreter";
import Environment from "./language/env";

import {
  macroNativeFunc,
  macroNull,
  macroString,
  NumberValue,
  StringValue,
} from "./language/values";

function implementNative(player: Player, env: Environment) {
  env.declareVar("initiator_id", macroString(player.id), true);

  env.declareFunc(
    "chatBroadcast",
    macroNativeFunc((args) => {
      const message = args[0] as StringValue;
      if (!message || message.type !== "STRING")
        throw new Error(
          "Invalid parameter received at function 'chatBroadcast'",
        );

      world.sendMessage(message.value);
      return macroString(message.value);
    }),
    true,
  );

  env.declareFunc(
    "bounce",
    macroNativeFunc((args) => {
      const horizMultiplier = args[0] as NumberValue;
      const vertMultiplier = args[1] as NumberValue;

      if (
        !horizMultiplier ||
        !vertMultiplier ||
        horizMultiplier.type !== "NUMBER" ||
        vertMultiplier.type !== "NUMBER"
      )
        throw new Error("Invalid parameter received at function 'bounce'");

      player.applyKnockback(
        { x: horizMultiplier.value, z: horizMultiplier.value },
        vertMultiplier.value,
      );
      return macroNull();
    }),
    true,
  );
}

function scriptUI(player: Player, code: string = "", message: string = "") {
  const form = new ModalFormData().title("TriggerScript");

  form.textField(message, "chatBroadcast('Hello Everyone')", {
    defaultValue: code,
  });

  form.submitButton("Run");

  form.show(player).then(({ canceled, formValues }) => {
    if (canceled) return;

    const parser = new Parser();
    const environment = new Environment();
    const interpreter = new Interpreter();

    const code = formValues!.at(0) as string;
    implementNative(player, environment);

    try {
      const parsed = parser.AST(code);
      interpreter.evaluate(parsed, environment);
    } catch (err) {
      scriptUI(player, code, "§c" + (err as Error).message);
    }
  });
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack.typeId === "minecraft:compass") {
    scriptUI(source);
  }
});
