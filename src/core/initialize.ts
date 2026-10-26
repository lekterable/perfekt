import { fileExists, writeFile } from '~utils'
import { CONFIG_FILE } from './config/load'

const initialize = async () => {
  if (fileExists(CONFIG_FILE)) throw new Error(`${CONFIG_FILE} already exists`)

  await writeFile(CONFIG_FILE, '{}\n')

  return CONFIG_FILE
}

export default initialize
