export const sortChangeTypes = (a, b) => {
  if (a === 'major') return -1
  if (b === 'major') return +1
  if (a === 'minor') return -1
  if (b === 'minor') return +1
  if (a === 'patch') return -1
  if (b === 'patch') return +1

  return a - b
}

const mapTypeToChangeFactory = config => type => {
  if (type === 'breaking') return 'major'
  if (type === 'misc') return 'patch'

  const matchingGroup = config.groups.find(({ types }) => types.includes(type))

  if (matchingGroup) return matchingGroup.change

  console.warn(`Unexpected commit type \`${type}\` received.`)

  return null
}

const getChangesType = (types, config) => {
  const mapTypeToChange = mapTypeToChangeFactory(config)
  const sortedChanges = types.map(mapTypeToChange).sort(sortChangeTypes)

  return sortedChanges[0]
}

export default getChangesType
