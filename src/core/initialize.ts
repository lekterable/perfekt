import { fileExists, writeFile } from '~utils'

// The config files init can write, each with an empty config in its format.
export const CONFIG_FILES: Record<string, string> = {
  'perfekt.json': '{}\n',
  'perfekt.yaml': '{}\n',
  '.perfektrc': '{}\n',
  'perfekt.config.js': 'module.exports = {}\n',
}

const initialize = async (file = 'perfekt.json') => {
  const content = CONFIG_FILES[file]

  if (content === undefined) {
    throw new Error(
      `Unknown config file ${file}, use one of ${Object.keys(CONFIG_FILES).join(', ')}`,
    )
  }
  if (fileExists(file)) throw new Error(`${file} already exists`)

  await writeFile(file, content)

  return file
}

export default initialize
