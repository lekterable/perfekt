import type Commit from '~core/commit'
import type { Config, GroupedCommits } from '~types'

const getExistingGroup = (value: Commit | Commit[] | undefined) =>
  Array.isArray(value) ? value : []

const createGroup = (): GroupedCommits[number] => ({})

const groupCommits = (commits: Commit[], config: Config): GroupedCommits =>
  commits.reduce<GroupedCommits>(
    (grouped, commit) => {
      const group = grouped.at(-1) ?? createGroup()
      const rest = grouped.slice(0, -1)

      if (commit.isConventional) {
        const normalizedScope = commit.scope?.toLowerCase()

        if (normalizedScope && config.ignoredScopes.includes(normalizedScope))
          return [...grouped]

        if (normalizedScope === 'release') {
          const isLatest = Object.keys(group).length === 0
          const release = { release: commit }

          return isLatest ? [release] : [...grouped, release]
        }

        if (commit.isBreaking) {
          const existing = getExistingGroup(group.breaking)
          return [...rest, { ...group, breaking: [...existing, commit] }]
        }
      }

      const commitType = commit.type
      const matchingGroup = commitType
        ? config.groups.find(({ types }) => types.includes(commitType))
        : undefined

      if (!matchingGroup) {
        const existing = getExistingGroup(group.misc)
        return [...rest, { ...group, misc: [...existing, commit] }]
      }

      const [key = 'misc'] = matchingGroup.types
      const existing = getExistingGroup(group[key])
      return [...rest, { ...group, [key]: [...existing, commit] }]
    },
    [createGroup()],
  )

export default groupCommits
