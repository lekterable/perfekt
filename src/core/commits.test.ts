import fs from 'fs'
import path from 'path'
import { COMMITS_REUSABLE_WORKFLOW, getCommitsWorkflow } from './commits'

const repoRoot = path.resolve(__dirname, '../..')

describe('commits', () => {
  it('should call the shared PR title workflow from the template', () => {
    expect(getCommitsWorkflow()).toContain(`uses: ${COMMITS_REUSABLE_WORKFLOW}`)
    expect(
      fs.existsSync(path.join(repoRoot, '.github/workflows/commitlint.yml')),
    ).toBe(true)
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
})
