import fs from 'fs'
import exec from '~utils/misc/exec'
import * as writeFile from '../utils/misc/write-file'
import {
  COMMITS_WORKFLOW_PATH,
  getCommitsWorkflow,
  LEKTERABLE_TIP,
} from './commits'
import setupCommits, { getDefaultBranch } from './setup-commits'

jest.mock('fs')
jest.mock('~utils/misc/exec', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const fsMock = jest.mocked(fs)
const execMock = jest.mocked(exec)

describe('setup-commits', () => {
  let writeFileSpy: jest.SpiedFunction<typeof writeFile.default>

  beforeEach(() => {
    writeFileSpy = jest.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockImplementation(
      (fileName) => fileName === 'package.json',
    )
    fsMock.readFileSync.mockReturnValue(
      JSON.stringify({
        packageManager: 'pnpm@10.32.0',
        scripts: { prepare: 'pnpm run build && husky' },
      }) as never,
    )
    fsMock.mkdirSync.mockImplementation(() => undefined)
    fsMock.chmodSync.mockImplementation(() => undefined)
    execMock.mockImplementation((command) => {
      if (String(command).includes('origin/HEAD')) return 'origin/main'
      return ''
    })
  })

  it('should detect origin HEAD, then config, then main or master', () => {
    expect(getDefaultBranch()).toBe('main')

    execMock.mockImplementation((command) => {
      if (String(command).includes('init.defaultBranch')) return 'develop'
      return ''
    })
    expect(getDefaultBranch()).toBe('develop')

    execMock.mockImplementation((command) => {
      if (String(command).includes('show-current')) return 'master'
      return ''
    })
    expect(getDefaultBranch()).toBe('master')

    execMock.mockImplementation((command) => {
      if (String(command).includes('show-current')) return 'topic'
      return ''
    })
    expect(getDefaultBranch()).toBe(null)

    execMock.mockImplementation(() => {
      throw new Error('no git')
    })
    expect(getDefaultBranch()).toBe(null)
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
      lekterableTip: LEKTERABLE_TIP,
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
