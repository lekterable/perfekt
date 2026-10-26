import { updateVersion } from '~utils'
import Git from './git'

export const createTagMessage = (changelog: string) => {
  const [, ...rest] = changelog.split('\n')

  if (rest[0] === '') return rest.slice(1).join('\n')

  return rest.join('\n')
}

class Release {
  #git = new Git()

  finish(version: string, changelog: string) {
    updateVersion(version)
    this.#git.release(version, createTagMessage(changelog))
  }
}

export default Release
