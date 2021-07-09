import inquirer from 'inquirer'
import * as writeFile from './utils/misc/write-file'
import initialize, { questions } from './initialize'

jest.mock('inquirer')
jest.mock('fs')

describe('initialize', () => {
  let writeFileSpy

  beforeEach(() => {
    writeFileSpy = jest.spyOn(writeFile, 'default')
  })

  it('should write to file with --write option and released', async () => {
    const mockConfigFormat = '.prettierrc'

    inquirer.prompt.mockResolvedValueOnce({ configFormat: mockConfigFormat })

    await initialize()

    expect(inquirer.prompt).toBeCalledTimes(1)
    expect(inquirer.prompt).toBeCalledWith(questions)
    expect(writeFileSpy).toBeCalledTimes(1)
    expect(writeFileSpy).toBeCalledWith(mockConfigFormat, '')
  })
})
