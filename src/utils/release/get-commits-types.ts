import Commit from '~core/commit'

const getCommitsTypes = (commits: Commit[]) => [
  ...new Set(
    commits.flatMap(({ type, isBreaking }) => {
      if (isBreaking) return ['breaking']
      if (type) return [type]

      return []
    })
  )
]

export default getCommitsTypes
