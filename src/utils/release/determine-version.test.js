import fs from 'fs'
import semver from 'semver'
import exec from '../misc/exec'
import determineVersion from './determine-version'
import Config from '../../config'
import * as determineBump from './determine-bump'

jest.mock('fs')
jest.mock('../misc/exec')

describe('determineVersion', () => {
  const { config } = new Config()

  let determineBumpSpy
  let incSpy
  let coerceSpy
  let validSpy

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

    fs.readFile.mockImplementationOnce((_, __, cb) => cb(null, mockFile))

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).not.toBeCalled()
    expect(incSpy).toBeCalledTimes(1)
    expect(incSpy).toBeCalledWith(mockVersion, mockInput)
    expect(coerceSpy).not.toBeCalled()
    expect(validSpy).not.toBeCalled()
    expect(version).toBe(mockOutput)
  })

  it('should determine the version', async () => {
    const mockVersion = '1.0.0'
    const mockFile = `{ "version": "${mockVersion}" }`
    const mockLog =
      'c02bbda1489af11372198c01e75110cbac1ebbf3 refactor!: update `groups` configuration option\n25cbe30fa5e641068842b2e9af8888eacf10c238 fix: update dependencies and configurations\nd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
    const mockInput = 'new'
    const mockOutput = '2.0.0'

    fs.readFile.mockImplementationOnce((_, __, cb) => cb(null, mockFile))

    exec.mockReturnValueOnce('1.2.0')
    exec.mockReturnValueOnce(mockLog)

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).toBeCalledTimes(1)
    expect(determineBumpSpy).toBeCalledWith(config)
    expect(incSpy).toBeCalledTimes(1)
    expect(incSpy).toBeCalledWith(mockVersion, 'major')
    expect(coerceSpy).not.toBeCalled()
    expect(validSpy).not.toBeCalled()
    expect(version).toBe(mockOutput)
  })

  it('should coerce the version', async () => {
    const mockInput = 'v3'
    const mockOutput = '3.0.0'

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).not.toBeCalled()
    expect(incSpy).not.toBeCalled()
    expect(coerceSpy).toBeCalledTimes(1)
    expect(coerceSpy).toBeCalledWith(mockInput)
    expect(validSpy).toBeCalledTimes(1)
    expect(validSpy).toBeCalledWith(
      expect.objectContaining({ version: mockOutput })
    )
    expect(version).toBe(mockOutput)
  })

  it('should return the correct version', async () => {
    const mockInput = '3.3.3'

    const version = await determineVersion(mockInput, config)

    expect(determineBumpSpy).not.toBeCalled()
    expect(incSpy).not.toBeCalled()
    expect(coerceSpy).toBeCalledTimes(1)
    expect(coerceSpy).toBeCalledWith(mockInput)
    expect(validSpy).toBeCalledTimes(1)
    expect(validSpy).toBeCalledWith(
      expect.objectContaining({ version: mockInput })
    )
    expect(version).toBe(mockInput)
  })
})
