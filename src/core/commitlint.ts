export const COMMIT_TYPES = [
  'feat',
  'fix',
  'chore',
  'refactor',
  'docs',
  'test',
  'ci',
  'build',
  'style',
  'perf',
  'revert'
] as const

export const INIT_COMMIT = 'feat: init :seedling:'

export const COMMITLINT_CONFIG_PATH = 'commitlint.config.cjs'
export const HUSKY_COMMIT_MSG_PATH = '.husky/commit-msg'
export const COMMITLINT_CI_WORKFLOW_PATH = '.github/workflows/commitlint.yml'

export const HUSKY_COMMIT_MSG = 'npx --no -- commitlint --edit "$1"\n'

export const SQUASH_MERGE_NOTE =
  'commitlint catches local commits, and CI if you add --ci. A trailing (#N) from GitHub squash is allowed.'

export const LEKTERABLE_TIP =
  'lekterable repos use master and first commit feat: init :seedling:. Advisory only. Setup does not fail on other default branches.'

export const isSafeBranchName = (value: string) =>
  /^[A-Za-z0-9._/-]+$/.test(value) && !value.includes('..')

export const SHARED_COMMITLINT_CONFIG = 'perfekt/commitlint'

export const COMMITLINT_CONFIG_CJS = `module.exports = {
  extends: [require.resolve('${SHARED_COMMITLINT_CONFIG}')]
}
`

export const COMMITLINT_REUSABLE_WORKFLOW =
  'lekterable/perfekt/.github/workflows/commitlint.yml@master'

export const getCommitlintCiWorkflow = (branch?: string | null) => {
  const branchLine =
    branch && isSafeBranchName(branch) ? `\n    branches: [${branch}]` : ''

  return `name: Commitlint

on:
  pull_request:${branchLine}
    types: [opened, edited, reopened, synchronize]

jobs:
  pr-title:
    permissions:
      contents: read
    uses: ${COMMITLINT_REUSABLE_WORKFLOW}
`
}

export const COMMITLINT_CI_WORKFLOW = getCommitlintCiWorkflow()
