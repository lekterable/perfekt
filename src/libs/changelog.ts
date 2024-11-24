import {
  generateChangelog,
  readFile,
  writeFile,
  fileExists,
  printOutput,
  createReleasedFilter
} from '~utils'
import { defaults, Optionable } from './options'
import { Config } from '~types'
import { ChangelogOptions, GroupedCommits } from '~types'

class Changelog extends Optionable<ChangelogOptions> {
  #config

  constructor(config: Config) {
    super(defaults.changelogOptions)
    this.#config = config
  }

  get hasChangelog() {
    return fileExists('CHANGELOG.md')
  }

  async getChangelog(): Promise<string> {
    return (await readFile('CHANGELOG.md')) as string
  }

  async getHistory(version: string) {
    const isFromOverwritten = Boolean(this.options.root || this.options.from)

    if (!this.hasChangelog || isFromOverwritten) return

    const changelog = await this.getChangelog()

    if (!changelog) {
      throw new Error("CHANGELOG doesn't contain any history.")
    }

    const filterReleased = createReleasedFilter(version, this.#config)

    return changelog.split('\n').filter(filterReleased).join('\n')
  }

  generate(commits: GroupedCommits, version: string | undefined) {
    return generateChangelog(commits, version, this.#config)
  }

  save(changelog: string) {
    return writeFile('CHANGELOG.md', changelog)
  }

  print(changelog: string) {
    printOutput(changelog)
  }

  async finish(
    commits: GroupedCommits,
    version: string | undefined,
    previousVersion: string | undefined
  ) {
    let changelog = this.generate(commits, version)

    if (previousVersion) {
      const history = await this.getHistory(previousVersion)

      if (history) changelog = changelog + '\n' + history
    }

    if (this.options.write) return this.save(changelog)

    return this.print(changelog)
  }
}

export default Changelog
