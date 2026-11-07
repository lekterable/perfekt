import fs from 'node:fs'
import path from 'node:path'
import {
  CI_REUSABLE_WORKFLOW,
  COMMITS_REUSABLE_WORKFLOW,
  getCiWorkflow,
  getCommitsWorkflow,
} from './commits'

const repoRoot = path.resolve(__dirname, '../..')
const reusableWorkflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/commitlint.yml'),
  'utf8',
)

describe('commits', () => {
  it('should call the shared PR title workflow from the template', () => {
    expect(getCommitsWorkflow()).toContain(`uses: ${COMMITS_REUSABLE_WORKFLOW}`)
    expect(
      fs.existsSync(path.join(repoRoot, '.github/workflows/commitlint.yml')),
    ).toBe(true)
  })

  it('should keep workflow_call on the reusable title workflow', () => {
    expect(reusableWorkflow).toContain('workflow_call:')
  })

  it.each([
    [undefined, undefined],
    ['main', 'branches: [main]'],
    ['bad branch', undefined],
  ])('should pin the template for branch %j to %j', (branch, line) => {
    const workflow = getCommitsWorkflow(branch)

    if (line) expect(workflow).toContain(line)
    else expect(workflow).not.toContain('branches:')
  })

  it('should not subscribe new callers to pull request synchronize', () => {
    expect(getCommitsWorkflow('master')).not.toContain('synchronize')
  })

  it('should subscribe new callers to title-changing pull request events', () => {
    const workflow = getCommitsWorkflow('master')
    expect(workflow).toContain('opened')
    expect(workflow).toContain('edited')
    expect(workflow).toContain('reopened')
  })

  it('should subscribe only title edits next to the shared CI', () => {
    expect(getCommitsWorkflow('master', { withCi: true })).toContain(
      'types: [edited]',
    )
  })

  it('should run the shared CI on ready pull requests only', () => {
    const workflow = getCiWorkflow('master')

    expect(workflow).toContain(`uses: ${CI_REUSABLE_WORKFLOW}`)
    expect(workflow).toContain(
      'types: [opened, synchronize, reopened, ready_for_review]',
    )
    expect(workflow).toContain(
      `group: \${{ github.workflow }}-\${{ github.ref }}`,
    )
    expect(workflow).not.toContain('push:')
  })

  it.each([
    ["github.event.action != 'synchronize'"],
    ['!github.event.pull_request.draft'],
    [
      "github.event.action != 'edited' || github.event.changes.title.from != null",
    ],
  ])('should skip title lint unless %s', (condition) => {
    expect(reusableWorkflow).toContain(condition)
  })
})
