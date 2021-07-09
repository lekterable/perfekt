import { expect } from '@jest/globals'
import fs from 'fs'
import readFile from './read-file'

jest.mock('fs')

describe('readFile', () => {
  it('should reject if receives an error', async () => {
    const mockError = 'error'
    const mockFileName = 'CHANGELOG.md'

    fs.readFile.mockImplementationOnce((_, __, cb) => cb(mockError))

    expect(readFile(mockFileName)).rejects.toMatch(mockError)
    expect(fs.readFile).toBeCalledTimes(1)
    expect(fs.readFile).toBeCalledWith(
      mockFileName,
      'utf8',
      expect.any(Function)
    )
  })

  it('should read file', async () => {
    const mockFile = 'file content'
    const mockFileName = 'CHANGELOG.md'

    fs.readFile.mockImplementationOnce((_, __, cb) => cb(null, mockFile))

    const changelog = await readFile(mockFileName)

    expect(fs.readFile).toBeCalledTimes(1)
    expect(fs.readFile).toBeCalledWith(
      mockFileName,
      'utf8',
      expect.any(Function)
    )
    expect(changelog).toBe(mockFile)
  })
})
