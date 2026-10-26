import type { Config, ReleaseChange } from '~types'

const changePriority: Record<ReleaseChange, number> = {
  major: 0,
  minor: 1,
  patch: 2,
}

const sortChangeTypes = (
  left: ReleaseChange | undefined,
  right: ReleaseChange | undefined,
) => {
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1

  return changePriority[left] - changePriority[right]
}

const mapTypeToChangeFactory = (config: Config) => (type: string) => {
  if (type === 'breaking') return 'major'
  if (type === 'misc' || type === 'refactor') return 'patch'

  const matchingGroup = config.groups.find(({ types }) => types.includes(type))

  if (matchingGroup) return matchingGroup.change

  return undefined
}

const getChangesType = (types: string[], config: Config) => {
  const mapTypeToChange = mapTypeToChangeFactory(config)
  const sortedChanges = types.map(mapTypeToChange).sort(sortChangeTypes)

  return sortedChanges[0]
}

export default getChangesType
