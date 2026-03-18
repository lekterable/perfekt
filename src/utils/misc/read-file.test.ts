import fs from 'fs'
import readFile from './read-file'
import { rejectReadFile, resolveReadFile } from '~testing/fs'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('readFile', () => {
  it('should reject if receives an error', async () => {
    const mockFileName = 'CHANGELOG.md'
    const mockError = 'error'
    fsMock.readFile.mockImplementationOnce(rejectReadFile(mockError))

    await expect(readFile(mockFileName)).rejects.toThrow(mockError)
    expect(fsMock.readFile).toHaveBeenCalledTimes(1)
    expect(fsMock.readFile).toHaveBeenCalledWith(
      mockFileName,
      'utf8',
      expect.any(Function)
    )
  })

  it('should read file', async () => {
    const mockFile = 'file content'
    const mockFileName = 'CHANGELOG.md'
    fsMock.readFile.mockImplementationOnce(resolveReadFile(mockFile))

    const changelog = await readFile(mockFileName)

    expect(fsMock.readFile).toHaveBeenCalledTimes(1)
    expect(fsMock.readFile).toHaveBeenCalledWith(
      mockFileName,
      'utf8',
      expect.any(Function)
    )
    expect(changelog).toBe(mockFile)
  })
})
