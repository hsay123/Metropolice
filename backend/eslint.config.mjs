// @ts-check
/** @type {import("eslint").Linter.Config[]} */

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-console": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
    ],
  },
];
