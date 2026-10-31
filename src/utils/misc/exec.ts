import process from 'node:child_process'

const defaultOptions = { stdio: 'pipe' } as const

const exec = (command: string): Buffer | string | undefined =>
  process.execSync(command, defaultOptions)

export const execFile = (
  command: string,
  args: readonly string[],
): Buffer | string => process.execFileSync(command, [...args], defaultOptions)

export default exec
