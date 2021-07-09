import process from 'child_process'

const exec = command => process.execSync(command)

export default exec
