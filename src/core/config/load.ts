import fs from 'node:fs'
import path from 'node:path'

export const CONFIG_FILE = 'perfekt.json'

// perfekt.json first, then the JSON files perfekt 3 also read, so existing repos keep working.
const JSON_CONFIG_FILES = [CONFIG_FILE, '.perfektrc', '.perfektrc.json']

// Other files perfekt 3 read through cosmiconfig. Finding one is an error, so a release never
// quietly drops a repo's changelog settings.
const OLD_CONFIG_FILES = [
  '.perfektrc.yaml',
  '.perfektrc.yml',
  '.perfektrc.js',
  '.perfektrc.cjs',
  'perfekt.config.js',
  'perfekt.config.cjs',
]

const readJson = (file: string): unknown =>
  JSON.parse(fs.readFileSync(file, 'utf8'))

/** The JSON config in the folder perfekt runs in, or undefined when there is none. */
export const loadConfig = (dir = process.cwd()): unknown => {
  const name = JSON_CONFIG_FILES.find((file) =>
    fs.existsSync(path.join(dir, file)),
  )

  if (name) {
    try {
      return readJson(path.join(dir, name))
    } catch (error) {
      throw new Error(
        `Invalid perfekt config: ${name} is not valid JSON (${error instanceof Error ? error.message : error})`,
      )
    }
  }

  const old = OLD_CONFIG_FILES.find((file) =>
    fs.existsSync(path.join(dir, file)),
  )
  const packageJson = path.join(dir, 'package.json')
  const inPackageJson =
    fs.existsSync(packageJson) &&
    typeof (readJson(packageJson) as { perfekt?: unknown }).perfekt === 'object'

  if (old || inPackageJson) {
    throw new Error(
      `Invalid perfekt config: perfekt reads only JSON now; move the config from ${old ?? 'the "perfekt" key in package.json'} into ${CONFIG_FILE}`,
    )
  }

  return undefined
}
