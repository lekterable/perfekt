import fs from 'fs'
import writeFile from './write-file'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('writeFile', () => {
  const fileName = 'CHANGELOG.md'
  const content = 'file content'

  it('should write to file', async () => {
    const mockError = 'error'
    // @ts-expect-error -- Make type-safe later
    fsMock.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(mockError))

    expect(writeFile(fileName, content)).rejects.toMatch(mockError)
    expect(fsMock.writeFile).toBeCalledTimes(1)
    expect(fsMock.writeFile).toBeCalledWith(
      fileName,
      content,
      'utf8',
      expect.any(Function)
    )
  })

  it('should write to file', async () => {
    // @ts-expect-error -- Make type-safe later
    fsMock.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(undefined))

    await writeFile(fileName, content)

    expect(fsMock.writeFile).toBeCalledTimes(1)
    expect(fsMock.writeFile).toBeCalledWith(
      fileName,
      content,
      'utf8',
      expect.any(Function)
    )
  })
})
