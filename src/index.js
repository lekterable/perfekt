import { exec } from 'child_process'

const changelog = () =>
  exec('git log --format="%H %s"', (_, res) => {
    let changelog = '## Latest\n\n'
    const commits = res.split('\n').filter(commit => commit)
    commits.forEach(commit => {
      const {
        groups: { hash, title }
      } = commit.match(/(?<hash>.{40}) (?<title>.*)/)

      changelog += `- ${title} ${hash.slice(0, 8)}\n`
    })

    return process.stdout.write(changelog)
  })

export default { changelog }
