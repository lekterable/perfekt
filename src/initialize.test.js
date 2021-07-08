import { writeFileSync } from 'fs'
import { prompt } from 'inquirer'
import { initialize, questions } from './initialize'

jest.mock('inquirer', () => ({
  prompt: jest.fn()
}))
jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}))

describe.only('initialize', () => {
  describe('initialize', () => {
    it('should write to file with --write option and released', async () => {
      const mockedConfigFormat = '.prettierrc'
      prompt.mockResolvedValueOnce({ configFormat: mockedConfigFormat })

      await initialize()

      expect(prompt).toBeCalledTimes(1)
      expect(prompt).toBeCalledWith(questions)
      expect(writeFileSync).toBeCalledTimes(1)
      expect(writeFileSync).toBeCalledWith(mockedConfigFormat, '')
    })
  })
})
