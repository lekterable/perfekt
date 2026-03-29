import process from 'child_process'
import exec, { execFile } from './exec'

jest.mock('child_process')

describe('exec', () => {
  it('should execute command', () => {
    const mockCommand = 'git log --oneline'

    exec(mockCommand)

    expect(process.execSync).toHaveBeenCalledTimes(1)
    expect(process.execSync).toHaveBeenCalledWith(mockCommand, {
      stdio: 'pipe'
    })
  })

  it('should execute command files with args', () => {
    execFile('git', ['tag', '-a', '3.0.0', '-m', 'notes'])

    expect(process.execFileSync).toHaveBeenCalledTimes(1)
    expect(process.execFileSync).toHaveBeenCalledWith(
      'git',
      ['tag', '-a', '3.0.0', '-m', 'notes'],
      {
        stdio: 'pipe'
      }
    )
  })
})
