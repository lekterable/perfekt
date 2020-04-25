import semver from 'semver'
import { changelog } from './changelog'
import { commitRelease, updateVersion } from './utils'

export const release = async version => {
  if (!version) throw new Error('Relese requires a version')

  const newVersion = semver.valid(semver.coerce(version))

  if (!newVersion) throw new Error(`Version '${version}' doesnt look right`)

  try {
    await updateVersion(newVersion)
    await changelog(newVersion, { write: true })
    await commitRelease(newVersion)
  } catch (error) {
    console.error(error)
  }
}
