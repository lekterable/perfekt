const createReleasedFilter = (version, config) => {
  if (!version || !config) {
    const missing = !version ? 'version' : 'config'
    throw new Error(
      `Cannot create released filter, \`${missing}\` argument is missing.`
    )
  }

  let isUnreleased

  return line => {
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
