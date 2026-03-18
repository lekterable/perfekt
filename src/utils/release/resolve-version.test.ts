import semver from 'semver'
import { readFile } from '../misc'
import determineBump from './determine-bump'
import resolveVersion from './resolve-version'
import { createConfig } from '~testing/fixtures'

jest.mock('../misc', () => ({
  readFile: jest.fn()
}))

jest.mock('./determine-bump', () => jest.fn())

const readFileMock = jest.mocked(readFile)
const determineBumpMock = jest.mocked(determineBump)

describe('resolveVersion', () => {
  const config = createConfig()

  beforeEach(() => {
    readFileMock.mockReset()
    determineBumpMock.mockReset()
  })

  it('should resolve explicit bump keywords using semver.inc', async () => {
    readFileMock.mockResolvedValueOnce('{ "version": "1.2.3" }')

    await expect(resolveVersion('major', config)).resolves.toEqual({
      currentVersion: '1.2.3',
      resolvedVersion: '2.0.0',
      resolvedBump: 'major'
    })
  })

  it('should resolve the `new` keyword using determineBump', async () => {
    readFileMock.mockResolvedValueOnce('{ "version": "1.2.3" }')
    determineBumpMock.mockResolvedValueOnce('minor')

    await expect(resolveVersion('new', config)).resolves.toEqual({
      currentVersion: '1.2.3',
      resolvedVersion: '1.3.0',
      resolvedBump: 'minor'
    })
  })

  it('should throw when a bump keyword cannot be applied', async () => {
    const incSpy = jest.spyOn(semver, 'inc').mockReturnValueOnce(null)

    readFileMock.mockResolvedValueOnce('{ "version": "1.2.3" }')

    await expect(resolveVersion('patch', config)).rejects.toThrow(
      "Version `1.2.3` couldn't be bumped."
    )

    incSpy.mockRestore()
  })

  it('should coerce explicit versions when possible', async () => {
    readFileMock.mockResolvedValueOnce('{ "version": "1.2.3" }')

    await expect(resolveVersion('v3', config)).resolves.toEqual({
      currentVersion: '1.2.3',
      resolvedVersion: '3.0.0',
      resolvedBump: null
    })
  })

  it('should throw when an explicit version is invalid', async () => {
    readFileMock.mockResolvedValueOnce('{ "version": "1.2.3" }')

    await expect(resolveVersion('version', config)).rejects.toThrow(
      "Version `version` doesn't look right."
    )
  })
})
