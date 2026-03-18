import fs from 'fs'
import getPackageManager, {
  getReleaseFiles,
  getVersionCommand
} from './get-package-manager'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('getPackageManager', () => {
  beforeEach(() => {
    fsMock.existsSync.mockReset()
    fsMock.readFileSync.mockReset()
    fsMock.existsSync.mockReturnValue(false)
  })

  it('should use the packageManager field when available', () => {
    fsMock.existsSync.mockImplementation(
      fileName => fileName === 'package.json'
    )
    fsMock.readFileSync.mockReturnValueOnce(
      JSON.stringify({ packageManager: 'pnpm@9.0.0' }) as never
    )

    expect(getPackageManager()).toBe('pnpm')
  })

  it('should fall back to detected lockfiles', () => {
    fsMock.existsSync.mockImplementation(
      fileName => fileName === 'package.json' || fileName === 'yarn.lock'
    )
    fsMock.readFileSync.mockReturnValueOnce(JSON.stringify({}) as never)

    expect(getPackageManager()).toBe('yarn')
  })

  it('should ignore unsupported packageManager fields and fall back to lockfiles', () => {
    fsMock.existsSync.mockImplementation(
      fileName => fileName === 'package.json' || fileName === 'pnpm-lock.yaml'
    )
    fsMock.readFileSync.mockReturnValueOnce(
      JSON.stringify({ packageManager: 'bun@1.0.0' }) as never
    )

    expect(getPackageManager()).toBe('pnpm')
  })

  it('should default to npm when no package manager can be inferred', () => {
    expect(getPackageManager()).toBe('npm')
  })
})

describe('getReleaseFiles', () => {
  beforeEach(() => {
    fsMock.existsSync.mockReset()
    fsMock.readFileSync.mockReset()
  })

  it('should include files for the detected package manager', () => {
    fsMock.existsSync.mockImplementation(
      fileName =>
        fileName === 'CHANGELOG.md' ||
        fileName === 'package.json' ||
        fileName === 'pnpm-lock.yaml'
    )

    expect(getReleaseFiles()).toEqual([
      'CHANGELOG.md',
      'package.json',
      'pnpm-lock.yaml'
    ])
  })
})

describe('getVersionCommand', () => {
  beforeEach(() => {
    fsMock.existsSync.mockReset()
    fsMock.readFileSync.mockReset()
  })

  it('should create an npm command by default', () => {
    expect(getVersionCommand('1.2.3')).toBe(
      'npm version 1.2.3 --no-git-tag-version'
    )
  })

  it('should create a pnpm command when pnpm is configured', () => {
    fsMock.existsSync.mockImplementation(
      fileName => fileName === 'package.json'
    )
    fsMock.readFileSync.mockReturnValueOnce(
      JSON.stringify({ packageManager: 'pnpm@9.0.0' }) as never
    )

    expect(getVersionCommand('1.2.3')).toBe(
      'pnpm version 1.2.3 --no-git-tag-version'
    )
  })

  it('should create a yarn command when yarn is configured', () => {
    fsMock.existsSync.mockImplementation(
      fileName => fileName === 'package.json'
    )
    fsMock.readFileSync.mockReturnValueOnce(
      JSON.stringify({ packageManager: 'yarn@4.0.0' }) as never
    )

    expect(getVersionCommand('1.2.3')).toBe(
      'yarn version --new-version 1.2.3 --no-git-tag-version'
    )
  })
})
