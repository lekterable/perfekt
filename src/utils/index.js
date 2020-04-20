import { exec } from 'child_process'

const execAsync = command =>
  new Promise((resolve, reject) =>
    exec(command, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  )

export const commitRelease = async version => {
  await execAsync('git add CHANGELOG.md')
  await execAsync(`git commit -m 'chore(release): ${version}'`)
}

export const getCommits = async () => {
  const commits = await execAsync('git log --format="%H %s"')

  return commits.split('\n').filter(commit => commit)
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
