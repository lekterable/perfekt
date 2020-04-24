import { writeFileSync } from 'fs'
import {
  generateChangelog,
  generateReleased,
  getCommits,
  getLatestTag,
  groupCommits
} from './utils'

export const changelog = async (version, options) => {
  const latestTag = !options.root && (await getLatestTag())
  const commits = await getCommits(latestTag)
  const grouped = groupCommits(commits)
  const changelog = generateChangelog(version, grouped)

  if (!options || !options.write) return process.stdout.write(changelog)

  const released = latestTag && (await generateReleased(latestTag))

  const newChangelog = released
    ? changelog + released
    : changelog.replace(/\n\n$/g, '\n')

  return writeFileSync('CHANGELOG.md', newChangelog)
}
