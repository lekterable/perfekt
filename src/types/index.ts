import Commit from '~core/commit'

export type ReleaseChange = 'major' | 'minor' | 'patch'
export type PackageManagerName = 'npm' | 'pnpm' | 'yarn'

export type ConfigGroup = {
  name: string
  change: ReleaseChange
  types: string[]
}

export type Group = {
  release?: Commit
  breaking?: Commit[]
  misc?: Commit[]
  [group: string]: Commit | Commit[] | undefined
}

export type GroupedCommits = Group[]

export type ChangelogOptions = { write: boolean; root: boolean; from?: string }

export type ReleaseOptions = { from?: string; dryRun?: boolean }

export type Config = {
  unreleasedHeader: string
  releaseHeader: string
  breakingHeader: string
  miscHeader: string
  lineFormat: string
  ignoredScopes: string[]
  groups: ConfigGroup[]
}

export type OutputCommit = {
  hash: string
  type: string | null
  scope: string | null
  message: string
  isBreaking: boolean
  isRelease: boolean
}

export type OutputSection = {
  key: string
  title: string
  change: ReleaseChange | null
  commits: OutputCommit[]
}

export type OutputGroup = {
  release: OutputCommit | null
  sections: OutputSection[]
}

export type ChangelogResult = {
  version: string | null
  latestTag: string | null
  from: string | null
  root: boolean
  write: boolean
  commitCount: number
  commits: OutputCommit[]
  groups: OutputGroup[]
  markdown: string
}

export type ReleaseResult = {
  dryRun: boolean
  requestedVersion: string
  resolvedVersion: string
  resolvedBump: ReleaseChange | null
  packageManager: PackageManagerName
  currentVersion: string
  latestTag: string | null
  from: string | null
  files: string[]
  git: {
    commitMessage: string
    tag: string
  }
  commitCount: number
  commits: OutputCommit[]
  groups: OutputGroup[]
  changelog: {
    markdown: string
  }
}
