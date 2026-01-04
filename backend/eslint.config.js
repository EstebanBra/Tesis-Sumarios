import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/',
      'prisma/migrations/',
      '*.config.js',
      'dist',
      'build',
      'coverage',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Permitir console.warn y console.error
      'no-undef': 'error',
      'no-unused-expressions': 'warn',
      'prefer-const': 'warn',
    },
  },
  prettier, // Debe ser el último para sobrescribir reglas de formato
];

