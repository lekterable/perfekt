import { defaults, Optionable } from './options'
import Git from './git'
import NPM from './npm'

export default class Release extends Optionable {
  #git
  #npm

  constructor() {
    super(defaults.releaseOptions)
    this.#npm = new NPM()
    this.#git = new Git()
  }

  finish(version) {
    this.#npm.updateVersion(version)
    this.#git.release(version)
  }
}
