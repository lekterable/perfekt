import fs from 'node:fs'
import path from 'node:path'
import type { SetupCiOptions, SetupCiResult } from '~types'
import { fileExists, writeFile } from '~utils'
import { CI_WORKFLOW_PATH, getCiWorkflow } from './commits'
import { findSharedCiWorkflow, getDefaultBranch } from './setup-commits'

/**
 * Writes the CI caller for perfekt's shared CI workflow. Unless force is set it keeps an existing
 * ci.yml, and any other workflow that already calls the shared CI, so CI never runs twice.
 */
const setupCi = async (
  options: SetupCiOptions = {},
): Promise<SetupCiResult> => {
  const defaultBranch = getDefaultBranch()
  const existing = fileExists(CI_WORKFLOW_PATH)
    ? CI_WORKFLOW_PATH
    : findSharedCiWorkflow()

  if (!options.force && existing) {
    return {
      files: [{ path: existing, status: 'skipped' }],
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
