import { defaults, Optionable } from './options'
import Git from './git'
import NPM from './npm'
import { ReleaseOptions } from '~types'

class Release extends Optionable<ReleaseOptions> {
  #git
  #npm

  constructor() {
    super(defaults.releaseOptions)
    this.#npm = new NPM()
    this.#git = new Git()
  }

  finish(version: string) {
    this.#npm.updateVersion(version)
    this.#git.release(version)
  }
}

export default Release
