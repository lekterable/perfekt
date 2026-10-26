import fs from 'node:fs'
import path from 'node:path'

export const CONFIG_FILE = 'perfekt.json'

// perfekt.json first, then the JSON files perfekt 3 also read, so existing repos keep working.
const JSON_CONFIG_FILES = [
  CONFIG_FILE,
  '.perfektrc',
  '.perfektrc.json',
  '.config/perfektrc',
  '.config/perfektrc.json',
]

const SCRIPT_EXTENSIONS = ['js', 'ts', 'mjs', 'cjs', 'mts', 'cts']

// The other files perfekt 3 read through cosmiconfig. Finding one is an error, so a release
// never quietly drops a repo's changelog settings.
const OLD_CONFIG_FILES = [
  ...['yaml', 'yml', ...SCRIPT_EXTENSIONS].flatMap((extension) => [
    `.perfektrc.${extension}`,
    `.config/perfektrc.${extension}`,
  ]),
  ...SCRIPT_EXTENSIONS.map((extension) => `perfekt.config.${extension}`),
]

const PACKAGE_JSON_KEY = 'the "perfekt" key in package.json'

const readJson = (file: string): unknown => {
  const content = fs.readFileSync(file, 'utf8')

  // Like perfekt 3, an empty file means no config.
  return content.trim() ? JSON.parse(content) : undefined
}

const hasPackageJsonKey = (dir: string) => {
  const file = path.join(dir, 'package.json')

  if (!fs.existsSync(file)) return false

  const packageJson = readJson(file)

  return (
    typeof packageJson === 'object' &&
    packageJson !== null &&
    'perfekt' in packageJson
  )
}

/** Every perfekt config in the folder, old formats and the package.json key included. */
export const findConfigFiles = (dir = process.cwd()) => {
  const exists = (file: string) => fs.existsSync(path.join(dir, file))

  return [
    ...[...JSON_CONFIG_FILES, ...OLD_CONFIG_FILES].filter(exists),
    ...(hasPackageJsonKey(dir) ? [PACKAGE_JSON_KEY] : []),
  ]
}

/** The JSON config in the folder perfekt runs in, or undefined when there is none. */
export const loadConfig = (dir = process.cwd()): unknown => {
  const found = findConfigFiles(dir)

  if (found.length > 1) {
    throw new Error(
      `Invalid perfekt config: found ${found.join(', ')}; keep only ${CONFIG_FILE}`,
    )
  }

  const [name] = found
  if (!name) return undefined

  if (!JSON_CONFIG_FILES.includes(name)) {
    throw new Error(
      `Invalid perfekt config: perfekt reads only JSON now; move the config from ${name} into ${CONFIG_FILE}`,
    )
  }

  try {
    return readJson(path.join(dir, name)) ?? undefined
  } catch (error) {
    throw new Error(
      `Invalid perfekt config: ${name} is not valid JSON (${error instanceof Error ? error.message : error})`,
    )
  }
}
