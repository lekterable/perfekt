import Commit from './commit'
import exec, { execFile } from '~utils/misc/exec'
import { getReleaseFiles } from '~utils/npm/get-package-manager'

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
    exec(`git commit -m '${message}'`)
  }

  tag(tag: string, message: string) {
    execFile('git', ['tag', '-a', tag, '-m', message])
  }

  get latestTag() {
    const latestTag = exec('git tag | tail -n 1')?.toString().trimEnd()

    return latestTag && latestTag.replace('\n', '')
  }

  getUnreleasedCommits() {
    const tag = this.latestTag

    if (!tag) {
      throw new Error(
        "Couldn't get unreleased commits without an existing tag."
      )
    }

    return this.getCommits(tag)
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
