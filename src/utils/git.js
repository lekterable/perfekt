import { execAsync } from './misc'

export const getCommits = async from => {
  const query = from
    ? `git log --format="%H %s" ${from}..`
    : 'git log --format="%H %s"'
  const commits = await execAsync(query)

  return commits.split('\n').filter(commit => commit)
}

export const getLatestTag = async () => {
  const latestTag = await execAsync('git tag | tail -n 1')

  return latestTag ? latestTag.replace('\n', '') : null
}

export const getCommitDetails = commit => {
  if (!commit) return null

  const {
    groups: { hash, title }
  } = commit.match(/(?<hash>.{40}) (?<title>.*)/)

  const commitDetails = title.match(
    /(?<type>[\w ]*)(?:\((?<scope>[\w ]*)\))?(?<breaking>!)?: (?<message>.*)/
  )

  if (!commitDetails) return { hash, message: title }

  const {
    groups: { type, scope, message, breaking }
  } = commitDetails

  return { hash, title, type, scope, message, breaking }
}

export const commitRelease = async version => {
  await execAsync('git add CHANGELOG.md package.json package-lock.json')
  await execAsync(`git commit -m 'chore(release): ${version}'`)
  await execAsync(`git tag ${version}`)
}
