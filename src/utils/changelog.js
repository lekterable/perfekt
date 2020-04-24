import { readFile } from 'fs'
import { getCommitDetails } from './git'

export const generateReleased = previousVersion =>
  new Promise((resolve, reject) =>
    readFile('CHANGELOG.md', 'utf8', (err, data) => {
      if (err) return reject(err)

      let isLatest = false
      const released = data
        .split('\n')
        .filter(line => {
          if (line === '# Latest') {
            isLatest = true

            return false
          }

          if (isLatest && line === `# ${previousVersion}`) {
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
  )

export const generateChangelog = (version, groups) => {
  const changelog = groups.map(group => {
    const release = getCommitDetails(group.release)
    const title = version || 'Latest'
    let groupChangelog = `# ${release ? release.message : title}\n\n`

    const entries = Object.entries(group)

    entries.sort().forEach(([title, commits]) => {
      if (title === 'release') return

      switch (title) {
        case 'breaking':
          groupChangelog += '## BREAKING\n\n'
          break
        case 'feat':
          groupChangelog += '## Features\n\n'
          break
        case 'fix':
          groupChangelog += '## Fixes\n\n'
          break
        default:
          groupChangelog += '## Misc\n\n'
          break
      }

      return commits.forEach((commit, index) => {
        const { message, hash } = getCommitDetails(commit)

        const isLastLine = index + 1 === commits.length
        const space = isLastLine ? '\n\n' : '\n'
        const line = generateLine({ message, hash }) + space

        return (groupChangelog += line)
      })
    })

    return groupChangelog
  })

  return changelog.join('')
}

export const generateLine = ({ message, hash }) =>
  `- ${message} ${hash.slice(0, 8)}`
