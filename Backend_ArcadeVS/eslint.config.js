/**
 * Configuracion minima de ESLint (flat config) para el backend.
 * Reglas base para codigo ESM moderno; se endurecera en iteraciones futuras.
 */

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
];
