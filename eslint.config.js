// Held at ESLint 9 on purpose. ESLint 10 is out and would clear the npm audit
// warning about brace-expansion, but eslint-plugin-react still caps its peer
// range at ^9.7, so upgrading means dropping that plugin. The advisory is a DoS
// against the lint process itself and nothing here reaches the built bundle.
// Revisit once eslint-plugin-react ships v10 support.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist/**', 'coverage/**'] },

  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // No TypeScript and no runtime prop validation in this project; the rule
      // would fire on every component without adding a real check.
      'react/prop-types': 'off'
    }
  },

  {
    files: ['**/*.test.{js,jsx}', 'src/test/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    }
  },

  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node }
  }
];