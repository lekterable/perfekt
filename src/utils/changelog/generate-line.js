const generateLine = ({ message, hash }, config) =>
  config.lineFormat
    .replace(/%HASH%/g, hash)
    .replace(/%hash%/g, hash.slice(0, 8))
    .replace(/%message%/g, message)

export default generateLine
