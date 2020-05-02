import { existsSync, writeFileSync } from 'fs'
import {
  generateChangelog,
  generateReleased,
  getCommits,
  getLatestTag,
  groupCommits
} from './utils'

export const changelog = async (version, options, config) => {
  const hasChangelog = existsSync('CHANGELOG.md')
  const latestTag = hasChangelog && !options.root && (await getLatestTag())
  const commits = await getCommits(latestTag)

  if (!commits.length) {
    const message = latestTag
      ? `No commits found since the latest tag '${latestTag}'`
      : 'No commits found'
    throw new Error(message)
  }

  const grouped = groupCommits(commits, config)
  const changelog = generateChangelog(version, grouped, config)

  if (!options.write) return process.stdout.write(changelog)

  const released = latestTag && (await generateReleased(latestTag, config))

  const newChangelog = released
    ? changelog + released
    : changelog.replace(/\n\n$/g, '\n')

  return writeFileSync('CHANGELOG.md', newChangelog)
}
