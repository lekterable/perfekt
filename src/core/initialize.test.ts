import fs from 'fs'
import * as writeFile from '../utils/misc/write-file'
import initialize from './initialize'

vi.mock('fs')

const fsMock = vi.mocked(fs)

describe('initialize', () => {
  it('should write an empty perfekt.json', async () => {
    const writeFileSpy = vi.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockReturnValue(false)

    expect(await initialize()).toBe('perfekt.json')
    expect(writeFileSpy).toHaveBeenCalledWith('perfekt.json', '{}\n')
  })

  it.each([
    ['.perfektrc', '.perfektrc already exists'],
    ['.perfektrc.yml', '.perfektrc.yml already exists'],
    ['package.json', 'the "perfekt" key in package.json already exists'],
  ])('should refuse when %s holds a config', async (file, message) => {
    const writeFileSpy = vi.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockImplementation((path) => String(path).endsWith(file))
    fsMock.readFileSync.mockReturnValue('{"perfekt":{}}')

    await expect(initialize()).rejects.toThrow(message)
    expect(writeFileSpy).not.toHaveBeenCalled()
  })
})
