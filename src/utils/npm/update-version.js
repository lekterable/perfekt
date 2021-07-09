import exec from '../misc/exec'

const updateVersion = version =>
  exec(`npm version ${version} --no-git-tag-version`)

export default updateVersion
