import Git from '../../git'
import getCommitsTypes from './get-commits-types'
import getChangesType from './get-changes-type'

const determineBump = async config => {
  const unreleasedCommits = new Git().getUnreleasedCommits()

  if (!unreleasedCommits) {
    throw new Error('No unreleased commits, nothing to release.')
  }

  const types = getCommitsTypes(unreleasedCommits, config)

  const bump = getChangesType(types, config)

  if (!bump) {
    throw new Error(
      "Couldn't determine the version update, provided commit types are invalid."
    )
  }

  return bump
}

export default determineBump
