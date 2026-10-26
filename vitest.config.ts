import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^~(.+)$/,
        replacement: `${path.resolve(import.meta.dirname, 'src')}/$1`,
      },
    ],
  },
  test: {
    globals: true,
    mockReset: true,
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
    coverage: { include: ['src/**/*.ts'], reporter: ['text', 'lcov'] },
  },
})
