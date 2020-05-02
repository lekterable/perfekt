import { changelog } from './changelog'
import { commitRelease, defineVersion, updateVersion } from './utils'

export const release = async (input, options, config) => {
  if (!input) throw new Error('Relese requires a version')

  const newVersion = defineVersion(input)

  await updateVersion(newVersion)
  await changelog(newVersion, { write: true }, config)
  await commitRelease(newVersion)
}
