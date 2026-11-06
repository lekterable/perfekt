import fs from 'node:fs'
import path from 'node:path'
import { COMMITS_REUSABLE_WORKFLOW, getCommitsWorkflow } from './commits'

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

  it('should skip title lint only on synchronize', () => {
    expect(reusableWorkflow).toContain("github.event.action != 'synchronize'")
  })

  it('should still lint titles when a draft becomes ready for review', () => {
    expect(reusableWorkflow).toContain('ready_for_review')
  })
})
