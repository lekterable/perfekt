import initialize from './initialize'
import { determineVersion, groupCommits } from './utils'
import Changelog from './changelog'
import Git from './git'
import Release from './release'

export default class Perfekt {
  #config
  #changelog
  #release
  #git

  constructor(config) {
    this.#config = config
    this.#git = new Git()
    this.#changelog = new Changelog(config)
    this.#release = new Release(config)
  }

  async init() {
    await initialize()
  }

  async release(version, options) {
    if (!version) throw new Error('Release requires a version.')

    const newVersion = await determineVersion(version, this.#config)

    this.#release.options = options

    await this.changelog(newVersion, {
      write: true,
      from: this.#release.options.from
    })

    this.#release.finish(newVersion)
  }

  changelog(version, options) {
    const { latestTag, getCommits } = this.#git

    this.#changelog.options = options

    const from = this.#changelog.options.root
      ? null
      : this.#changelog.options.from || latestTag

    const groupedCommits = groupCommits(getCommits(from), this.#config)

    return this.#changelog.finish(groupedCommits, version)
  }
}
