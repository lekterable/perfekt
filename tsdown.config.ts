import { defineConfig } from 'tsdown'

export default defineConfig({
  // src/bin.ts runs the CLI; the output keeps the cli name
  entry: { cli: 'src/bin.ts' },
  format: 'esm',
  fixedExtension: false,
  platform: 'node',
  target: 'node20',
  clean: true,
  // __dirname for reading package.json
  shims: true,
  // commander and semver are devDependencies, so they are bundled and perfekt installs with none.
  alias: {
    '~': './src/',
  },
})
