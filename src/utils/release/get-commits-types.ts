import Commit from '~libs/commit'

const getCommitsTypes = (commits: Commit[]) => {
  const types = commits.map(({ type, isBreaking }) =>
    isBreaking ? 'breaking' : type
  )

  return [...new Set(types)]
}

export default getCommitsTypes
