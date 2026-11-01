import type { ChangelogOptions, Config, GroupedCommits } from '~types'
import {
  createReleasedFilter,
  fileExists,
  generateChangelog,
  readFile,
  writeFile,
} from '~utils'
import { defaults, Optionable } from './options'

class Changelog extends Optionable<ChangelogOptions> {
  #config: Config

  constructor(config: Config) {
    super(defaults.changelogOptions)
    this.#config = config
  }

  async getHistory(version: string): Promise<string | undefined> {
    const isFromOverwritten = Boolean(this.options.root || this.options.from)

    if (!fileExists('CHANGELOG.md') || isFromOverwritten) return

    const changelog = await readFile('CHANGELOG.md')

    if (!changelog) {
      throw new Error("CHANGELOG doesn't contain any history.")
    }

    const filterReleased = createReleasedFilter(version, this.#config)

    return changelog.split('\n').filter(filterReleased).join('\n')
  }

  generate(commits: GroupedCommits, version: string | undefined) {
    return generateChangelog(commits, version, this.#config)
  }

  async render(
    commits: GroupedCommits,
    version: string | undefined,
    previousVersion: string | undefined,
  ) {
    const changelog = this.generate(commits, version)
    const history = previousVersion
      ? await this.getHistory(previousVersion)
      : undefined

    return history ? `${changelog}\n${history}` : changelog
  }

  save(changelog: string) {
    return writeFile('CHANGELOG.md', changelog)
  }
}

export default Changelog
