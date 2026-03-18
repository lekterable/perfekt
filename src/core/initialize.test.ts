import inquirer from 'inquirer'
import * as writeFile from '../utils/misc/write-file'
import initialize, { questions } from './initialize'

jest.mock('inquirer')
jest.mock('fs')

const inquirerMock = jest.mocked(inquirer)

describe('initialize', () => {
  let writeFileSpy: jest.SpiedFunction<typeof writeFile.default>

  beforeEach(() => {
    writeFileSpy = jest.spyOn(writeFile, 'default')
  })

  it('should write to file with --write option and released', async () => {
    const mockConfigFormat = '.prettierrc'

    inquirerMock.prompt.mockResolvedValueOnce({
      configFormat: mockConfigFormat
    })

    await initialize()

    expect(inquirer.prompt).toHaveBeenCalledTimes(1)
    expect(inquirer.prompt).toHaveBeenCalledWith(questions)
    expect(writeFileSpy).toHaveBeenCalledTimes(1)
    expect(writeFileSpy).toHaveBeenCalledWith(mockConfigFormat, '')
  })
})
