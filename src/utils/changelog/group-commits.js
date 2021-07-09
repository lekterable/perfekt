import isObjectEmpty from '../object/is-empty'

const groupCommits = (commits, config) =>
  commits.reduce(
    (grouped, commit) => {
      const group = grouped[grouped.length - 1]
      const rest = grouped.slice(0, -1)

      if (commit.isConventional) {
        const normalizedScope = commit.scope?.toLowerCase()

        if (config.ignoredScopes.includes(normalizedScope)) return [...grouped]

        if (normalizedScope === 'release') {
          const isLatest = isObjectEmpty(group)
          const release = { release: commit }

          return isLatest ? [release] : [...grouped, release]
        }

        if (commit.isBreaking) {
          const existing = group.breaking ? group.breaking : []
          return [...rest, { ...group, breaking: [...existing, commit] }]
        }
      }

      const matchingGroup = config.groups.find(({ types }) =>
        types.includes(commit.type)
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

export default groupCommits
