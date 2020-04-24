import { exec } from 'child_process'
import { getCommitDetails } from './git'

export const execAsync = command =>
  new Promise((resolve, reject) =>
    exec(command, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  )

export const groupCommits = commits =>
  commits.reduce(
    (grouped, commit) => {
      const group = grouped[grouped.length - 1]
      const rest = grouped.slice(0, -1)
      const commitDetails = getCommitDetails(commit)
      const normalizedScope =
        commitDetails.scope && commitDetails.scope.toLowerCase()

      if (normalizedScope === 'changelog') return [...grouped]
      if (normalizedScope === 'release') {
        const isLatest = isObjectEmpty(group)
        const release = { release: commit }

        return isLatest ? [release] : [...grouped, release]
      }

      if (commitDetails.breaking) {
        const existing = group.breaking ? group.breaking : []
        return [...rest, { ...group, breaking: [...existing, commit] }]
      }

      switch (commitDetails.type) {
        case 'feat': {
          const existing = group.feat ? group.feat : []
          return [...rest, { ...group, feat: [...existing, commit] }]
        }
        case 'fix': {
          const existing = group.fix ? group.fix : []
          return [...rest, { ...group, fix: [...existing, commit] }]
        }
        default: {
          const existing = group.misc ? group.misc : []
          return [...rest, { ...group, misc: [...existing, commit] }]
        }
      }
    },
    [{}]
  )

export const isObjectEmpty = object => Object.keys(object).length === 0

export const updateVersion = version =>
  execAsync(`npm version ${version} --no-git-tag-version`)
