import exec from '../misc/exec'

const updateVersion = (version: string) =>
  exec(`npm version ${version} --no-git-tag-version`)

export default updateVersion
