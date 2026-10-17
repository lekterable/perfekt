import type { ConfigGroup, ReleaseChange, Config as TConfig } from '~types'

const configKeys = [
  'unreleasedHeader',
  'releaseHeader',
  'breakingHeader',
  'miscHeader',
  'lineFormat',
  'ignoredScopes',
  'groups',
] as const

const stringKeys = [
  'unreleasedHeader',
  'releaseHeader',
  'breakingHeader',
  'miscHeader',
  'lineFormat',
] as const

const groupKeys = ['name', 'change', 'types'] as const
const releaseChanges: ReleaseChange[] = ['major', 'minor', 'patch']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const getUnknownKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
) => Object.keys(value).filter((key) => !keys.includes(key))

const joinKeys = (keys: string[]) => keys.map((key) => `\`${key}\``).join(', ')

const assertString = (value: unknown, path: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid perfekt config: \`${path}\` must be a string.`)
  }

  return value
}

const assertStringArray = (value: unknown, path: string): string[] => {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string')
  ) {
    throw new Error(
      `Invalid perfekt config: \`${path}\` must be an array of strings.`,
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
      `Invalid perfekt config: \`${path}\` contains unknown properties ${joinKeys(unknownKeys)}.`,
    )
  }

  const name = assertString(value.name, `${path}.name`)
  const change = assertString(value.change, `${path}.change`)

  if (!releaseChanges.includes(change as ReleaseChange)) {
    throw new Error(
      `Invalid perfekt config: \`${path}.change\` must be one of ${joinKeys(releaseChanges)}.`,
    )
  }

  const types = assertStringArray(value.types, `${path}.types`)

  return {
    name,
    change: change as ReleaseChange,
    types,
  }
}

const validateGroups = (value: unknown): ConfigGroup[] => {
  if (!Array.isArray(value)) {
    throw new Error('Invalid perfekt config: `groups` must be an array.')
  }

  return value.map(validateGroup)
}

const validateConfig = (value?: unknown): Partial<TConfig> | undefined => {
  if (typeof value === 'undefined') return

  if (!isRecord(value)) {
    throw new Error('Invalid perfekt config: expected an object.')
  }

  const unknownKeys = getUnknownKeys(value, configKeys)

  if (unknownKeys.length) {
    throw new Error(
      `Invalid perfekt config: contains unknown properties ${joinKeys(unknownKeys)}.`,
    )
  }

  const strings = Object.fromEntries(
    stringKeys
      .filter((key) => key in value)
      .map((key) => [key, assertString(value[key], key)]),
  )

  return {
    ...strings,
    ...('ignoredScopes' in value
      ? {
          ignoredScopes: assertStringArray(
            value.ignoredScopes,
            'ignoredScopes',
          ),
        }
      : {}),
    ...('groups' in value ? { groups: validateGroups(value.groups) } : {}),
  }
}

export default validateConfig
