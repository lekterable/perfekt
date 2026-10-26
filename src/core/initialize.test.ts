import fs from 'fs'
import * as writeFile from '../utils/misc/write-file'
import initialize from './initialize'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('initialize', () => {
  let writeFileSpy: jest.SpiedFunction<typeof writeFile.default>

  beforeEach(() => {
    writeFileSpy = jest.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockReturnValue(false)
  })

  it.each([
    [undefined, '.perfektrc', '{}\n'],
    ['perfekt.config.js', 'perfekt.config.js', 'module.exports = {}\n'],
  ])('should write an empty config to %s', async (file, path, content) => {
    expect(await initialize(file)).toBe(path)
    expect(writeFileSpy).toHaveBeenCalledWith(path, content)
  })

  it('should not overwrite a config or write an unknown one', async () => {
    await expect(initialize('perfekt.toml')).rejects.toThrow('Unknown config')

    fsMock.existsSync.mockReturnValue(true)
    await expect(initialize()).rejects.toThrow('already exists')
    expect(writeFileSpy).not.toHaveBeenCalled()
  })
})
