import fs from 'fs'
import writeFile from './write-file'

jest.mock('fs')

describe('writeFile', () => {
  const fileName = 'CHANGELOG.md'
  const content = 'file content'

  it('should write to file', async () => {
    const mockError = 'error'

    fs.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(mockError))

    expect(writeFile(fileName, content)).rejects.toMatch(mockError)
    expect(fs.writeFile).toBeCalledTimes(1)
    expect(fs.writeFile).toBeCalledWith(
      fileName,
      content,
      'utf8',
      expect.any(Function)
    )
  })

  it('should write to file', async () => {
    fs.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(null))

    await writeFile(fileName, content)

    expect(fs.writeFile).toBeCalledTimes(1)
    expect(fs.writeFile).toBeCalledWith(
      fileName,
      content,
      'utf8',
      expect.any(Function)
    )
  })
})
