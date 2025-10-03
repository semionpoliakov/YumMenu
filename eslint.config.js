const js = require('@eslint/js');
const tanstackQuery = require('@tanstack/eslint-plugin-query');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const importPlugin = require('eslint-plugin-import');
const sonarjsPlugin = require('eslint-plugin-sonarjs');
const prettierConfig = require('eslint-config-prettier');
const tseslint = require('typescript-eslint');

module.exports = (async () => {
  const [markdownModule, jsonModule, unicornModule] = await Promise.all([
    import('@eslint/markdown'),
    import('@eslint/json'),
    import('eslint-plugin-unicorn'),
  ]);

  const markdownConfigs = markdownModule.default?.configs ?? markdownModule.configs;
  const jsonConfigs = jsonModule.default?.configs ?? jsonModule.configs;
  const unicornPlugin = unicornModule.default ?? unicornModule;

  const markdownRecommended = markdownConfigs?.recommended ?? [];
  const jsonRecommended = jsonConfigs?.recommended ?? [];

  return tseslint.config(
    {
      ignores: ['.next/**', 'node_modules/**', 'dist/**', 'eslint.config.js'],
    },
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, prettierConfig],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: ['./tsconfig.json'],
          tsconfigRootDir: __dirname,
        },
      },
      settings: {
        react: {
          version: 'detect',
        },
        'import/resolver': {
          typescript: true,
        },
      },
      plugins: {
        react: reactPlugin,
        'react-hooks': reactHooksPlugin,
        'jsx-a11y': jsxA11yPlugin,
        import: importPlugin,
        sonarjs: sonarjsPlugin,
        unicorn: unicornPlugin,
        tanstack: tanstackQuery,
      },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'tanstack/exhaustive-deps': 'warn',
        'import/order': [
          'warn',
          {
            alphabetize: { order: 'asc', caseInsensitive: true },
            'newlines-between': 'always',
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
              'object',
              'type',
            ],
          },
        ],
        'unicorn/prefer-node-protocol': 'warn',
        'sonarjs/no-duplicate-string': 'warn',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-uses-react': 'off',
        '@typescript-eslint/require-await': 'off',
      },
    },
    ...(Array.isArray(markdownRecommended) ? markdownRecommended : [markdownRecommended]),
    ...(Array.isArray(jsonRecommended) ? jsonRecommended : [jsonRecommended]),
    {
      files: ['next-env.d.ts'],
      rules: {
        '@typescript-eslint/triple-slash-reference': 'off',
      },
    },
  );
})();
