import Commit from '~libs/commit'
import { GroupedCommits, Config } from '~types'
import generateLine from './generate-line'

const generateChangelog = (
  groupedCommits: GroupedCommits,
  version: string | undefined,
  config: Config
) => {
  if (!groupedCommits.length) {
    throw new Error('Cannot generate a changelog, no commits passed.')
  }

  const releases = groupedCommits.map((group, releaseIndex, releases) => {
    const { release, ...groups } = group
    const releaseVersion = release?.message || version
    const title = releaseVersion
      ? config.releaseHeader.replace(/%version%/g, releaseVersion)
      : config.unreleasedHeader

    const grouped = Object.entries(groups)
      .sort()
      .map(([type, commits], groupIndex, groups) => {
        const matchingGroup = config.groups.find(({ types }) =>
          types.includes(type)
        )

        const lines = (commits as Commit[]).map((commit, index) => {
          const isLastRelease = releaseIndex + 1 === releases.length
          const isLastGroup = groupIndex + 1 === groups.length
          const isEnd = isLastRelease && isLastGroup
          const isLastLine = index + 1 === commits.length

          const space = isLastLine && !isEnd ? '\n\n' : '\n'

          return generateLine(commit, config) + space
        })

        const header = matchingGroup ? matchingGroup.name : config.miscHeader
        const isBreaking = type === 'breaking'

        const groupHeader = isBreaking ? config.breakingHeader : header

        return groupHeader + '\n\n' + lines.join('')
      })

    return title + '\n\n' + grouped.join('')
  })

  return releases.join('')
}

export default generateChangelog
