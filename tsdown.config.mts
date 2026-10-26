import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  clean: true,
  // Dependencies are bundled so perfekt installs with none. cosmiconfig loads TypeScript only
  // for .ts configs, which perfekt doesn't look for, so it stays out of the bundle.
  external: ['typescript'],
  alias: {
    '~': './src/',
  },
})
