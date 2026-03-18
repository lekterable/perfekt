import { Config } from '~types'
import resolveVersion from './resolve-version'

const determineVersion = async (
  version: string,
  config: Config
): Promise<string> => (await resolveVersion(version, config)).resolvedVersion

export default determineVersion
