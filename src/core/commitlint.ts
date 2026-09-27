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

export const COMMITLINT_CONFIG_CJS = `module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
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
      ]
    ],
    'subject-full-stop': [2, 'never', '.']
  }
}
`

export const getCommitlintCiWorkflow = (branch?: string | null) => {
  const branchLine =
    branch && isSafeBranchName(branch) ? `\n    branches: [${branch}]` : ''

  return `name: Commitlint

on:
  pull_request:${branchLine}
    types: [opened, edited, reopened, synchronize]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install --no-package-lock --no-save @commitlint/cli@20 @commitlint/config-conventional@20
      - name: Lint PR title
        env:
          PR_TITLE: \${{ github.event.pull_request.title }}
        run: echo "$PR_TITLE" | npx --no commitlint
`
}

export const COMMITLINT_CI_WORKFLOW = getCommitlintCiWorkflow()
