import { fileExists, writeFile } from '~utils'
import { CONFIG_FILE, JSON_CONFIG_FILES } from './config/load'

const initialize = async () => {
  const existing = JSON_CONFIG_FILES.find(fileExists)
  if (existing) throw new Error(`${existing} already exists`)

  await writeFile(CONFIG_FILE, '{}\n')

  return CONFIG_FILE
}

export default initialize
