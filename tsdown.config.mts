import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  clean: true,
  alias: {
    '~': './src/'
  }
})
