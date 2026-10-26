import fs from 'fs'
import path from 'path'
import { COMMITS_REUSABLE_WORKFLOW, getCommitsWorkflow } from './commits'

const repoRoot = path.resolve(__dirname, '../..')

describe('commits', () => {
  it('should call the shared PR title workflow from the template', () => {
    const workflow = getCommitsWorkflow()

    expect(workflow).toContain('pull_request')
    expect(workflow).not.toContain('branches:')
    expect(workflow).toContain(`uses: ${COMMITS_REUSABLE_WORKFLOW}`)
    expect(
      fs.existsSync(path.join(repoRoot, '.github/workflows/commitlint.yml')),
    ).toBe(true)
  })

  it('should pin the template to a detected branch when one is given', () => {
    expect(getCommitsWorkflow('main')).toContain('branches: [main]')
    expect(getCommitsWorkflow('master')).toContain('branches: [master]')
    expect(getCommitsWorkflow('bad branch')).not.toContain('branches:')
  })
})
