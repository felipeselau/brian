module.exports = {
  // TypeScript and React files
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    // Type check all files (not just staged) to catch type errors
    () => 'tsc --noEmit',
  ],
  // JSON, Markdown, YAML files
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
