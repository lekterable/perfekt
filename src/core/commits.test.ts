import fs from 'node:fs'
import path from 'node:path'
import { COMMITS_REUSABLE_WORKFLOW, getCommitsWorkflow } from './commits'

const repoRoot = path.resolve(__dirname, '../..')
const reusableWorkflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/commitlint.yml'),
  'utf8',
)

const parseTypes = (yaml: string) => {
  const match = yaml.match(/^\s*types:\s*\[([^\]]+)\]/m)
  return match?.[1]?.split(',').map((item) => item.trim()) ?? []
}

const parseJobIfActions = (yaml: string) => {
  const match = yaml.match(
    /if:\s*contains\(fromJSON\('(\[[^\]]+\])'\),\s*github\.event\.action\)/,
  )
  const json = match?.[1]
  return json ? (JSON.parse(json) as string[]) : []
}

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

  it.each([
    ['run', 'opened', true],
    ['run', 'edited', true],
    ['run', 'reopened', true],
    ['not run', 'synchronize', false],
    ['not run', 'closed', false],
    ['not run', 'ready_for_review', false],
  ])('should %s title lint on pull_request %s', (_label, action, shouldRun) => {
    const callerTypes = parseTypes(getCommitsWorkflow('master'))
    const reusableTypes = parseTypes(reusableWorkflow)
    const jobIfActions = parseJobIfActions(reusableWorkflow)

    expect(callerTypes.includes(action)).toBe(shouldRun)
    expect(reusableTypes.includes(action)).toBe(shouldRun)
    expect(jobIfActions.includes(action)).toBe(shouldRun)
  })
})
