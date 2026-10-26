import type { Config } from '~types'

const createReleasedFilter = (version: string, config: Config) => {
  // A `v1.2.0` tag still finds the `# 1.2.0` header perfekt wrote.
  const releaseHeaders = [version, version.replace(/^v(?=\d)/, '')].map(
    (headerVersion) =>
      config.releaseHeader.replace(/%version%/g, headerVersion),
  )
  let isUnreleased: boolean

  return (line: string) => {
    if (line === config.unreleasedHeader) {
      isUnreleased = true

      return false
    }

    if (isUnreleased && releaseHeaders.includes(line)) {
      isUnreleased = false

      return true
    }

    return !isUnreleased
  }
}

export default createReleasedFilter
