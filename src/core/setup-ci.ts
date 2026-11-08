import fs from 'node:fs'
import path from 'node:path'
import type { SetupCiOptions, SetupCiResult } from '~types'
import { fileExists, writeFile } from '~utils'
import { CI_WORKFLOW_PATH, getCiWorkflow } from './commits'
import { findSharedCiWorkflow, getDefaultBranch } from './setup-commits'

/**
 * Writes the CI caller for perfekt's shared CI workflow. Unless force is set it keeps an existing
 * ci.yml, and any other workflow that already calls the shared CI, so CI never runs twice. It
 * reports each kept file, so the summary can say what --force would overwrite or duplicate.
 */
const setupCi = async (
  options: SetupCiOptions = {},
): Promise<SetupCiResult> => {
  const defaultBranch = getDefaultBranch()
  const kept = [
    ...new Set([
      ...(fileExists(CI_WORKFLOW_PATH) ? [CI_WORKFLOW_PATH] : []),
      ...[findSharedCiWorkflow()].filter((file) => file !== undefined),
    ]),
  ]

  if (!options.force && kept.length > 0) {
    return {
      files: kept.map((file) => ({ path: file, status: 'skipped' })),
      defaultBranch,
    }
  }

  fs.mkdirSync(path.dirname(CI_WORKFLOW_PATH), { recursive: true })
  await writeFile(CI_WORKFLOW_PATH, getCiWorkflow(defaultBranch))

  return {
    files: [{ path: CI_WORKFLOW_PATH, status: 'written' }],
    defaultBranch,
  }
}

export default setupCi
