import fs from 'node:fs'
import path from 'node:path'
import type { SetupLintOptions, SetupLintResult } from '~types'
import { getInstallCommand } from './ci'

export const LINT_CONFIG_PATH = 'biome.json'

const CONFIG_FILES = [LINT_CONFIG_PATH, 'biome.jsonc']

// Written as Biome formats it, so the new file passes its own check.
export const LINT_CONFIG = `{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "extends": ["perfekt/biome"]
}
`

const LINT_SCRIPTS = { lint: 'biome check', format: 'biome check --write' }

const readPackageJson = (dir: string) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * Writes a biome.json that extends perfekt's shared config, and adds Biome and perfekt as dev
 * dependencies plus `lint`/`format` scripts to package.json where they are missing.
 */
const setupLint = (options: SetupLintOptions): SetupLintResult => {
  const { dir = process.cwd(), force = false, versions } = options
  const existing = CONFIG_FILES.find((file) =>
    fs.existsSync(path.join(dir, file)),
  )

  if (!force && existing) {
    return {
      files: [{ path: existing, status: 'skipped' }],
      installCommand: null,
    }
  }

  // --force rewrites the config where it is, so a biome.jsonc never ends up next to a biome.json.
  const configPath = existing ?? LINT_CONFIG_PATH
  fs.writeFileSync(path.join(dir, configPath), LINT_CONFIG)

  const packageJson = readPackageJson(dir)

  if (!packageJson) {
    return {
      files: [{ path: configPath, status: 'written' }],
      installCommand: null,
    }
  }

  const installed = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }
  const devDependencies = {
    ...(installed['@biomejs/biome']
      ? {}
      : { '@biomejs/biome': versions.biome }),
    ...(installed.perfekt ? {} : { perfekt: `^${versions.perfekt}` }),
  }
  const scripts = Object.fromEntries(
    Object.entries(LINT_SCRIPTS).filter(
      ([name]) => !packageJson.scripts?.[name],
    ),
  )
  const changed =
    Object.keys(devDependencies).length > 0 || Object.keys(scripts).length > 0

  if (changed) {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      `${JSON.stringify(
        {
          ...packageJson,
          scripts: { ...packageJson.scripts, ...scripts },
          devDependencies: {
            ...packageJson.devDependencies,
            ...devDependencies,
          },
        },
        null,
        2,
      )}\n`,
    )
  }

  const [manager] = getInstallCommand(dir, packageJson)

  return {
    files: [
      { path: configPath, status: 'written' },
      ...(changed
        ? [{ path: 'package.json', status: 'written' as const }]
        : []),
    ],
    installCommand:
      Object.keys(devDependencies).length > 0 ? `${manager} install` : null,
  }
}

export default setupLint
