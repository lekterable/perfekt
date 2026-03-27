import Commit from './commit'
import exec, { execFile } from '~utils/misc/exec'
import { getReleaseFiles } from '~utils/npm/get-package-manager'

type ReleaseBoundary = {
  ref: string
  version: string
}

class Git {
  release(version: string, tagMessage: string) {
    this.add(getReleaseFiles())
    this.commit(`chore(release): ${version}`)
    this.tag(version, tagMessage)
  }

  add(files: string[]) {
    const string = files.join(' ')

    exec(`git add ${string}`)
  }

  commit(message: string) {
    exec(`git commit --no-verify -m '${message}'`)
  }

  tag(tag: string, message: string) {
    execFile('git', ['tag', '-a', tag, '-m', message])
  }

  get isClean() {
    const status = exec('git status --porcelain')?.toString().trim() ?? ''

    return status.length === 0
  }

  get latestTag() {
    let latestTag: Buffer | string | undefined

    try {
      latestTag = exec('git describe --tags --abbrev=0')
    } catch {
      return undefined
    }

    latestTag = latestTag?.toString().trimEnd()

    return latestTag && latestTag.replace('\n', '')
  }

  get latestReleaseCommit() {
    const commit = exec(
      'git log --format="%H %s" --grep="^chore(release): " -n 1'
    )
      ?.toString()
      .trimEnd()

    if (!commit) return undefined

    const parsed = new Commit(commit)

    return parsed.scope?.toLowerCase() === 'release' ? parsed : undefined
  }

  get latestRelease(): ReleaseBoundary | undefined {
    const latestTag = this.latestTag
    const latestReleaseCommit = this.latestReleaseCommit

    if (!latestTag && !latestReleaseCommit) return undefined

    if (!latestTag && latestReleaseCommit) {
      return {
        ref: latestReleaseCommit.hash,
        version: latestReleaseCommit.message
      }
    }

    if (latestTag && !latestReleaseCommit) {
      return { ref: latestTag, version: latestTag }
    }

    const currentTag = latestTag as string

    const latestTagCommit = exec(`git rev-list -n 1 ${currentTag}`)
      ?.toString()
      .trim()

    if (!latestTagCommit || !latestReleaseCommit) {
      return { ref: currentTag, version: currentTag }
    }

    if (latestTagCommit === latestReleaseCommit.hash) {
      return { ref: currentTag, version: currentTag }
    }

    const isTagAncestor = exec(
      `if git merge-base --is-ancestor ${latestTagCommit} ${latestReleaseCommit.hash}; then echo true; else echo false; fi`
    )
      ?.toString()
      .trim()

    if (isTagAncestor === 'true') {
      return {
        ref: latestReleaseCommit.hash,
        version: latestReleaseCommit.message
      }
    }

    return { ref: currentTag, version: currentTag }
  }

  getUnreleasedCommits() {
    const latestRelease = this.latestRelease

    if (!latestRelease) {
      throw new Error(
        "Couldn't get unreleased commits without an existing tag or release commit."
      )
    }

    return this.getCommits(latestRelease.ref)
  }

  getCommits(from?: string) {
    const query = from
      ? `git log --format="%H %s" ${from}..`
      : 'git log --format="%H %s"'
    const log = exec(query)

    if (!log) {
      const detail = from ? ` since \`${from}\`` : ''
      const message = "Couldn't find any commits" + detail + '.'

      throw new Error(message)
    }

    const commits = log.toString().trimEnd().split('\n')

    return commits.map(commit => new Commit(commit))
  }
}

export default Git
