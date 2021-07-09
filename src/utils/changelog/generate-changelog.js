import generateLine from './generate-line'

const generateChangelog = (groupedCommits, version, config) => {
  if (!groupedCommits?.length) {
    throw new Error('Cannot generate a changelog, no commits passed.')
  }

  const releases = groupedCommits.map((group, releaseIndex, releases) => {
    const release = group.release
    const releaseVersion = release?.message || version
    const title = releaseVersion
      ? config.releaseHeader.replace(/%version%/g, releaseVersion)
      : config.unreleasedHeader

    const groups = Object.entries(group)
      .filter(([type]) => type !== 'release')
      .sort()
      .map(([type, commits], groupIndex, groups) => {
        const matchingGroup = config.groups.find(({ types }) =>
          types.includes(type)
        )

        const lines = commits.map(({ message, hash }, index) => {
          const isLastRelease = releaseIndex + 1 === releases.length
          const isLastGroup = groupIndex + 1 === groups.length
          const isEnd = isLastRelease && isLastGroup
          const isLastLine = index + 1 === commits.length

          const space = isLastLine && !isEnd ? '\n\n' : '\n'

          return generateLine({ message, hash }, config) + space
        })

        const header = matchingGroup ? matchingGroup.name : config.miscFormat
        const isBreaking = type === 'breaking'

        const groupHeader = isBreaking ? config.breakingHeader : header

        return groupHeader + '\n\n' + lines.join('')
      })

    return title + '\n\n' + groups.join('')
  })

  return releases.join('')
}

export default generateChangelog
