import { Config as TConfig, ConfigGroup, ReleaseChange } from '~types'

const configKeys = [
  'unreleasedHeader',
  'releaseHeader',
  'breakingHeader',
  'miscHeader',
  'lineFormat',
  'ignoredScopes',
  'groups'
] as const

const groupKeys = ['name', 'change', 'types'] as const
const releaseChanges: ReleaseChange[] = ['major', 'minor', 'patch']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const getUnknownKeys = (
  value: Record<string, unknown>,
  keys: readonly string[]
) => Object.keys(value).filter(key => !keys.includes(key))

const joinKeys = (keys: string[]) => keys.map(key => `\`${key}\``).join(', ')

const assertString = (value: unknown, path: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid perfekt config: \`${path}\` must be a string.`)
  }

  return value
}

const assertStringArray = (value: unknown, path: string): string[] => {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
    throw new Error(
      `Invalid perfekt config: \`${path}\` must be an array of strings.`
    )
  }

  return value
}

const validateGroup = (value: unknown, index: number): ConfigGroup => {
  const path = `groups[${index}]`

  if (!isRecord(value)) {
    throw new Error(`Invalid perfekt config: \`${path}\` must be an object.`)
  }

  const unknownKeys = getUnknownKeys(value, groupKeys)

  if (unknownKeys.length) {
    throw new Error(
      `Invalid perfekt config: \`${path}\` contains unknown properties ${joinKeys(unknownKeys)}.`
    )
  }

  const name = assertString(value.name, `${path}.name`)
  const change = assertString(value.change, `${path}.change`)

  if (!releaseChanges.includes(change as ReleaseChange)) {
    throw new Error(
      `Invalid perfekt config: \`${path}.change\` must be one of ${joinKeys(releaseChanges)}.`
    )
  }

  const types = assertStringArray(value.types, `${path}.types`)

  return {
    name,
    change: change as ReleaseChange,
    types
  }
}

const validateConfig = (value?: unknown): Partial<TConfig> | undefined => {
  if (typeof value === 'undefined') return

  if (!isRecord(value)) {
    throw new Error('Invalid perfekt config: expected an object.')
  }

  const unknownKeys = getUnknownKeys(value, configKeys)

  if (unknownKeys.length) {
    throw new Error(
      `Invalid perfekt config: contains unknown properties ${joinKeys(unknownKeys)}.`
    )
  }

  const config: Partial<TConfig> = {}

  if ('unreleasedHeader' in value) {
    config.unreleasedHeader = assertString(
      value.unreleasedHeader,
      'unreleasedHeader'
    )
  }

  if ('releaseHeader' in value) {
    config.releaseHeader = assertString(value.releaseHeader, 'releaseHeader')
  }

  if ('breakingHeader' in value) {
    config.breakingHeader = assertString(value.breakingHeader, 'breakingHeader')
  }

  if ('miscHeader' in value) {
    config.miscHeader = assertString(value.miscHeader, 'miscHeader')
  }

  if ('lineFormat' in value) {
    config.lineFormat = assertString(value.lineFormat, 'lineFormat')
  }

  if ('ignoredScopes' in value) {
    config.ignoredScopes = assertStringArray(
      value.ignoredScopes,
      'ignoredScopes'
    )
  }

  if ('groups' in value) {
    if (!Array.isArray(value.groups)) {
      throw new Error('Invalid perfekt config: `groups` must be an array.')
    }

    config.groups = value.groups.map(validateGroup)
  }

  return config
}

export default validateConfig
