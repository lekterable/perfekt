import { writeFile } from '~utils'
import { CONFIG_FILE, findConfigFiles } from './config/load'

const initialize = async () => {
  const [existing] = findConfigFiles()
  if (existing) throw new Error(`${existing} already exists`)

  await writeFile(CONFIG_FILE, '{}\n')

  return CONFIG_FILE
}

export default initialize
