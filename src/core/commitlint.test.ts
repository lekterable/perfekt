import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import {
  COMMITLINT_CI_WORKFLOW,
  COMMITLINT_CONFIG_CJS,
  COMMITLINT_CONFIG_PATH,
  INIT_COMMIT,
  subjectHasGithubRef,
  subjectNoGithubRef
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
  it('should keep the repo config in sync with the scaffold', () => {
    expect(
      fs.readFileSync(path.join(repoRoot, COMMITLINT_CONFIG_PATH), 'utf8')
    ).toBe(COMMITLINT_CONFIG_CJS)
  })

  it('should detect GitHub squash references in subjects', () => {
    expect(subjectHasGithubRef('add x (#12)')).toBe(true)
    expect(subjectHasGithubRef('add x')).toBe(false)
    expect(subjectHasGithubRef(undefined)).toBe(false)
  })

  it('should return a failing commitlint outcome for squash references', () => {
    expect(subjectNoGithubRef({ subject: 'add x (#99)' })[0]).toBe(false)
    expect(subjectNoGithubRef({ subject: 'add x' })[0]).toBe(true)
  })

  it('should include a PR title workflow in the optional CI template', () => {
    expect(COMMITLINT_CI_WORKFLOW).toContain('pull_request')
    expect(COMMITLINT_CI_WORKFLOW).not.toContain('branches: [master]')
    expect(COMMITLINT_CI_WORKFLOW).toContain('echo "$PR_TITLE"')
    expect(COMMITLINT_CI_WORKFLOW).toContain('npx --no commitlint')
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
    ['content: add page', 1]
  ])('should lint %s with status %s', (message, status) => {
    expect(lintCommit(message).status).toBe(status)
  })
})
