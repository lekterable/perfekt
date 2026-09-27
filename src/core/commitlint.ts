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

export const DEFAULT_BRANCH = 'master'
export const INIT_COMMIT = 'feat: init :seedling:'

export const COMMITLINT_CONFIG_PATH = 'commitlint.config.cjs'
export const HUSKY_COMMIT_MSG_PATH = '.husky/commit-msg'
export const COMMITLINT_CI_WORKFLOW_PATH = '.github/workflows/commitlint.yml'

export const HUSKY_COMMIT_MSG = 'npx --no -- commitlint --edit "$1"\n'

export const SQUASH_MERGE_NOTE =
  'GitHub squash titles still need repo settings or merge habit to strip (#N). commitlint only catches local commits, and CI if you add --ci.'

export const subjectHasGithubRef = (subject?: string | null) =>
  Boolean(subject && /\(#\d+\)/.test(subject))

export const subjectNoGithubRef = (parsed: { subject?: string | null }) => {
  const pass = !subjectHasGithubRef(parsed.subject)

  return [
    pass,
    'subject must not contain a GitHub squash reference like (#123)'
  ] as const
}

export const COMMITLINT_CONFIG_CJS = `// Default branch is always master (never main).
// First commit is always feat: init :seedling: and must pass.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-no-github-ref': ({ subject }) => {
          const pass = !subject || !/\\(#\\d+\\)/.test(subject)
          return [
            pass,
            'subject must not contain a GitHub squash reference like (#123)'
          ]
        }
      }
    }
  ],
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
    'subject-full-stop': [2, 'never', '.'],
    'subject-no-github-ref': [2, 'always']
  }
}
`

export const COMMITLINT_CI_WORKFLOW = `name: Commitlint

on:
  pull_request:
    branches: [master]
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
