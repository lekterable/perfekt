import fs from 'node:fs'
import path from 'node:path'
import type { SetupCommitsOptions, SetupCommitsResult } from '~types'
import { fileExists, writeFile } from '~utils'
import exec from '~utils/misc/exec'
import {
  COMMITS_WORKFLOW_PATH,
  getCommitsWorkflow,
  isSafeBranchName,
} from './commits'

const readGitLine = (command: string) => {
  try {
    const value = exec(command)?.toString().trim()
    return value || undefined
  } catch {
    return undefined
  }
}

export const getDefaultBranch = () => {
  const originHead = readGitLine(
    'git symbolic-ref --quiet --short refs/remotes/origin/HEAD',
  )
  const fromOrigin = originHead?.replace(/^origin\//, '')

  if (fromOrigin && isSafeBranchName(fromOrigin)) return fromOrigin

  const configured = readGitLine('git config --get init.defaultBranch')

  if (configured && isSafeBranchName(configured)) return configured

  const current = readGitLine('git branch --show-current')

  if (
    (current === 'main' || current === 'master') &&
    isSafeBranchName(current)
  ) {
    return current
  }

  return null
}

const setupCommits = async (
  options: SetupCommitsOptions = {},
): Promise<SetupCommitsResult> => {
  const defaultBranch = getDefaultBranch()

  if (!options.force && fileExists(COMMITS_WORKFLOW_PATH)) {
    return {
      files: [{ path: COMMITS_WORKFLOW_PATH, status: 'skipped' }],
      defaultBranch,
    }
  }

  fs.mkdirSync(path.dirname(COMMITS_WORKFLOW_PATH), { recursive: true })
  await writeFile(COMMITS_WORKFLOW_PATH, getCommitsWorkflow(defaultBranch))

  return {
    files: [{ path: COMMITS_WORKFLOW_PATH, status: 'written' }],
    defaultBranch,
  }
}

export default setupCommits
