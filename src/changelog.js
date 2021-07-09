import {
  generateChangelog,
  readFile,
  writeFile,
  fileExists,
  printOutput,
  createReleasedFilter
} from './utils'
import { defaults, Optionable } from './options'
import Git from './git'

export default class Changelog extends Optionable {
  #config

  constructor(config) {
    super(defaults.changelogOptions)
    this.#config = config
  }

  get hasChangelog() {
    return fileExists('CHANGELOG.md')
  }

  async getChangelog() {
    return await readFile('CHANGELOG.md')
  }

  async getHistory(version) {
    const isFromOverwritten = Boolean(this.options.root || this.options.from)

    if (!this.hasChangelog || isFromOverwritten) return null

    const changelog = await this.getChangelog()

    if (!changelog) {
      throw new Error("CHANGELOG doesn't contain any history.")
    }

    const filterReleased = createReleasedFilter(version, this.#config)

    return changelog.split('\n').filter(filterReleased).join('\n')
  }

  generate(commits, version) {
    return generateChangelog(commits, version, this.#config)
  }

  save(changelog) {
    return writeFile('CHANGELOG.md', changelog)
  }

  print(changelog) {
    printOutput(changelog)
  }

  async finish(commits, version) {
    let changelog = this.generate(commits, version)

    const history = await this.getHistory(new Git().latestTag)

    if (history) changelog = changelog + '\n' + history

    if (this.options.write) return this.save(changelog)

    return this.print(changelog)
  }
}
