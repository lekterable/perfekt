import { writeFileSync } from 'fs'
import semver from 'semver'
import {
  commitRelease,
  generateLine,
  getCommitDetails,
  getCommits,
  updateVersion
} from './utils'

export const changelog = async (version, options) => {
  const title = version || 'Latest'
  const commits = await getCommits()
  const latestCommit = getCommitDetails(commits[0])
  const isReleaseLatest = latestCommit.scope === 'release'
  let changelog = isReleaseLatest ? '' : `## ${title}\n\n`

  commits.forEach((commit, index) => {
    const commitDetails = getCommitDetails(commit)
    const nextCommit = getCommitDetails(commits[index + 1])
    const isReleaseNext = nextCommit && nextCommit.scope === 'release'
    const line = generateLine(commitDetails, isReleaseNext)

    if (line) changelog += line
  })

  return options && options.write
    ? writeFileSync('CHANGELOG.md', changelog)
    : process.stdout.write(changelog)
}

export const release = async version => {
  const newVersion = semver.valid(semver.coerce(version))
  if (!newVersion) {
    return console.error(`Version '${version}' doesnt look right`)
  }

  try {
    await updateVersion(newVersion)
    await changelog(newVersion, { write: true })
    await commitRelease(newVersion)
  } catch (error) {
    console.error(error)
  }
}
