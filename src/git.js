import Commit from './commit'
import exec from './utils/misc/exec'

export default class Git {
  release(newVersion) {
    this.add(['CHANGELOG.md', 'package.json', 'package-lock.json'])
    this.commit(`chore(release): ${newVersion}`)
    this.tag(newVersion)
  }

  add(files) {
    const string = files.join(' ')

    exec(`git add ${string}`)
  }

  commit(message) {
    exec(`git commit -m '${message}'`)
  }

  tag(tag) {
    exec(`git tag ${tag}`)
  }

  get latestTag() {
    const latestTag = exec('git tag | tail -n 1')?.toString().trimEnd()

    return latestTag ? latestTag.replace('\n', '') : null
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

  getCommits(from) {
    const query = from
      ? `git log --format="%H %s" ${from}..`
      : 'git log --format="%H %s"'
    const log = exec(query)

    if (!log) {
      const detail = from ? ` since \`${from}\`` : ''
      const message = "Could't find any commits" + detail + '.'

      throw new Error(message)
    }

    const commits = log.toString().trimEnd().split('\n')

    return commits.map(commit => new Commit(commit))
  }
}
