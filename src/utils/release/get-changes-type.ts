import { Config, ReleaseChange } from '~types'

const changePriority: Record<ReleaseChange, number> = {
  major: 0,
  minor: 1,
  patch: 2
}

export const sortChangeTypes = (
  a: ReleaseChange | undefined,
  b: ReleaseChange | undefined
) => {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1

  return changePriority[a] - changePriority[b]
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
