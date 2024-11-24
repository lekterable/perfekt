import { expect } from '@jest/globals'
import fs from 'fs'
import readFile from './read-file'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('readFile', () => {
  it('should reject if receives an error', async () => {
    const mockFileName = 'CHANGELOG.md'
    const mockError = 'error'
    // @ts-expect-error -- Make type-safe later
    fsMock.readFile.mockImplementationOnce((_, __, cb) => cb(mockError))

    expect(readFile(mockFileName)).rejects.toMatch(mockError)
    expect(fsMock.readFile).toBeCalledTimes(1)
    expect(fsMock.readFile).toBeCalledWith(
      mockFileName,
      'utf8',
      expect.any(Function)
    )
  })

  it('should read file', async () => {
    const mockFile = 'file content'
    const mockFileName = 'CHANGELOG.md'
    // @ts-expect-error -- Make type-safe later
    fsMock.readFile.mockImplementationOnce((_, __, cb) => cb(undefined, mockFile))

    const changelog = await readFile(mockFileName)

    expect(fsMock.readFile).toBeCalledTimes(1)
    expect(fsMock.readFile).toBeCalledWith(
      mockFileName,
      'utf8',
      expect.any(Function)
    )
    expect(changelog).toBe(mockFile)
  })
})
