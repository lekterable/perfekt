import type Commit from '~core/commit'

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

export type SetupCommitsOptions = { force?: boolean }

export type SetupFileResult = {
  path: string
  status: 'written' | 'skipped'
}

export type SetupCommitsResult = {
  files: SetupFileResult[]
  defaultBranch: string | undefined
}

export type SetupLintOptions = {
  force?: boolean
  /** The versions to add: Biome as perfekt pins it, and the running perfekt. */
  versions: { biome: string; perfekt: string }
  dir?: string
}

export type SetupLintResult = {
  files: SetupFileResult[]
  /** The install command to run when dev dependencies were added, or undefined. */
  installCommand: string | undefined
}

export type SetupScriptsOptions = { force?: boolean; dir?: string }

export type SetupScriptsResult = {
  files: SetupFileResult[]
  /** The package.json scripts this run added or, with force, overwrote. */
  scripts: string[]
}

export type SetupHooksOptions = { force?: boolean; major: string; dir?: string }

export type SetupHooksResult = {
  files: SetupFileResult[]
  /** The hooks path set in this clone's git config, or undefined when untouched. */
  hooksPath: string | undefined
  /** The command other clones must run when no prepare script sets the hooks path. */
  clonesNeed: string | undefined
}

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
  type: string | undefined
  scope: string | undefined
  message: string
  isBreaking: boolean
  isRelease: boolean
}

export type OutputSection = {
  key: string
  title: string
  change: ReleaseChange | undefined
  commits: OutputCommit[]
}

export type OutputGroup = {
  release: OutputCommit | undefined
  sections: OutputSection[]
}

export type ChangelogResult = {
  version: string | undefined
  latestTag: string | undefined
  from: string | undefined
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
  resolvedBump: ReleaseChange | undefined
  packageManager: PackageManagerName
  currentVersion: string
  latestTag: string | undefined
  from: string | undefined
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
