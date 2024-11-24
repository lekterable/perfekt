import { Config } from '~types'

const createReleasedFilter = (version: string, config: Config) => {
  let isUnreleased: boolean

  return (line: string) => {
    if (line === config.unreleasedHeader) {
      isUnreleased = true

      return false
    }

    if (
      isUnreleased &&
      line === config.releaseHeader.replace(/%version%/g, version)
    ) {
      isUnreleased = false

      return true
    }

    return !isUnreleased
  }
}

export default createReleasedFilter
