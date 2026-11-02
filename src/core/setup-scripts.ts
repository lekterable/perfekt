import fs from 'node:fs'
import path from 'node:path'
import type { SetupScriptsOptions, SetupScriptsResult } from '~types'
import { LINT_SCRIPTS, readPackageJson } from './setup-lint'

/** The standard scripts, typecheck only for a TypeScript repo. */
const getStandardScripts = (dir: string): Record<string, string> => ({
  ...LINT_SCRIPTS,
  ...(fs.existsSync(path.join(dir, 'tsconfig.json'))
    ? { typecheck: 'tsc --noEmit' }
    : {}),
  verify: 'perfekt ci',
})

/**
 * Adds the standard lint, format, typecheck and verify scripts to package.json where they are
 * missing; force overwrites them.
 */
const setupScripts = (options: SetupScriptsOptions): SetupScriptsResult => {
  const { dir = process.cwd(), force = false } = options
  const packageJson = readPackageJson(dir)

  if (!packageJson) {
    return {
      files: [{ path: 'package.json', status: 'skipped' }],
      scripts: [],
    }
  }

  const scripts = Object.fromEntries(
    Object.entries(getStandardScripts(dir)).filter(
      ([name, command]) =>
        packageJson.scripts?.[name] !== command &&
        (force || !packageJson.scripts?.[name]),
    ),
  )
  const names = Object.keys(scripts)

  if (names.length === 0) {
    return {
      files: [{ path: 'package.json', status: 'skipped' }],
      scripts: [],
    }
  }

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    `${JSON.stringify(
      { ...packageJson, scripts: { ...packageJson.scripts, ...scripts } },
      null,
      2,
    )}\n`,
  )

  return {
    files: [{ path: 'package.json', status: 'written' }],
    scripts: names,
  }
}

export default setupScripts
