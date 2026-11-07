import fs from 'node:fs'
import path from 'node:path'
import type { SetupCommitsOptions, SetupCommitsResult } from '~types'
import { fileExists, writeFile } from '~utils'
import exec from '~utils/misc/exec'
import {
  CI_REUSABLE_WORKFLOW,
  COMMITS_WORKFLOW_PATH,
  getCommitsWorkflow,
  isSafeBranchName,
} from './commits'

// Any ref of the shared CI counts, not only @master
const SHARED_CI = `${CI_REUSABLE_WORKFLOW.split('@')[0]}@`

const WORKFLOWS_DIRECTORY = '.github/workflows'

const readWorkflow = (file: string) => {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

const listWorkflows = () => {
  try {
    return fs
      .readdirSync(WORKFLOWS_DIRECTORY)
      .filter((name) => /\.ya?ml$/.test(name))
      .map((name) => path.join(WORKFLOWS_DIRECTORY, name))
  } catch {
    return []
  }
}

/**
 * The workflow that calls perfekt's shared CI, which lints the PR title on every run: any file
 * name, any ref, and only on a line that isn't a comment.
 */
export const findSharedCiWorkflow = () =>
  listWorkflows().find((file) =>
    readWorkflow(file)
      .split('\n')
      .some(
        (line) => !line.trimStart().startsWith('#') && line.includes(SHARED_CI),
      ),
  )

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

  return undefined
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
  await writeFile(
    COMMITS_WORKFLOW_PATH,
    getCommitsWorkflow(defaultBranch, {
      withCi: findSharedCiWorkflow() !== undefined,
    }),
  )

  return {
    files: [{ path: COMMITS_WORKFLOW_PATH, status: 'written' }],
    defaultBranch,
  }
}

export default setupCommits
