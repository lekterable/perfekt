import fs from 'fs'
import semver from 'semver'
import exec from '../misc/exec'
import determineVersion from './determine-version'
import Config from '~core/config'
import * as determineBump from './determine-bump'
import { resolveReadFile } from '~testing/fs'

jest.mock('fs')
jest.mock('child_process')
jest.mock('../misc/exec')

const fsMock = jest.mocked(fs)
const execMock = jest.mocked(exec)

describe('determineVersion', () => {
  const { config } = new Config()

  let determineBumpSpy: jest.SpiedFunction<typeof determineBump.default>
  let incSpy: jest.SpiedFunction<typeof semver.inc>
  let coerceSpy: jest.SpiedFunction<typeof semver.coerce>
  let validSpy: jest.SpiedFunction<typeof semver.valid>

  beforeEach(() => {
    determineBumpSpy = jest.spyOn(determineBump, 'default')
    incSpy = jest.spyOn(semver, 'inc')
    coerceSpy = jest.spyOn(semver, 'coerce')
    validSpy = jest.spyOn(semver, 'valid')
  })

  it('should throw if incorrect version passed', () => {
    const mockInput = 'version'

    expect(
      determineVersion(mockInput, config)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Version \`version\` doesn't look right."`
    )
  })

  it('should bump the version', async () => {
    const mockVersion = '3.3.3'
    const mockFile = `{ "version": "${mockVersion}" }`
    const mockInput = 'major'
    const mockOutput = '4.0.0'

    fsMock.readFile.mockImplementationOnce(resolveReadFile(mockFile))

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).not.toHaveBeenCalled()
    expect(incSpy).toHaveBeenCalledTimes(1)
    expect(incSpy).toHaveBeenCalledWith(mockVersion, mockInput)
    expect(coerceSpy).not.toHaveBeenCalled()
    expect(validSpy).not.toHaveBeenCalled()
    expect(version).toBe(mockOutput)
  })

  it('should determine the version', async () => {
    const mockVersion = '1.0.0'
    const mockFile = `{ "version": "${mockVersion}" }`
    const mockLog =
      'c02bbda1489af11372198c01e75110cbac1ebbf3 refactor!: update `groups` configuration option\n25cbe30fa5e641068842b2e9af8888eacf10c238 fix: update dependencies and configurations\nd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
    const mockInput = 'new'
    const mockOutput = '2.0.0'

    fsMock.readFile.mockImplementationOnce(resolveReadFile(mockFile))

    execMock.mockReturnValueOnce('1.2.0')
    execMock.mockReturnValueOnce(undefined)
    execMock.mockReturnValueOnce(mockLog)

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).toHaveBeenCalledTimes(1)
    expect(determineBumpSpy).toHaveBeenCalledWith(config)
    expect(incSpy).toHaveBeenCalledTimes(1)
    expect(incSpy).toHaveBeenCalledWith(mockVersion, 'major')
    expect(coerceSpy).not.toHaveBeenCalled()
    expect(validSpy).not.toHaveBeenCalled()
    expect(version).toBe(mockOutput)
  })

  it('should coerce the version', async () => {
    const mockFile = `{ "version": "1.0.0" }`
    const mockInput = 'v3'
    const mockOutput = '3.0.0'

    fsMock.readFile.mockImplementationOnce(resolveReadFile(mockFile))

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).not.toHaveBeenCalled()
    expect(incSpy).not.toHaveBeenCalled()
    expect(coerceSpy).toHaveBeenCalledTimes(1)
    expect(coerceSpy).toHaveBeenCalledWith(mockInput)
    expect(validSpy).toHaveBeenCalledTimes(1)
    expect(validSpy).toHaveBeenCalledWith(
      expect.objectContaining({ version: mockOutput })
    )
    expect(version).toBe(mockOutput)
  })

  it('should return the correct version', async () => {
    const mockFile = `{ "version": "1.0.0" }`
    const mockInput = '3.3.3'

    fsMock.readFile.mockImplementationOnce(resolveReadFile(mockFile))

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).not.toHaveBeenCalled()
    expect(incSpy).not.toHaveBeenCalled()
    expect(coerceSpy).toHaveBeenCalledTimes(1)
    expect(coerceSpy).toHaveBeenCalledWith(mockInput)
    expect(validSpy).toHaveBeenCalledTimes(1)
    expect(validSpy).toHaveBeenCalledWith(
      expect.objectContaining({ version: mockInput })
    )
    expect(version).toBe(mockInput)
  })
})
