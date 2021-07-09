import { existsSync, readFile } from 'fs'
import { getCommitDetails } from './git'
import { isObjectEmpty } from './misc'

export const groupCommits = (commits, config) =>
  commits.reduce(
    (grouped, commit) => {
      const group = grouped[grouped.length - 1]
      const rest = grouped.slice(0, -1)
      const commitDetails = getCommitDetails(commit)
      const normalizedScope = commitDetails.scope?.toLowerCase()

      if (config.ignoredScopes.includes(normalizedScope)) return [...grouped]
      if (normalizedScope === 'release') {
        const isLatest = isObjectEmpty(group)
        const release = { release: commit }

        return isLatest ? [release] : [...grouped, release]
      }

      if (commitDetails.breaking) {
        const existing = group.breaking ? group.breaking : []
        return [...rest, { ...group, breaking: [...existing, commit] }]
      }

      const matchingGroup = config.groups.find(({ types }) =>
        types.includes(commitDetails.type)
      )

      if (!matchingGroup) {
        const existing = group.misc ? group.misc : []
        return [...rest, { ...group, misc: [...existing, commit] }]
      }

      const key = matchingGroup.types[0]
      const existing = group[key] ? group[key] : []
      return [...rest, { ...group, [key]: [...existing, commit] }]
    },
    [{}]
  )

export const generateReleased = (previousVersion, config) =>
  new Promise((resolve, reject) => {
    const hasChangelog = existsSync('CHANGELOG.md')

    if (!hasChangelog) return resolve(null)

    readFile('CHANGELOG.md', 'utf8', (err, data) => {
      if (err) return reject(err)

      let isUnreleased = false

      const released = data
        .split('\n')
        .filter(line => {
          if (line === config.unreleasedFormat) {
            isUnreleased = true

            return false
          }

          if (
            isUnreleased &&
            line === config.releaseFormat.replace(/%version%/g, previousVersion)
          ) {
            isUnreleased = false

            return true
          }

          return !isUnreleased
        })
        .join('\n')

      if (isUnreleased) {
        return reject(new Error('Previous release not found in CHANGELOG'))
      }

      return resolve(released)
    })
  })

export const generateChangelog = (version, groupedCommits, config) => {
  const releases = groupedCommits.map(group => {
    const release = getCommitDetails(group.release)
    const releaseVersion = release?.message || version
    const title = releaseVersion
      ? config.releaseFormat.replace(/%version%/g, releaseVersion)
      : config.unreleasedFormat

    const groups = Object.entries(group)
      .sort()
      .map(([type, commits]) => {
        if (type === 'release') return null

        const matchingGroup = config.groups.find(({ types }) =>
          types.includes(type)
        )

        const lines = commits.map((commit, index) => {
          const { message, hash } = getCommitDetails(commit)

          const isLastLine = index + 1 === commits.length
          const space = isLastLine ? '\n\n' : '\n'

          return generateLine({ message, hash }, config) + space
        })

        const header = matchingGroup ? matchingGroup.name : config.miscFormat
        const isBreaking = type === 'breaking'

        const groupHeader = isBreaking ? config.breakingFormat : header

        return groupHeader + '\n\n' + lines.join('')
      })

    return title + '\n\n' + groups.join('')
  })

  return releases.join('')
}

export const generateLine = ({ message, hash }, config) =>
  config.lineFormat
    .replace(/%HASH%/g, hash)
    .replace(/%hash%/g, hash.slice(0, 8))
    .replace(/%message%/g, message)
