import { existsSync, readFile } from 'fs'
import { getCommitDetails } from './git'

export const generateReleased = (previousVersion, config) =>
  new Promise((resolve, reject) => {
    const hasChangelog = existsSync('CHANGELOG.md')

    if (!hasChangelog) return resolve(null)

    readFile('CHANGELOG.md', 'utf8', (err, data) => {
      if (err) return reject(err)

      let isLatest = false
      const released = data
        .split('\n')
        .filter(line => {
          if (line === config.unreleasedFormat) {
            isLatest = true

            return false
          }

          if (
            isLatest &&
            line === config.releaseFormat.replace('%version%', previousVersion)
          ) {
            isLatest = false

            return true
          }

          return !isLatest
        })
        .join('\n')

      if (isLatest) {
        return reject(new Error('Previous release not found in CHANGELOG'))
      }

      return resolve(released)
    })
  })

export const generateChangelog = (version, groups, config) => {
  const changelog = groups.map(group => {
    const release = getCommitDetails(group.release)
    const releaseVersion = (release && release.message) || version
    const title = releaseVersion
      ? config.releaseFormat.replace('%version%', releaseVersion)
      : config.unreleasedFormat

    let groupChangelog = title + '\n\n'

    const entries = Object.entries(group)

    entries.sort().forEach(([type, commits]) => {
      if (type === 'release') return

      const matchingGroup = config.groups.find(([_, ...types]) =>
        types.includes(type)
      )

      if (type === 'breaking') groupChangelog += '## BREAKING\n\n'
      else if (!matchingGroup) groupChangelog += '## Misc\n\n'
      else groupChangelog += `${matchingGroup[0]}\n\n`

      return commits.forEach((commit, index) => {
        const { message, hash } = getCommitDetails(commit)

        const isLastLine = index + 1 === commits.length
        const space = isLastLine ? '\n\n' : '\n'
        const line = generateLine({ message, hash }, config) + space

        return (groupChangelog += line)
      })
    })

    return groupChangelog
  })

  return changelog.join('')
}

export const generateLine = ({ message, hash }, config) =>
  config.lineFormat
    .replace('%HASH%', hash)
    .replace('%hash%', hash.slice(0, 8))
    .replace('%message%', message)
