import semver from 'semver'
import { readFile } from '../misc'
import determineBump from './determine-bump'

const determineVersion = async (version, config) => {
  const bumps = ['new', 'major', 'minor', 'patch']

  if (bumps.includes(version)) {
    const bump = version === 'new' ? await determineBump(config) : version
    const packageJson = await readFile('package.json')
    const currentVersion = JSON.parse(packageJson).version

    return semver.inc(currentVersion, bump)
  }

  const newVersion = semver.valid(semver.coerce(version))

  if (!newVersion) throw new Error(`Version \`${version}\` doesn't look right.`)

  return newVersion
}

export default determineVersion
