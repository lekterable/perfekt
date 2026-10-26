import { fileExists, writeFile } from '~utils'

// Each file cosmiconfig reads, with an empty config in its format.
export const CONFIG_FILES: Record<string, string> = {
  '.perfektrc': '{}\n',
  'perfekt.json': '{}\n',
  'perfekt.yaml': '{}\n',
  'perfekt.config.js': 'module.exports = {}\n',
}

const initialize = async (file = '.perfektrc') => {
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
