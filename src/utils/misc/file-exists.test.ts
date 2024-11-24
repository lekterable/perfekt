import fs from 'fs'
import fileExists from './file-exists'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('fileExists', () => {
  const mockFileName = 'package.json'

  it('should return `false` if file does not exist', () => {
    fsMock.existsSync.mockReturnValueOnce(false)

    const result = fileExists(mockFileName)

    expect(fsMock.existsSync).toBeCalledTimes(1)
    expect(fsMock.existsSync).toBeCalledWith(mockFileName)
    expect(result).toBe(false)
  })

  it('should return `true` if file exists', () => {
    fsMock.existsSync.mockReturnValueOnce(true)

    const result = fileExists(mockFileName)

    expect(fsMock.existsSync).toBeCalledTimes(1)
    expect(fsMock.existsSync).toBeCalledWith(mockFileName)
    expect(result).toBe(true)
  })
})
