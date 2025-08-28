import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    rules: {
      // Clean Architecture Rules
      'no-console': 'warn',
      'no-unused-vars': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      
      // Code Quality
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      
      // Clean Code Principles  
      'no-duplicate-imports': 'error',
      
      // Best Practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'backups/',
      'coverage/',
      'exports/',
      'assets/',
      'public/*.html',
    ],
  },
];
