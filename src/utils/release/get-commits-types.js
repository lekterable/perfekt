const getCommitsTypes = commits => {
  const types = commits.map(({ type, isBreaking }) =>
    isBreaking ? 'breaking' : type
  )

  return [...new Set(types)]
}

export default getCommitsTypes
