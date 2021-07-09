import process from 'child_process'
import exec from './exec'

jest.mock('child_process')

describe('exec', () => {
  it('should execute command', () => {
    const mockCommand = 'git log --oneline'

    exec(mockCommand)

    expect(process.execSync).toBeCalledTimes(1)
    expect(process.execSync).toBeCalledWith(mockCommand)
  })
})
