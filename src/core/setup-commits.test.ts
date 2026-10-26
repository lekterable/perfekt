import fs from 'fs'
import type { MockInstance } from 'vitest'
import exec from '~utils/misc/exec'
import * as writeFile from '../utils/misc/write-file'
import { COMMITS_WORKFLOW_PATH, getCommitsWorkflow } from './commits'
import setupCommits, { getDefaultBranch } from './setup-commits'

vi.mock('fs')
vi.mock('~utils/misc/exec')

const fsMock = vi.mocked(fs)
const execMock = vi.mocked(exec)

const answer = (command: string, output: string) => (input: string) =>
  input.includes(command) ? output : ''

describe('setup-commits', () => {
  let writeFileSpy: MockInstance<typeof writeFile.default>

  beforeEach(() => {
    writeFileSpy = vi.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockReturnValue(false)
    execMock.mockImplementation(answer('origin/HEAD', 'origin/main'))
  })

  it.each([
    ['origin HEAD', answer('origin/HEAD', 'origin/main'), 'main'],
    ['init.defaultBranch', answer('init.defaultBranch', 'develop'), 'develop'],
    ['a current master branch', answer('show-current', 'master'), 'master'],
    ['a current topic branch', answer('show-current', 'topic'), null],
    [
      'no git',
      () => {
        throw new Error('no git')
      },
      null,
    ],
  ])('should detect the default branch from %s', (_label, run, expected) => {
    execMock.mockImplementation(run)

    expect(getDefaultBranch()).toBe(expected)
  })

  it('should write the workflow for the detected branch', async () => {
    const result = await setupCommits()

    expect(writeFileSpy).toHaveBeenCalledWith(
      COMMITS_WORKFLOW_PATH,
      getCommitsWorkflow('main'),
    )
    expect(fsMock.mkdirSync).toHaveBeenCalledWith('.github/workflows', {
      recursive: true,
    })
    expect(result).toEqual({
      files: [{ path: COMMITS_WORKFLOW_PATH, status: 'written' }],
      defaultBranch: 'main',
    })
  })

  it('should skip an existing workflow unless force is set', async () => {
    fsMock.existsSync.mockReturnValue(true)

    expect((await setupCommits()).files[0].status).toBe('skipped')
    expect(writeFileSpy).not.toHaveBeenCalled()
    expect((await setupCommits({ force: true })).files[0].status).toBe(
      'written',
    )
  })
})
