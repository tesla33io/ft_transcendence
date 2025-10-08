// eslint.config.js (for ESLint 9+ flat config)
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
    },
    rules: {
      indent: ["error", 4],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single"],
      semi: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "warn",
    },
  },
];
