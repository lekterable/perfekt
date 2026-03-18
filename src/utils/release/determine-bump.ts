import { Config } from '~types'
import Git from '~core/git'
import getCommitsTypes from './get-commits-types'
import getChangesType from './get-changes-type'

const determineBump = async (config: Config) => {
  const unreleasedCommits = new Git().getUnreleasedCommits()

  if (!unreleasedCommits.length) {
    throw new Error('No unreleased commits, nothing to release.')
  }

  const types = getCommitsTypes(unreleasedCommits)

  const bump = getChangesType(types, config)

  if (!bump) {
    throw new Error(
      "Couldn't determine a version bump from unreleased commits."
    )
  }

  return bump
}

export default determineBump
