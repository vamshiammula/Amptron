/** @type {import("prettier").Config} */
export default {
  semi: false,
  singleQuote: true,
  printWidth: 84,
  trailingComma: 'all',
  arrowParens: 'always',
  overrides: [
    {
      files: ['*.md', '*.yml', '*.yaml'],
      options: { printWidth: 100 },
    },
  ],
}
