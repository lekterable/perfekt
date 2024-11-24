import semver from 'semver'
import { Config } from '~types'
import { readFile } from '../misc'
import determineBump from './determine-bump'

const determineVersion = async (
  version: string,
  config: Config
): Promise<string> => {
  const bumps = ['new', 'major', 'minor', 'patch']

  if (bumps.includes(version)) {
    const bump = version === 'new' ? await determineBump(config) : version
    const packageJson = await readFile('package.json')
    const currentVersion = JSON.parse(packageJson).version

    // @ts-expect-error -- Make type-safe later
    return semver.inc(currentVersion, bump)
  }

  const newVersion = semver.valid(semver.coerce(version))

  if (!newVersion) throw new Error(`Version \`${version}\` doesn't look right.`)

  return newVersion
}

export default determineVersion
