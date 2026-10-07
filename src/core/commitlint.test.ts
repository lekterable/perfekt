import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import {
  COMMITLINT_CI_WORKFLOW,
  COMMITLINT_CONFIG_CJS,
  COMMITLINT_CONFIG_PATH,
  COMMITLINT_REUSABLE_WORKFLOW,
  INIT_COMMIT,
  SHARED_COMMITLINT_CONFIG,
  getCommitlintCiWorkflow
} from './commitlint'

const repoRoot = path.resolve(__dirname, '../..')
const commitlintBin = path.join(repoRoot, 'node_modules/.bin/commitlint')

const lintCommit = (message: string) =>
  spawnSync(commitlintBin, [], {
    cwd: repoRoot,
    encoding: 'utf8',
    input: `${message}\n`
  })

describe('commitlint', () => {
  it('should scaffold a config that extends the shared rules', () => {
    expect(COMMITLINT_CONFIG_CJS).toContain(
      `require.resolve('${SHARED_COMMITLINT_CONFIG}')`
    )
    expect(
      fs.readFileSync(path.join(repoRoot, COMMITLINT_CONFIG_PATH), 'utf8')
    ).toContain("'./commitlint.cjs'")
  })

  it('should export the shared rules from the package', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
    )

    expect(packageJson.exports['./commitlint']).toBe('./commitlint.cjs')
    expect(packageJson.files).toContain('commitlint.cjs')
  })

  it('should call the shared PR title workflow from the optional CI template', () => {
    expect(COMMITLINT_CI_WORKFLOW).toContain('pull_request')
    expect(COMMITLINT_CI_WORKFLOW).not.toContain('branches: [master]')
    expect(COMMITLINT_CI_WORKFLOW).toContain(
      `uses: ${COMMITLINT_REUSABLE_WORKFLOW}`
    )
    expect(
      fs.existsSync(path.join(repoRoot, '.github/workflows/commitlint.yml'))
    ).toBe(true)
  })

  it('should pin the CI template to a detected branch when one is given', () => {
    expect(getCommitlintCiWorkflow('main')).toContain('branches: [main]')
    expect(getCommitlintCiWorkflow('master')).toContain('branches: [master]')
    expect(getCommitlintCiWorkflow()).not.toContain('branches:')
    expect(getCommitlintCiWorkflow('bad branch')).not.toContain('branches:')
  })

  it('should not encode a master-only lock in the overlay', () => {
    expect(COMMITLINT_CONFIG_CJS).not.toContain(
      'Default branch is always master (never main).'
    )
    expect(COMMITLINT_CONFIG_CJS).not.toContain('subject-no-github-ref')
  })

  it('should accept the required first commit subject', () => {
    expect(lintCommit(INIT_COMMIT).status).toBe(0)
  })

  it.each([
    [INIT_COMMIT, 0],
    ['feat(web): add x', 0],
    ['chore(release): 3.1.0', 0],
    ['feat: add x.', 1],
    ['feat: add x (#12)', 0],
    ['wip: try this', 1],
    ['content: add page', 1],
    ['Feat: add x', 1],
    ['feat: Add x', 1],
    [`feat: ${'add '.repeat(17)}x`, 1]
  ])('should lint %s with status %s', (message, status) => {
    expect(lintCommit(message).status).toBe(status)
  })

  it.each([
    ['feat: added x', 'subject-imperative'],
    ['feat: adding x', 'subject-imperative'],
    ['fix: fixes x', 'subject-imperative'],
    [
      'feat: add a subject that runs well past the fifty character mark',
      'subject-max-length'
    ]
  ])('should warn on %s without failing', (message, rule) => {
    const result = lintCommit(message)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain(rule)
  })

  it.each([
    'feat: add x',
    'fix: address x',
    'refactor: focus x',
    'chore: bump x',
    'feat: embed x',
    'chore(release): 3.1.0'
  ])('should not warn on %s', message => {
    expect(lintCommit(message).stdout).not.toContain('subject-imperative')
  })
})
