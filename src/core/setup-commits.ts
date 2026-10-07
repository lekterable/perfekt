import fs from 'fs'
import path from 'path'
import { fileExists, writeFile } from '~utils'
import exec from '~utils/misc/exec'
import getPackageManager from '~utils/npm/get-package-manager'
import {
  PackageManagerName,
  SetupCommitsOptions,
  SetupCommitsResult
} from '~types'
import {
  COMMITLINT_CI_WORKFLOW_PATH,
  COMMITLINT_CONFIG_CJS,
  COMMITLINT_CONFIG_PATH,
  HUSKY_COMMIT_MSG,
  HUSKY_COMMIT_MSG_PATH,
  LEKTERABLE_TIP,
  getCommitlintCiWorkflow,
  isSafeBranchName
} from './commitlint'

const installCommands: Record<PackageManagerName, string> = {
  pnpm: 'pnpm add -D @commitlint/cli husky perfekt',
  npm: 'npm install -D @commitlint/cli husky perfekt',
  yarn: 'yarn add -D @commitlint/cli husky perfekt'
}

type ScaffoldFile = {
  path: string
  content: string
  executable?: boolean
}

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
    'git symbolic-ref --quiet --short refs/remotes/origin/HEAD'
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

export const getCommitlintInstallCommand = (
  packageManager: PackageManagerName
) => installCommands[packageManager]

export const getPrepareHint = () => {
  if (!fileExists('package.json')) {
    return 'Add "prepare": "husky" to package.json scripts'
  }

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
      scripts?: { prepare?: string }
    }

    if (pkg.scripts?.prepare?.includes('husky')) {
      return 'package.json already runs husky in scripts.prepare'
    }
  } catch {
    return 'Add "prepare": "husky" to package.json scripts'
  }

  return 'Add "prepare": "husky" to package.json scripts'
}

const writeScaffoldFile = async (
  file: ScaffoldFile,
  force: boolean
): Promise<SetupCommitsResult['files'][number]> => {
  if (!force && fileExists(file.path)) {
    return { path: file.path, status: 'skipped' }
  }

  const directory = path.dirname(file.path)

  if (directory !== '.') {
    fs.mkdirSync(directory, { recursive: true })
  }

  await writeFile(file.path, file.content)

  if (file.executable) {
    fs.chmodSync(file.path, 0o755)
  }

  return { path: file.path, status: 'written' }
}

export const getScaffoldFiles = (
  ci: boolean,
  defaultBranch: string | null = null
): ScaffoldFile[] => [
  { path: COMMITLINT_CONFIG_PATH, content: COMMITLINT_CONFIG_CJS },
  {
    path: HUSKY_COMMIT_MSG_PATH,
    content: HUSKY_COMMIT_MSG,
    executable: true
  },
  ...(ci
    ? [
        {
          path: COMMITLINT_CI_WORKFLOW_PATH,
          content: getCommitlintCiWorkflow(defaultBranch)
        }
      ]
    : [])
]

const setupCommits = async (
  options: SetupCommitsOptions = {}
): Promise<SetupCommitsResult> => {
  const packageManager = getPackageManager()
  const defaultBranch = getDefaultBranch()
  const files = await Promise.all(
    getScaffoldFiles(Boolean(options.ci), defaultBranch).map(file =>
      writeScaffoldFile(file, Boolean(options.force))
    )
  )

  return {
    files,
    packageManager,
    installCommand: getCommitlintInstallCommand(packageManager),
    prepareHint: getPrepareHint(),
    defaultBranch,
    lekterableTip: LEKTERABLE_TIP
  }
}

export default setupCommits
