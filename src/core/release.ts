import { defaults, Optionable } from './options'
import Git from './git'
import NPM from './npm'
import { ReleaseOptions } from '~types'

export const createTagMessage = (changelog: string) => {
  const [, ...rest] = changelog.split('\n')

  if (rest[0] === '') return rest.slice(1).join('\n')

  return rest.join('\n')
}

class Release extends Optionable<ReleaseOptions> {
  #git: Git
  #npm: NPM

  constructor() {
    super(defaults.releaseOptions)
    this.#npm = new NPM()
    this.#git = new Git()
  }

  finish(version: string, changelog: string) {
    this.#npm.updateVersion(version)
    this.#git.release(version, createTagMessage(changelog))
  }
}

export default Release
