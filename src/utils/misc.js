import { exec } from 'child_process'
import { readFileSync } from 'fs'
import semver from 'semver'
import { getCommitDetails } from './git'

export const execAsync = command =>
  new Promise((resolve, reject) =>
    exec(command, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  )

export const defineVersion = input => {
  const allowed = ['major', 'minor', 'patch']

  if (allowed.includes(input)) {
    const packageJson = readFileSync('package.json', 'utf8')
    const currentVersion = JSON.parse(packageJson).version
    const newVersion = semver.inc(currentVersion, input)

    return newVersion
  }

  const newVersion = semver.valid(semver.coerce(input))

  if (!newVersion) throw new Error(`Version '${input}' doesn't look right`)

  return newVersion
}

export const groupCommits = (commits, config) =>
  commits.reduce(
    (grouped, commit) => {
      const group = grouped[grouped.length - 1]
      const rest = grouped.slice(0, -1)
      const commitDetails = getCommitDetails(commit)
      const normalizedScope =
        commitDetails.scope && commitDetails.scope.toLowerCase()

      if (config.ignoredScopes.includes(normalizedScope)) return [...grouped]
      if (normalizedScope === 'release') {
        const isLatest = isObjectEmpty(group)
        const release = { release: commit }

        return isLatest ? [release] : [...grouped, release]
      }

      if (commitDetails.breaking) {
        const existing = group.breaking ? group.breaking : []
        return [...rest, { ...group, breaking: [...existing, commit] }]
      }

      const matchingGroup = config.groups.find(([_, ...types]) =>
        types.includes(commitDetails.type)
      )

      if (!matchingGroup) {
        const existing = group.misc ? group.misc : []
        return [...rest, { ...group, misc: [...existing, commit] }]
      }

      const key = matchingGroup[1]
      const existing = group[key] ? group[key] : []
      return [...rest, { ...group, [key]: [...existing, commit] }]
    },
    [{}]
  )

export const isObjectEmpty = object => Object.keys(object).length === 0

export const updateVersion = version =>
  execAsync(`npm version ${version} --no-git-tag-version`)
