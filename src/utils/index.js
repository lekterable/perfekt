import { exec } from 'child_process'

export const commitRelease = version =>
  new Promise((resolve, reject) => {
    exec(`git commit -m 'chore(release): ${version}'`, (err, res) => {
      if (err) return reject(err)
      resolve()
    })
  })

export const getCommits = () =>
  new Promise((resolve, reject) =>
    exec('git log --format="%H %s"', (err, res) => {
      if (err) return reject(err)

      const commits = res.split('\n').filter(commit => commit)
      resolve(commits)
    })
  )

export const getCommitDetails = commit => {
  if (!commit) return null

  const {
    groups: { hash, title }
  } = commit.match(/(?<hash>.{40}) (?<title>.*)/)
  const {
    groups: { scope, message }
  } = title.match(/(\w*)(?:\((?<scope>.*)\))?: (?<message>.*)/)

  return { hash, title, scope, message }
}
