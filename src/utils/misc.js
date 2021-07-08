import { exec } from 'child_process'
import { readFileSync } from 'fs'
import semver from 'semver'

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

export const isObjectEmpty = object => Object.keys(object).length === 0

export const updateVersion = version =>
  execAsync(`npm version ${version} --no-git-tag-version`)
