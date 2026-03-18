import semver from 'semver'
import { Config, ReleaseChange } from '~types'
import { readFile } from '../misc'
import determineBump from './determine-bump'

const bumps = ['new', 'major', 'minor', 'patch'] as const

type BumpKeyword = (typeof bumps)[number]

const isBumpKeyword = (value: string): value is BumpKeyword =>
  bumps.includes(value as BumpKeyword)

export type ResolvedVersion = {
  currentVersion: string
  resolvedVersion: string
  resolvedBump: ReleaseChange | null
}

const getCurrentVersion = async () => {
  const packageJson = await readFile('package.json')

  return JSON.parse(packageJson).version as string
}

const resolveVersion = async (
  version: string,
  config: Config
): Promise<ResolvedVersion> => {
  const currentVersion = await getCurrentVersion()

  if (isBumpKeyword(version)) {
    const resolvedBump: ReleaseChange =
      version === 'new' ? await determineBump(config) : version

    const resolvedVersion = semver.inc(currentVersion, resolvedBump)

    if (!resolvedVersion) {
      throw new Error(`Version \`${currentVersion}\` couldn't be bumped.`)
    }

    return { currentVersion, resolvedVersion, resolvedBump }
  }

  const resolvedVersion = semver.valid(semver.coerce(version))

  if (!resolvedVersion) {
    throw new Error(`Version \`${version}\` doesn't look right.`)
  }

  return { currentVersion, resolvedVersion, resolvedBump: null }
}

export default resolveVersion
