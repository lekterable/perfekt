import { exec } from 'child_process'
import { readFile } from 'fs'

const execAsync = command =>
  new Promise((resolve, reject) =>
    exec(command, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  )

export const commitRelease = async version => {
  await execAsync('git add CHANGELOG.md package.json package-lock.json')
  await execAsync(`git commit -m 'chore(release): ${version}'`)
  await execAsync(`git tag ${version}`)
}

export const getCommits = async tag => {
  const query = tag
    ? `git log --format="%H %s" ${tag}..`
    : 'git log --format="%H %s"'
  const commits = await execAsync(query)

  return commits.split('\n').filter(commit => commit)
}

export const generateReleased = previousVersion =>
  new Promise((resolve, reject) =>
    readFile('CHANGELOG.md', 'utf8', (err, data) => {
      if (err) return reject(err)

      let isLatest = false
      const released = data
        .split('\n')
        .filter(line => {
          if (line === '## Latest') {
            isLatest = true

            return false
          }

          if (isLatest && line === `## ${previousVersion}`) {
            isLatest = false

            return true
          }

          return !isLatest
        })
        .join('\n')

      if (isLatest) {
        return reject(new Error('Previous release not found in CHANGELOG'))
      }

      return resolve(released)
    })
  )

export const getLatestTag = async () => {
  const latestTag = await execAsync('git tag | tail -n 1')

  return latestTag ? latestTag.replace('\n', '') : null
}

export const getCommitDetails = commit => {
  if (!commit) return null

  const {
    groups: { hash, title }
  } = commit.match(/(?<hash>.{40}) (?<title>.*)/)

  const {
    groups: { scope, message }
  } = title.match(/(\w*)(?:\((?<scope>.*)\))?:? (?<message>.*)/)

  return { hash, title, scope, message }
}

export const generateLine = (
  { title, scope, hash, message },
  isReleaseNext
) => {
  const normalizedScope = scope && scope.toLowerCase()

  if (normalizedScope === 'changelog') return null

  const lineSpace = isReleaseNext ? '\n\n' : '\n'

  if (normalizedScope === 'release') return `## ${message}\n\n`
  return `- ${title} ${hash.slice(0, 8)}${lineSpace}`
}

export const updateVersion = version =>
  execAsync(`npm version ${version} --no-git-tag-version`)
