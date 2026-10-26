export const INIT_COMMIT = 'feat: init :seedling:'

export const COMMITS_WORKFLOW_PATH = '.github/workflows/commitlint.yml'

export const SQUASH_MERGE_NOTE =
  'The workflow lints pull request titles, which become the commit when you squash-merge. A trailing (#N) from GitHub squash is allowed. Run perfekt ci to lint the branch commits too.'

export const LEKTERABLE_TIP =
  'lekterable repos use master and first commit feat: init :seedling:. Advisory only. Setup does not fail on other default branches.'

export const isSafeBranchName = (value: string) =>
  /^[A-Za-z0-9._/-]+$/.test(value) && !value.includes('..')

export const COMMITS_REUSABLE_WORKFLOW =
  'lekterable/perfekt/.github/workflows/commitlint.yml@master'

export const getCommitsWorkflow = (branch?: string | null) => {
  const branchLine =
    branch && isSafeBranchName(branch) ? `\n    branches: [${branch}]` : ''

  return `name: Commitlint

on:
  pull_request:${branchLine}
    types: [opened, edited, reopened, synchronize]

jobs:
  commitlint:
    name: Commitlint
    permissions:
      contents: read
    uses: ${COMMITS_REUSABLE_WORKFLOW}
`
}
