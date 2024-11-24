import process from 'child_process'

const exec = (command: string): Buffer | string | undefined =>
  process.execSync(command)

export default exec
