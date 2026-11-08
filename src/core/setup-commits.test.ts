import fs from 'node:fs'
import type { MockInstance } from 'vitest'
import exec from '~utils/misc/exec'
import * as writeFile from '../utils/misc/write-file'
import { COMMITS_WORKFLOW_PATH, getCommitsWorkflow } from './commits'
import setupCommits, { getDefaultBranch } from './setup-commits'

vi.mock('node:fs')
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
    ['a current topic branch', answer('show-current', 'topic'), undefined],
    [
      'no git',
      () => {
        throw new Error('no git')
      },
      undefined,
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

  const SHARED = 'uses: lekterable/perfekt/.github/workflows/ci.yml'

  it.each([
    ['calls the shared CI', 'ci.yml', `${SHARED}@master`, true],
    ['calls the shared CI at a tag', 'ci.yml', `${SHARED}@v4`, true],
    ['calls the shared CI from ci.yaml', 'ci.yaml', `${SHARED}@master`, true],
    [
      'calls the shared CI with a trailing comment',
      'ci.yml',
      `${SHARED}@master # pinned`,
      true,
    ],
    ['has its own CI', 'ci.yml', 'runs-on: ubuntu-latest', false],
    [
      "calls another repo's ci.yml",
      'ci.yml',
      'uses: someone/else/.github/workflows/ci.yml@main',
      false,
    ],
    [
      'only mentions the shared CI in a comment',
      'ci.yml',
      `    # ${SHARED}@master`,
      false,
    ],
    [
      'only mentions the shared CI in a comment with CRLF line endings',
      'ci.yml',
      `on: push\r\n    # ${SHARED}@master\r\n`,
      false,
    ],
    [
      'only mentions the shared CI in a trailing comment',
      'ci.yml',
      `on: push # was ${SHARED}@master`,
      false,
    ],
  ])(
    'should pick the title events when the repo CI %s',
    async (_label, name, ci, withCi) => {
      const file = `.github/workflows/${name}`
      fsMock.readdirSync.mockReturnValue([
        name,
        'notes.txt',
      ] as unknown as ReturnType<typeof fs.readdirSync>)
      fsMock.readFileSync.mockImplementation((path) => {
        // notes.txt calls the shared CI too, so only the .yml/.yaml filter keeps it out
        return path === file ? ci : `${SHARED}@master`
      })

      await setupCommits()

      expect(writeFileSpy).toHaveBeenCalledWith(
        COMMITS_WORKFLOW_PATH,
        getCommitsWorkflow('main', { withCi }),
      )
    },
  )

  it('should skip an existing workflow unless force is set', async () => {
    fsMock.existsSync.mockReturnValue(true)

    expect((await setupCommits()).files[0]?.status).toBe('skipped')
    expect(writeFileSpy).not.toHaveBeenCalled()
    expect((await setupCommits({ force: true })).files[0]?.status).toBe(
      'written',
    )
  })
})
