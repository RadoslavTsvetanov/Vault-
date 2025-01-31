import { keyString } from "../db-client";
import { handleErrorableWithDefaults } from "../errorableHandler";

const keyStrin = new keyString("a".repeat(32)).build();
console.log(keyStrin)
handleErrorableWithDefaults(keyStrin)