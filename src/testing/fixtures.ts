import Commit from '~core/commit'
import Config from '~core/config'
import { Config as PerfektConfig, GroupedCommits } from '~types'

export const createCommit = (commit: string) => new Commit(commit)

export const createCommits = (commits: string[]) => commits.map(createCommit)

export const createConfig = (overrides?: Partial<PerfektConfig>) =>
  new Config(overrides).config

export const summarizeGroupedCommits = (groups: GroupedCommits) =>
  groups.map(group => {
    const summary: Record<string, string | string[]> = {}

    for (const [key, value] of Object.entries(group)) {
      if (!value) continue

      summary[key] = Array.isArray(value)
        ? value.map(commit => commit.message)
        : value.message
    }

    return summary
  })
