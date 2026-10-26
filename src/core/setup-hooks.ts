import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { SetupHooksOptions, SetupHooksResult } from '~types'

export const HOOKS_DIR = '.githooks'

const readPackageJson = (dir: string) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  } catch {
    return undefined
  }
}

const hasPerfekt = (packageJson: unknown) =>
  typeof packageJson === 'object' &&
  packageJson !== null &&
  ['dependencies', 'devDependencies'].some(
    (field) =>
      (packageJson as Record<string, Record<string, string> | undefined>)[field]
        ?.perfekt,
  )

// A repo with perfekt installed runs its own copy; any other one fetches the same major through npx.
export const getCommitMsgHook = (installed: boolean, major: string) =>
  `#!/bin/sh
# Lints each commit message with perfekt's shared commit rules
exec npx ${installed ? '--no -- perfekt' : `--yes perfekt@${major}`} lint --edit "$1"
`

const setGitHooksPath = (dir: string) => {
  try {
    execFileSync('git', ['config', 'core.hooksPath', HOOKS_DIR], {
      cwd: dir,
      stdio: 'pipe',
    })
    return true
  } catch {
    return false
  }
}

/**
 * Writes a commit-msg hook that runs `perfekt lint --edit`. Husky repos get it in
 * `.husky/`; others get `.githooks/`, set as git's hooks path here and, through a
 * `prepare` script, in every other clone on install.
 */
const setupHooks = (options: SetupHooksOptions): SetupHooksResult => {
  const { dir = process.cwd(), force = false, major } = options
  const husky = fs.existsSync(path.join(dir, '.husky'))
  const hooksDir = husky ? '.husky' : HOOKS_DIR
  const hookPath = `${hooksDir}/commit-msg`
  const packageJson = readPackageJson(dir)

  if (!force && fs.existsSync(path.join(dir, hookPath))) {
    return {
      files: [{ path: hookPath, status: 'skipped' }],
      hooksPath: null,
      clonesNeed: null,
    }
  }

  fs.mkdirSync(path.join(dir, hooksDir), { recursive: true })
  fs.writeFileSync(
    path.join(dir, hookPath),
    getCommitMsgHook(hasPerfekt(packageJson), major),
  )
  fs.chmodSync(path.join(dir, hookPath), 0o755)

  if (husky) {
    return {
      files: [{ path: hookPath, status: 'written' }],
      hooksPath: null,
      clonesNeed: null,
    }
  }

  const prepare = `git config core.hooksPath ${HOOKS_DIR}`
  const existingPrepare: string | undefined = packageJson?.scripts?.prepare
  const addPrepare = packageJson !== undefined && !existingPrepare

  if (addPrepare) {
    const updated = {
      ...packageJson,
      scripts: { ...packageJson.scripts, prepare },
    }
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      `${JSON.stringify(updated, null, 2)}\n`,
    )
  }

  return {
    files: [
      { path: hookPath, status: 'written' },
      ...(addPrepare
        ? [{ path: 'package.json', status: 'written' as const }]
        : []),
    ],
    hooksPath: setGitHooksPath(dir) ? HOOKS_DIR : null,
    // Without a prepare script to set it, every other clone has to set the hooks path by hand.
    clonesNeed:
      addPrepare || existingPrepare?.includes('core.hooksPath')
        ? null
        : prepare,
  }
}

export default setupHooks
