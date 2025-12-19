import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js, "unused-imports": unusedImports },
    extends: ["js/recommended"],
    rules: {
      "no-unused-vars": "warn",
      "unused-imports/no-unused-imports": "warn"
    }
  },
  { files: ["**/*.{js,mjs,cjs,jsx}"], languageOptions: { globals: globals.browser } },
  pluginReact.configs.flat.recommended,
]);