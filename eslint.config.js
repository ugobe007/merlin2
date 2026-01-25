import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  {
    files: ["eslint.config.js", "**/*.config.{js,ts}", "**/*.cjs", "**/*.mjs", "scripts/**/*.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
  { ignores: ['dist', 'html/assets/**', 'html/**/*.js', 'build', 'coverage', '.next', 'node_modules', "/*.js", "/comprehensive_pricing_demo.js", "**/*.js", "**/*.{mjs,cjs}", "tests/**/*"] },
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
  // Apply base configs first (so we can override them)
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // ✅ GLOBAL OVERRIDES: Apply downgrades to ALL TS/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // A3: Disable @typescript-eslint/no-unused-vars (unused-imports handles it)
      '@typescript-eslint/no-unused-vars': 'off',
      // Legacy integration seams: warn, don't block
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      // Style preferences: warn, don't block
      'no-case-declarations': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
    },
  },
  
  // ✅ Tests: allow dev patterns (more permissive than global)
  {
    files: [
      '**/*.{test,spec}.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx}',
      'tests/**/*',
      'test-helpers.ts',
      '**/*-test.{ts,tsx}',
      '**/*-tests.{ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'off',
      'no-console': 'off',
      'no-undef': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-useless-escape': 'off',
    },
  },
  
  // 🎯 WIZARD: Strict zone - Step 3 and core wizard (keep quality high)
  {
    files: ['src/components/wizard/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'unused-imports/no-unused-vars': 'error',
      'no-useless-escape': 'error',
    },
  },
  
  // 🎯 STEP 3 SSOT: Belt + suspenders (maximum strictness)
  {
    files: ['src/components/wizard/v6/step3/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'unused-imports/no-unused-vars': 'error',
      'no-useless-escape': 'error',
      'no-case-declarations': 'error',
    },
  },
  
  // 🧯 LEGACY ZONES: Relax rules (tech debt acknowledged)
  {
    files: [
      'src/services/**/*.{ts,tsx}',
      "src/components/wizard/_archive-jan-2026/**",
"src/components/wizard/**/_archive-*/**",
      'src/components/admin/**/*.{ts,tsx}',
      'src/components/examples/**/*.{ts,tsx}',
      'src/infrastructure/**/*.{ts,tsx}',
      'src/components/modals/**/*.{ts,tsx}',
      'src/components/VendorPortal.tsx',
      'src/components/ProjectInfoForm.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-useless-escape': 'off',
    },
  },
]
