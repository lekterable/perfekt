import fs from 'node:fs'
import path from 'node:path'

export const CONFIG_FILE = 'perfekt.json'

// Files perfekt 3 read through cosmiconfig. Finding one without perfekt.json is an error, so a
// release never quietly drops a repo's changelog settings.
const OLD_CONFIG_FILES = [
  '.perfektrc',
  '.perfektrc.json',
  '.perfektrc.yaml',
  '.perfektrc.yml',
  '.perfektrc.js',
  '.perfektrc.cjs',
  'perfekt.config.js',
  'perfekt.config.cjs',
]

const readJson = (file: string): unknown =>
  JSON.parse(fs.readFileSync(file, 'utf8'))

/** perfekt.json in the folder perfekt runs in, or undefined when there is none. */
export const loadConfig = (dir = process.cwd()): unknown => {
  const file = path.join(dir, CONFIG_FILE)

  if (fs.existsSync(file)) {
    try {
      return readJson(file)
    } catch (error) {
      throw new Error(
        `Invalid perfekt config: ${CONFIG_FILE} is not valid JSON (${error instanceof Error ? error.message : error})`,
      )
    }
  }

  const old = OLD_CONFIG_FILES.find((name) =>
    fs.existsSync(path.join(dir, name)),
  )
  const packageJson = path.join(dir, 'package.json')
  const inPackageJson =
    fs.existsSync(packageJson) &&
    typeof (readJson(packageJson) as { perfekt?: unknown }).perfekt === 'object'

  if (old || inPackageJson) {
    throw new Error(
      `Invalid perfekt config: perfekt reads only ${CONFIG_FILE} now; move the config from ${old ?? 'the "perfekt" key in package.json'} into it`,
    )
  }

  return undefined
}
