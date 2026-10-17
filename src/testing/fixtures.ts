import Commit from '~core/commit'
import Config from '~core/config'
import type { GroupedCommits, Config as PerfektConfig } from '~types'

export const createCommit = (commit: string) => new Commit(commit)

export const createCommits = (commits: string[]) => commits.map(createCommit)

export const createConfig = (overrides?: Partial<PerfektConfig>) =>
  new Config(overrides).config

type CommitSummary = [key: string, messages: string | string[]]

const summarizeEntry = ([key, value]: [
  string,
  Commit | Commit[] | undefined,
]): CommitSummary[] => {
  if (!value) return []

  return [
    [
      key,
      Array.isArray(value)
        ? value.map((commit) => commit.message)
        : value.message,
    ],
  ]
}

export const summarizeGroupedCommits = (groups: GroupedCommits) =>
  groups.map((group) =>
    Object.fromEntries(Object.entries(group).flatMap(summarizeEntry)),
  )
