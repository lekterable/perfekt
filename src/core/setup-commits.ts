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
    return (
      fs
        .readdirSync(WORKFLOWS_DIRECTORY)
        .filter((name) => /\.ya?ml$/.test(name))
        // posix, so the path matches CI_WORKFLOW_PATH on Windows too
        .map((name) => path.posix.join(WORKFLOWS_DIRECTORY, name))
    )
  } catch {
    return []
  }
}

/**
 * The workflows that call perfekt's shared CI, which lints the PR title on every run: any file
 * name, any ref, and only outside a YAML comment.
 */
export const findSharedCiWorkflows = () =>
  listWorkflows().filter((file) =>
    readWorkflow(file)
      .split(/\r?\n/)
      .some((line) => line.replace(/(^|\s)#.*$/, '').includes(SHARED_CI)),
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

  const editsOnly = findSharedCiWorkflows().length > 0

  fs.mkdirSync(path.dirname(COMMITS_WORKFLOW_PATH), { recursive: true })
  await writeFile(
    COMMITS_WORKFLOW_PATH,
    getCommitsWorkflow(defaultBranch, { withCi: editsOnly }),
  )

  return {
    files: [{ path: COMMITS_WORKFLOW_PATH, status: 'written' }],
    defaultBranch,
    editsOnly,
  }
}

export default setupCommits
