import { Config } from '~types'
import Git from '~libs/git'
import getCommitsTypes from './get-commits-types'
import getChangesType from './get-changes-type'

const determineBump = async (config: Config) => {
  const unreleasedCommits = new Git().getUnreleasedCommits()

  if (!unreleasedCommits.length) {
    throw new Error('No unreleased commits, nothing to release.')
  }

  const types = getCommitsTypes(unreleasedCommits).filter(Boolean)

  const bump = getChangesType(types as string[], config)

  if (!bump) {
    throw new Error(
      "Couldn't determine the version update, provided commit types are invalid."
    )
  }

  return bump
}

export default determineBump
