import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/modules/**/*.ts', 'src/models/**/*.ts'],
      exclude: ['src/cli/**', 'src/config/**'],
    },
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
