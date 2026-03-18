import process from 'child_process'

const exec = (command: string): Buffer | string | undefined =>
  process.execSync(command)

export const execFile = (
  command: string,
  args: readonly string[]
): Buffer | string => process.execFileSync(command, [...args])

export default exec
