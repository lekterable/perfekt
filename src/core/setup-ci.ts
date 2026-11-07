import fs from 'node:fs'
import path from 'node:path'
import type { SetupCiOptions, SetupCiResult } from '~types'
import { fileExists, writeFile } from '~utils'
import { CI_WORKFLOW_PATH, getCiWorkflow } from './commits'
import { getDefaultBranch } from './setup-commits'

/** Writes the CI caller for perfekt's shared CI workflow, unless one exists or force is set. */
const setupCi = async (
  options: SetupCiOptions = {},
): Promise<SetupCiResult> => {
  const defaultBranch = getDefaultBranch()

  if (!options.force && fileExists(CI_WORKFLOW_PATH)) {
    return {
      files: [{ path: CI_WORKFLOW_PATH, status: 'skipped' }],
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
