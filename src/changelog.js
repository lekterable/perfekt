import { writeFileSync } from 'fs'
import {
  generateLine,
  generateReleased,
  getCommitDetails,
  getCommits,
  getLatestTag
} from './utils'

export const changelog = async (version, options) => {
  const title = version || 'Latest'
  const latestTag = await getLatestTag()
  const commits = await getCommits(latestTag)
  const latestCommit = getCommitDetails(commits[0])
  const isReleaseLatest = latestCommit.scope === 'release'
  let changelog = isReleaseLatest ? '' : `## ${title}\n\n`

  const released = latestTag && (await generateReleased(latestTag))

  commits.forEach((commit, index) => {
    const commitDetails = getCommitDetails(commit)
    const nextCommit = getCommitDetails(commits[index + 1])
    const isReleaseNext = nextCommit && nextCommit.scope === 'release'
    const line = generateLine(commitDetails, isReleaseNext)

    if (line) changelog += line
  })

  if (!options || !options.write) return process.stdout.write(changelog)

  const newChangelog = released ? changelog + '\n' + released : changelog

  return writeFileSync('CHANGELOG.md', newChangelog)
}
