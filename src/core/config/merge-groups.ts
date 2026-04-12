import { ConfigGroup } from '~types'

const mergeGroups = (
  defaultGroups: ConfigGroup[],
  overrideGroups?: ConfigGroup[]
) => {
  if (!overrideGroups?.length) return defaultGroups

  const replacedTypes = new Set(overrideGroups.flatMap(group => group.types))
  const preservedDefaults = defaultGroups.filter(
    group => !group.types.some(type => replacedTypes.has(type))
  )

  return [...preservedDefaults, ...overrideGroups]
}

export default mergeGroups
