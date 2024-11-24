import Commit from '~libs/commit'
import { Config } from '~types'

const generateLine = ({ message, hash }: Commit, config: Config) =>
  config.lineFormat
    .replace(/%HASH%/g, hash)
    .replace(/%hash%/g, hash.slice(0, 8))
    .replace(/%message%/g, message)

export default generateLine
