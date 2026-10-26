import fs from 'fs'
import * as writeFile from '../utils/misc/write-file'
import initialize from './initialize'

jest.mock('fs')

const fsMock = jest.mocked(fs)

describe('initialize', () => {
  it('should write an empty perfekt.json and never overwrite one', async () => {
    const writeFileSpy = jest.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockReturnValue(false)

    expect(await initialize()).toBe('perfekt.json')
    expect(writeFileSpy).toHaveBeenCalledWith('perfekt.json', '{}\n')

    fsMock.existsSync.mockImplementation((file) => file === '.perfektrc')
    await expect(initialize()).rejects.toThrow('.perfektrc already exists')
  })
})
