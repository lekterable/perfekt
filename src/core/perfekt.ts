import initialize from './initialize'
import Changelog from './changelog'
import Git from './git'
import Release from './release'
import { fileExists, groupCommits, resolveVersion } from '~utils'
import getPackageManager from '~utils/npm/get-package-manager'
import {
  ChangelogOptions,
  ChangelogResult,
  Config,
  GroupedCommits,
  OutputCommit,
  OutputGroup,
  OutputSection,
  ReleaseChange,
  ReleaseOptions,
  ReleaseResult
} from '~types'
import Commit from './commit'

type BuildChangelogResult = ChangelogResult & {
  releaseMarkdown: string
}

class Perfekt {
  #config: Config
  #changelog: Changelog
  #release: Release
  #git: Git

  constructor(config: Config) {
    this.#config = config
    this.#git = new Git()
    this.#changelog = new Changelog(config)
    this.#release = new Release()
  }

  async init() {
    await initialize()
  }

  #serializeCommit(commit: Commit): OutputCommit {
    return {
      hash: commit.hash,
      type: commit.type ?? null,
      scope: commit.scope ?? null,
      message: commit.message,
      isBreaking: Boolean(commit.isBreaking),
      isRelease: commit.scope?.toLowerCase() === 'release'
    }
  }

  #getSectionTitle(type: string) {
    if (type === 'breaking') return this.#config.breakingHeader

    return (
      this.#config.groups.find(({ types }) => types.includes(type))?.name ??
      this.#config.miscHeader
    )
  }

  #getSectionChange(type: string): ReleaseChange | null {
    if (type === 'breaking') return 'major'

    return (
      this.#config.groups.find(({ types }) => types.includes(type))?.change ??
      null
    )
  }

  #serializeGroups(groupedCommits: GroupedCommits): OutputGroup[] {
    return groupedCommits.map(group => {
      const release = group.release
        ? this.#serializeCommit(group.release)
        : null
      const sections = Object.entries(group)
        .filter(
          (entry): entry is [string, Commit[]] =>
            entry[0] !== 'release' &&
            Array.isArray(entry[1]) &&
            entry[1].length > 0
        )
        .sort(([left], [right]) => left.localeCompare(right))
        .map(
          ([key, commits]): OutputSection => ({
            key,
            title: this.#getSectionTitle(key),
            change: this.#getSectionChange(key),
            commits: commits.map(commit => this.#serializeCommit(commit))
          })
        )

      return { release, sections }
    })
  }

  async #buildChangelogResult(
    version: string | undefined,
    options: Partial<ChangelogOptions>
  ): Promise<BuildChangelogResult> {
    const latestTag = this.#git.latestTag ?? null
    const latestRelease = this.#git.latestRelease

    this.#changelog.options = options

    const root = this.#changelog.options.root
    const write = this.#changelog.options.write
    const from = root
      ? undefined
      : this.#changelog.options.from || latestRelease?.ref || undefined

    const commits = this.#git.getCommits(from)
    const groupedCommits = groupCommits(commits, this.#config)
    const releaseMarkdown = this.#changelog.generate(groupedCommits, version)
    const markdown = await this.#changelog.render(
      groupedCommits,
      version,
      latestRelease?.version
    )

    return {
      version: version ?? null,
      latestTag,
      from: from ?? null,
      root,
      write,
      commitCount: commits.length,
      commits: commits.map(commit => this.#serializeCommit(commit)),
      groups: this.#serializeGroups(groupedCommits),
      markdown,
      releaseMarkdown
    }
  }

  async release(
    version: string,
    options: ReleaseOptions
  ): Promise<ReleaseResult> {
    const { currentVersion, resolvedVersion, resolvedBump } =
      await resolveVersion(version, this.#config)
    const packageManager = getPackageManager()
    const changelog = await this.#buildChangelogResult(resolvedVersion, {
      root: false,
      write: true,
      from: options.from
    })
    const files = ['CHANGELOG.md', 'package.json']

    if (fileExists('pnpm-lock.yaml') && packageManager === 'pnpm') {
      files.push('pnpm-lock.yaml')
    }

    if (fileExists('package-lock.json') && packageManager === 'npm') {
      files.push('package-lock.json')
    }

    if (fileExists('yarn.lock') && packageManager === 'yarn') {
      files.push('yarn.lock')
    }

    if (!options.dryRun) {
      if (!this.#git.isClean) {
        throw new Error('Working tree must be clean before creating a release.')
      }

      await this.#changelog.save(changelog.markdown)

      this.#release.options = options
      this.#release.finish(resolvedVersion, changelog.releaseMarkdown)
    }

    return {
      dryRun: Boolean(options.dryRun),
      requestedVersion: version,
      resolvedVersion,
      resolvedBump,
      packageManager,
      currentVersion,
      latestTag: changelog.latestTag,
      from: changelog.from,
      files,
      git: {
        commitMessage: `chore(release): ${resolvedVersion}`,
        tag: resolvedVersion
      },
      commitCount: changelog.commitCount,
      commits: changelog.commits,
      groups: changelog.groups,
      changelog: {
        markdown: changelog.markdown
      }
    }
  }

  async changelog(
    version: string | undefined,
    options: Partial<ChangelogOptions>,
    output: 'default' | 'silent' = 'default'
  ): Promise<ChangelogResult> {
    const result = await this.#buildChangelogResult(version, options)

    if (result.write) {
      await this.#changelog.save(result.markdown)
      return result
    }

    if (output === 'default') {
      this.#changelog.print(result.markdown)
    }

    return result
  }
}

export default Perfekt
