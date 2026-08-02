import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // scripts/.*.cjs are esbuild output, not source.
  { ignores: ['dist', 'scripts/.*.cjs'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // The shell renders the hub, which must not carry any game's code: every
  // game is reached through the registry's dynamic import and builds to its own
  // chunk. The hub's preview art therefore duplicates a few colours rather than
  // importing the games it depicts, and this rule is what keeps that honest
  // when the duplication later looks like something worth "tidying up".
  {
    files: ['src/shell/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/games/*', '**/games/**'],
              message:
                'The shell must not import game code. Games are reached only through registry load(), so that each one stays in its own lazily loaded chunk.',
            },
          ],
        },
      ],
    },
  },
  // The check scripts run in Node, not the browser.
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  }
);
