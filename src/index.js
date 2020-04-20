import { writeFileSync } from 'fs'
import semver from 'semver'
import { commitRelease, getCommitDetails, getCommits } from './utils'

export const changelog = async (version, options) => {
  const title = version || 'Latest'
  const commits = await getCommits()
  const latestCommit = getCommitDetails(commits[0])
  const isReleaseLatest = latestCommit.scope === 'release'
  let changelog = isReleaseLatest ? '' : `## ${title}\n\n`

  commits.forEach((commit, index) => {
    const { title, scope, hash, message } = getCommitDetails(commit)
    const nextCommit = getCommitDetails(commits[index + 1])
    const isReleaseNext = nextCommit && nextCommit.scope === 'release'

    if (scope === 'release') return (changelog += `## ${message}\n\n`)
    if (scope !== 'changelog' && scope !== 'CHANGELOG') {
      return (changelog += `- ${title} ${hash.slice(0, 8)}\n${
        isReleaseNext ? '\n' : ''
      }`)
    }
  })

  return options && options.write
    ? writeFileSync('CHANGELOG.md', changelog)
    : process.stdout.write(changelog)
}

export const release = version => {
  const newVersion = semver.valid(semver.coerce(version))
  if (!newVersion) {
    return console.error(`Version '${version}' doesnt look right`)
  }

  try {
    changelog(newVersion)
    commitRelease(newVersion)
  } catch (error) {
    console.error(error)
  }
}
