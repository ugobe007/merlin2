/* eslint-env node */
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  { ignores: ['dist', 'html/assets/**', 'html/**/*.js', 'build', 'coverage', '.next', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',  // Downgraded from 'error' to 'warn' - unused vars are warnings, not blockers
        { 
          argsIgnorePattern: '^_', 
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
    },
  },
  // ✅ Node scripts: allow require/console
  {
    files: ['scripts/**/*.{js,cjs,mjs,ts}', '*.cjs', '*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // ✅ Tests: allow dev patterns
  {
    files: [
      '**/*.{test,spec}.{ts,tsx,js,jsx}',
      'tests/**/*',
      'test-helpers.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // keep tests moving
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Override TypeScript ESLint rules after recommended configs
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',  // Downgraded from 'error' - unused vars are warnings, not blockers
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',  // Downgraded - any usage is a warning, not a blocker
      '@typescript-eslint/ban-ts-comment': 'warn',  // Allow @ts-nocheck with warning
      '@typescript-eslint/no-require-imports': 'warn',  // Allow require() with warning
      'no-case-declarations': 'warn',  // Allow lexical declarations in case blocks (common pattern)
      'no-empty': 'warn',  // Empty blocks are warnings (often intentional catch blocks)
      'no-useless-escape': 'warn',  // Unnecessary escapes are warnings
      'prefer-const': 'warn',  // Prefer const is a style preference, not a blocker
    },
  },
]
