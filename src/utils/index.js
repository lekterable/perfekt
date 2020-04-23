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

  const commitDetails = title.match(
    /(?<type>[\w ]*)(?:\((?<scope>[\w ]*)\))?(?<breaking>!)?: (?<message>.*)/
  )

  if (!commitDetails) return title

  const {
    groups: { type, scope, message, breaking }
  } = commitDetails

  return { hash, title, type, scope, message, breaking }
}

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
        return [...grouped, { release: commit }]
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

export const generateChangelog = (version, groups) => {
  const changelog = groups.map(group => {
    const release = getCommitDetails(group.release)
    const title = version || 'Latest'
    let groupChangelog = `## ${release ? release.message : title}\n\n`

    const entries = Object.entries(group)

    entries.sort().forEach(([title, commits]) => {
      if (title === 'release') return

      switch (title) {
        case 'breaking':
          groupChangelog += '### BREAKING\n\n'
          break
        case 'feat':
          groupChangelog += '### Features\n\n'
          break
        case 'fix':
          groupChangelog += '### Fixes\n\n'
          break
        default:
          groupChangelog += '### Misc\n\n'
          break
      }

      return commits.forEach((commit, index) => {
        const { message, hash } = getCommitDetails(commit)

        const isLastLine = index + 1 === commits.length
        const space = isLastLine ? '\n\n' : '\n'
        const line = generateLine({ message, hash }) + space

        return (groupChangelog += line)
      })
    })

    return groupChangelog
  })

  return changelog.join('')
}

export const generateLine = ({ message, hash }) =>
  `- ${message} ${hash.slice(0, 8)}`

export const updateVersion = version =>
  execAsync(`npm version ${version} --no-git-tag-version`)
