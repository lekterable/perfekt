export const COMMITS_WORKFLOW_PATH = '.github/workflows/commitlint.yml'

export const SQUASH_MERGE_NOTE =
  'The workflow lints pull request titles, which become the commit when you squash-merge. A trailing (#N) from GitHub squash is allowed. Run perfekt ci to lint the branch commits too.'

export const isSafeBranchName = (value: string) =>
  /^[A-Za-z0-9._/-]+$/.test(value) && !value.includes('..')

export const COMMITS_REUSABLE_WORKFLOW =
  'lekterable/perfekt/.github/workflows/commitlint.yml@master'

export const CI_WORKFLOW_PATH = '.github/workflows/ci.yml'

export const CI_REUSABLE_WORKFLOW =
  'lekterable/perfekt/.github/workflows/ci.yml@master'

const getBranchLine = (branch?: string) =>
  branch && isSafeBranchName(branch) ? `\n    branches: [${branch}]` : ''

/**
 * The CI caller: pull requests only, so a merge re-runs nothing; drafts start no job in the shared
 * workflow, so ready_for_review starts the first run; a new push cancels the older run.
 */
export const getCiWorkflow = (branch?: string) => `name: CI

# Pull requests only: a merge to the default branch re-runs code the PR already
# checked. Drafts start no job (mark the PR ready once), a new push cancels the
# older run, and the shared job lints the PR title too.
on:
  pull_request:${getBranchLine(branch)}
    types: [opened, synchronize, reopened, ready_for_review]
    paths-ignore:
      - '**/*.md'
      - docs/**
      - LICENSE

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Verify
    permissions:
      contents: read
    uses: ${CI_REUSABLE_WORKFLOW}
`

/**
 * The PR title caller. Next to the shared CI, which lints the title on every run, it only needs to
 * catch a title edited later.
 */
export const getCommitsWorkflow = (
  branch?: string,
  options: { withCi?: boolean } = {},
) => {
  const types = options.withCi ? '[edited]' : '[opened, edited, reopened]'

  return `name: Commitlint

on:
  pull_request:${getBranchLine(branch)}
    types: ${types}

jobs:
  conventional-commits:
    name: Conventional Commits
    permissions:
      contents: read
    uses: ${COMMITS_REUSABLE_WORKFLOW}
`
}
