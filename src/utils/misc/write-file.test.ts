import fs from 'fs'
import writeFile from './write-file'
import { rejectWriteFile, resolveWriteFile } from '~testing/fs'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('writeFile', () => {
  const fileName = 'CHANGELOG.md'
  const content = 'file content'

  it('should write to file', async () => {
    const mockError = 'error'
    fsMock.writeFile.mockImplementationOnce(rejectWriteFile(mockError))

    await expect(writeFile(fileName, content)).rejects.toThrow(mockError)
    expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      fileName,
      content,
      'utf8',
      expect.any(Function)
    )
  })

  it('should write the file content', async () => {
    fsMock.writeFile.mockImplementationOnce(resolveWriteFile())

    await writeFile(fileName, content)

    expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      fileName,
      content,
      'utf8',
      expect.any(Function)
    )
  })
})
