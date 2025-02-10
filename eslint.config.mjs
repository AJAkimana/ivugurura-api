import globals from "globals";
import pluginJs from "@eslint/js";

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.mocha },
    },
  },
  pluginJs.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ["src/**/*.js"],
    rules: {
      "no-undef": "error",
      "one-var-declaration-per-line": "warn",
      "consistent-return": "error",
      "no-param-reassign": "warn",
      curly: ["error", "multi-line"],
      "no-shadow": ["error", { allow: ["req", "res", "err"] }],
      "no-console": "warn",
      "no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          caughtErrors: "all",
          ignoreRestSiblings: false,
          reportUsedIgnorePattern: false,
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
