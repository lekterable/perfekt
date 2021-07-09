import fs from 'fs'
import fileExists from './file-exists'

jest.mock('fs')

describe('fileExists', () => {
  const mockFileName = 'package.json'

  it('should return `false` if file does not exist', () => {
    fs.existsSync.mockReturnValueOnce(false)

    const result = fileExists(mockFileName)

    expect(fs.existsSync).toBeCalledTimes(1)
    expect(fs.existsSync).toBeCalledWith(mockFileName)
    expect(result).toBe(false)
  })

  it('should return `true` if file exists', () => {
    fs.existsSync.mockReturnValueOnce(true)

    const result = fileExists(mockFileName)

    expect(fs.existsSync).toBeCalledTimes(1)
    expect(fs.existsSync).toBeCalledWith(mockFileName)
    expect(result).toBe(true)
  })
})
