import process from 'node:child_process'

// Node's 1 MiB default is too small for `git log` with commit bodies on a long range
const defaultOptions = { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 } as const

const exec = (command: string): Buffer | string | undefined =>
  process.execSync(command, defaultOptions)

export const execFile = (
  command: string,
  args: readonly string[],
): Buffer | string => process.execFileSync(command, [...args], defaultOptions)

export default exec
