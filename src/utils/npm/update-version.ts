import exec from '../misc/exec'
import { getVersionCommand } from './get-package-manager'

const updateVersion = (version: string) => exec(getVersionCommand(version))

export default updateVersion
