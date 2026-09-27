import fs from 'fs'
import * as writeFile from '../utils/misc/write-file'
import setupCommits, {
  getCommitlintInstallCommand,
  getPrepareHint,
  getScaffoldFiles
} from './setup-commits'
import {
  COMMITLINT_CI_WORKFLOW,
  COMMITLINT_CI_WORKFLOW_PATH,
  COMMITLINT_CONFIG_CJS,
  COMMITLINT_CONFIG_PATH,
  HUSKY_COMMIT_MSG,
  HUSKY_COMMIT_MSG_PATH
} from './commitlint'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('setup-commits', () => {
  let writeFileSpy: jest.SpiedFunction<typeof writeFile.default>

  beforeEach(() => {
    writeFileSpy = jest.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockImplementation(
      fileName => fileName === 'package.json'
    )
    fsMock.readFileSync.mockReturnValue(
      JSON.stringify({
        packageManager: 'pnpm@10.32.0',
        scripts: { prepare: 'pnpm run build && husky' }
      }) as never
    )
    fsMock.mkdirSync.mockImplementation(() => undefined)
    fsMock.chmodSync.mockImplementation(() => undefined)
  })

  it('should return package-manager install commands', () => {
    expect(getCommitlintInstallCommand('pnpm')).toBe(
      'pnpm add -D @commitlint/cli @commitlint/config-conventional husky'
    )
    expect(getCommitlintInstallCommand('npm')).toBe(
      'npm install -D @commitlint/cli @commitlint/config-conventional husky'
    )
    expect(getCommitlintInstallCommand('yarn')).toBe(
      'yarn add -D @commitlint/cli @commitlint/config-conventional husky'
    )
  })

  it('should include the CI workflow only when requested', () => {
    expect(getScaffoldFiles(false).map(file => file.path)).toEqual([
      COMMITLINT_CONFIG_PATH,
      HUSKY_COMMIT_MSG_PATH
    ])
    expect(getScaffoldFiles(true).map(file => file.path)).toEqual([
      COMMITLINT_CONFIG_PATH,
      HUSKY_COMMIT_MSG_PATH,
      COMMITLINT_CI_WORKFLOW_PATH
    ])
  })

  it('should describe an existing husky prepare script', () => {
    expect(getPrepareHint()).toBe(
      'package.json already runs husky in scripts.prepare'
    )
  })

  it('should ask for a prepare script when husky is missing', () => {
    fsMock.readFileSync.mockReturnValueOnce(JSON.stringify({}) as never)

    expect(getPrepareHint()).toBe(
      'Add "prepare": "husky" to package.json scripts'
    )
  })

  it('should ask for a prepare script when prepare does not run husky', () => {
    fsMock.readFileSync.mockReturnValueOnce(
      JSON.stringify({ scripts: { prepare: 'pnpm run build' } }) as never
    )

    expect(getPrepareHint()).toBe(
      'Add "prepare": "husky" to package.json scripts'
    )
  })

  it('should ask for a prepare script when package.json is missing', () => {
    fsMock.existsSync.mockReturnValue(false)

    expect(getPrepareHint()).toBe(
      'Add "prepare": "husky" to package.json scripts'
    )
  })

  it('should ask for a prepare script when package.json is invalid', () => {
    fsMock.readFileSync.mockImplementationOnce(() => {
      throw new Error('nope')
    })

    expect(getPrepareHint()).toBe(
      'Add "prepare": "husky" to package.json scripts'
    )
  })

  it('should write commitlint config and the husky hook', async () => {
    const result = await setupCommits()

    expect(writeFileSpy).toHaveBeenCalledTimes(2)
    expect(writeFileSpy).toHaveBeenCalledWith(
      COMMITLINT_CONFIG_PATH,
      COMMITLINT_CONFIG_CJS
    )
    expect(writeFileSpy).toHaveBeenCalledWith(
      HUSKY_COMMIT_MSG_PATH,
      HUSKY_COMMIT_MSG
    )
    expect(fsMock.mkdirSync).toHaveBeenCalledWith('.husky', { recursive: true })
    expect(fsMock.chmodSync).toHaveBeenCalledWith(HUSKY_COMMIT_MSG_PATH, 0o755)
    expect(result).toEqual({
      files: [
        { path: COMMITLINT_CONFIG_PATH, status: 'written' },
        { path: HUSKY_COMMIT_MSG_PATH, status: 'written' }
      ],
      packageManager: 'pnpm',
      installCommand:
        'pnpm add -D @commitlint/cli @commitlint/config-conventional husky',
      prepareHint: 'package.json already runs husky in scripts.prepare',
      defaultBranch: 'master',
      initCommit: 'feat: init :seedling:'
    })
  })

  it('should skip existing files unless force is set', async () => {
    fsMock.existsSync.mockReturnValue(true)

    const skipped = await setupCommits()

    expect(writeFileSpy).not.toHaveBeenCalled()
    expect(skipped.files).toEqual([
      { path: COMMITLINT_CONFIG_PATH, status: 'skipped' },
      { path: HUSKY_COMMIT_MSG_PATH, status: 'skipped' }
    ])

    const overwritten = await setupCommits({ force: true })

    expect(writeFileSpy).toHaveBeenCalledTimes(2)
    expect(overwritten.files).toEqual([
      { path: COMMITLINT_CONFIG_PATH, status: 'written' },
      { path: HUSKY_COMMIT_MSG_PATH, status: 'written' }
    ])
  })

  it('should write the optional GitHub Action when ci is enabled', async () => {
    const result = await setupCommits({ ci: true })

    expect(writeFileSpy).toHaveBeenCalledTimes(3)
    expect(writeFileSpy).toHaveBeenCalledWith(
      COMMITLINT_CI_WORKFLOW_PATH,
      COMMITLINT_CI_WORKFLOW
    )
    expect(fsMock.mkdirSync).toHaveBeenCalledWith('.github/workflows', {
      recursive: true
    })
    expect(result.files[2]).toEqual({
      path: COMMITLINT_CI_WORKFLOW_PATH,
      status: 'written'
    })
  })
})
