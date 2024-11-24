import { Config } from '~types'

export const sortChangeTypes = (
  a: string | undefined,
  b: string | undefined
) => {
  if (a === 'major') return -1
  if (b === 'major') return +1
  if (a === 'minor') return -1
  if (b === 'minor') return +1
  if (a === 'patch') return -1
  if (b === 'patch') return +1

  // @ts-expect-error - tbi later
  return a - b
}

const mapTypeToChangeFactory = (config: Config) => (type: string) => {
  if (type === 'breaking') return 'major'
  if (type === 'misc') return 'patch'

  const matchingGroup = config.groups.find(({ types }) => types.includes(type))

  if (matchingGroup) return matchingGroup.change

  console.warn(`Unexpected commit type \`${type}\` received.`)

  return undefined
}

const getChangesType = (types: string[], config: Config) => {
  const mapTypeToChange = mapTypeToChangeFactory(config)
  const sortedChanges = types.map(mapTypeToChange).sort(sortChangeTypes)

  return sortedChanges[0]
}

export default getChangesType
