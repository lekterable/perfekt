import Commit from '~libs/commit'

export type Group = Partial<{
  release: Commit
  feat: Commit[]
  fix: Commit[]
  misc: Commit[]
}>

export type GroupedCommits = Group[]

export type ChangelogOptions = { write: boolean; root: boolean; from?: string }

export type ReleaseOptions = { from?: string }

export type Config = {
  unreleasedHeader: string
  releaseHeader: string
  breakingHeader: string
  miscHeader: string
  lineFormat: string
  ignoredScopes: string[]
  groups: { name: string; change: string; types: string[] }[]
}
