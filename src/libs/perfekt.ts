import initialize from './initialize'
import Changelog from './changelog'
import Git from './git'
import Release from './release'
import { Config } from '~types'
import { determineVersion, groupCommits } from '~utils'
import { ChangelogOptions, ReleaseOptions } from '~types'

class Perfekt {
  #config
  #changelog
  #release
  #git

  constructor(config: Config) {
    this.#config = config
    this.#git = new Git()
    this.#changelog = new Changelog(config)
    this.#release = new Release()
  }

  async init() {
    await initialize()
  }

  async release(version: string, options: ReleaseOptions) {
    const newVersion = await determineVersion(version, this.#config)

    this.#release.options = options

    await this.changelog(newVersion, {
      root: false,
      write: true,
      from: this.#release.options.from
    })

    this.#release.finish(newVersion)
  }

  changelog(version: string | undefined, options: Partial<ChangelogOptions>) {
    const { latestTag, getCommits } = this.#git

    this.#changelog.options = options

    const from = this.#changelog.options.root
      ? undefined
      : this.#changelog.options.from || latestTag

    const groupedCommits = groupCommits(getCommits(from), this.#config)

    return this.#changelog.finish(groupedCommits, version, latestTag)
  }
}

export default Perfekt
