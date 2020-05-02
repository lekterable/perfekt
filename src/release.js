import semver from 'semver'
import { changelog } from './changelog'
import { commitRelease, updateVersion } from './utils'

export const release = async (version, options, config) => {
  if (!version) throw new Error('Relese requires a version')

  const newVersion = semver.valid(semver.coerce(version))

  if (!newVersion) throw new Error(`Version '${version}' doesn't look right`)

  await updateVersion(newVersion)
  await changelog(newVersion, { write: true }, config)
  await commitRelease(newVersion)
}
