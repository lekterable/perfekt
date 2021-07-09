import { exec } from 'child_process'
import { readFileSync } from 'fs'
import semver from 'semver'
import { getUnreleasedCommits } from './git'
import { groupCommits } from './changelog'

export const execAsync = command =>
  new Promise((resolve, reject) =>
    exec(command, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  )

export const getCommitTypes = async config => {
  const unreleasedCommits = await getUnreleasedCommits()

  if (!unreleasedCommits) {
    throw new Error('No unreleased commits, nothing to release')
  }

  const unreleasedGroup = groupCommits(unreleasedCommits, config)[0]

  return [...new Set(Object.keys(unreleasedGroup))]
}

export const determineRelease = async config => {
  const types = await getCommitTypes(config)
  const [highest] = types
    .map(type => {
      if (type === 'breaking') return 'major'
      if (type === 'misc') return 'patch'

      const matchingGroup = config.groups.find(({ types }) =>
        types.includes(type)
      )

      if (matchingGroup) return matchingGroup.change

      throw new Error('Cannot determine type')
    })
    .sort((a, b) => {
      if (a === 'major') return -1
      if (b === 'major') return +1
      if (a === 'minor') return -1
      if (b === 'minor') return +1

      return -1
    })

  return highest
}

export const defineVersion = async (input, config) => {
  const allowed = ['new', 'major', 'minor', 'patch']

  if (allowed.includes(input)) {
    const bump = input === 'new' ? await determineRelease(config) : input
    const packageJson = readFileSync('package.json', 'utf8')
    const currentVersion = JSON.parse(packageJson).version

    return semver.inc(currentVersion, bump)
  }

  const newVersion = semver.valid(semver.coerce(input))

  if (!newVersion) throw new Error(`Version '${input}' doesn't look right`)

  return newVersion
}

export const isObjectEmpty = object => Object.keys(object).length === 0

export const updateVersion = version =>
  execAsync(`npm version ${version} --no-git-tag-version`)
