#!/usr/bin/env node

import { Command, CommanderError } from 'commander'
import { cosmiconfigSync } from 'cosmiconfig'
import fs from 'node:fs'
import path from 'node:path'
import { Config, Perfekt } from './core'
import {
  ChangelogOptions,
  ChangelogResult,
  ReleaseOptions,
  ReleaseResult
} from '~types'

type ChangelogCommandOptions = ChangelogOptions & { json?: boolean }
type ReleaseCommandOptions = ReleaseOptions & { json?: boolean }

type PerfektCLI = Pick<Perfekt, 'init'> & {
  changelog: (
    version: string | undefined,
    options: Partial<ChangelogOptions>,
    output?: 'default' | 'silent'
  ) => Promise<ChangelogResult>
  release: (version: string, options: ReleaseOptions) => Promise<ReleaseResult>
}

type JsonResponse =
  | {
      success: true
      command: 'changelog'
      write: boolean
      version: string | null
      latestTag: string | null
      from: string | null
      root: boolean
      commitCount: number
      commits: ChangelogResult['commits']
      groups: ChangelogResult['groups']
      markdown: string
    }
  | {
      success: true
      command: 'release'
      dryRun: boolean
      requestedVersion: string
      resolvedVersion: string
      resolvedBump: ReleaseResult['resolvedBump']
      packageManager: ReleaseResult['packageManager']
      currentVersion: string
      latestTag: string | null
      from: string | null
      files: string[]
      git: ReleaseResult['git']
      commitCount: number
      commits: ReleaseResult['commits']
      groups: ReleaseResult['groups']
      changelog: ReleaseResult['changelog']
    }
  | {
      success: false
      command: 'changelog' | 'release' | 'init' | 'unknown'
      error: {
        code: string
        message: string
      }
    }

export const readPackageVersion = (
  packageJsonPath = path.resolve(__dirname, '../package.json')
) =>
  (JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version: string })
    .version

export const loadConfig = () => cosmiconfigSync('perfekt').search()?.config

export const createPerfekt = (overrides = loadConfig()) => {
  const { config } = new Config(overrides)

  return new Perfekt(config)
}

const writeJson = (response: JsonResponse) =>
  process.stdout.write(JSON.stringify(response, null, 2) + '\n')

const printReleaseSummary = (result: ReleaseResult) => {
  const label = result.dryRun ? 'Release plan' : 'Release summary'
  const lines = [
    label,
    `version: ${result.currentVersion} -> ${result.resolvedVersion}`,
    `package manager: ${result.packageManager}`,
    `from: ${result.from ?? 'root'}`,
    `files: ${result.files.join(', ')}`,
    `commit: ${result.git.commitMessage}`,
    `tag: ${result.git.tag}`,
    `commits included: ${result.commitCount}`
  ]

  process.stdout.write(lines.join('\n') + '\n')
}

const createChangelogResponse = (result: ChangelogResult): JsonResponse => ({
  success: true,
  command: 'changelog',
  write: result.write,
  version: result.version,
  latestTag: result.latestTag,
  from: result.from,
  root: result.root,
  commitCount: result.commitCount,
  commits: result.commits,
  groups: result.groups,
  markdown: result.markdown
})

const createReleaseResponse = (result: ReleaseResult): JsonResponse => ({
  success: true,
  command: 'release',
  dryRun: result.dryRun,
  requestedVersion: result.requestedVersion,
  resolvedVersion: result.resolvedVersion,
  resolvedBump: result.resolvedBump,
  packageManager: result.packageManager,
  currentVersion: result.currentVersion,
  latestTag: result.latestTag,
  from: result.from,
  files: result.files,
  git: result.git,
  commitCount: result.commitCount,
  commits: result.commits,
  groups: result.groups,
  changelog: result.changelog
})

export const getCommandName = (
  argv = process.argv
): 'changelog' | 'release' | 'init' | 'unknown' => {
  const command = argv[2]

  if (command === 'changelog' || command === 'release' || command === 'init') {
    return command
  }

  return 'unknown'
}

export const getErrorCode = (error: unknown) => {
  if (error instanceof CommanderError) return 'INVALID_COMMAND'

  const message = error instanceof Error ? error.message : String(error)

  if (message.startsWith('Invalid perfekt config')) return 'INVALID_CONFIG'
  if (message.includes("doesn't look right")) return 'INVALID_VERSION'
  if (message.includes("couldn't be bumped")) return 'INVALID_VERSION'
  if (message.includes('No unreleased commits')) return 'NO_UNRELEASED_COMMITS'
  if (message.includes("Couldn't determine a version bump")) {
    return 'INVALID_COMMIT_TYPES'
  }
  if (message.includes('Working tree must be clean')) {
    return 'DIRTY_WORKTREE'
  }

  if (message.includes("Couldn't get unreleased commits")) {
    return 'MISSING_RELEASE_TAG'
  }

  return 'UNKNOWN_ERROR'
}

export const createProgram = (
  perfekt: PerfektCLI,
  version: string,
  jsonOutput = false
) => {
  const program = new Command()

  program.exitOverride()

  if (jsonOutput) {
    program.configureOutput({
      writeErr: () => undefined,
      writeOut: () => undefined
    })
  }

  program.name('perfekt').version(version)

  program
    .command('init')
    .description('initialize config')
    .action(() => perfekt.init())

  program
    .command('changelog [version]')
    .description('generate package changelog')
    .option('--write', 'write output to the file')
    .option('--json', 'print the command result as JSON')
    .option('--root', 'generate changelog for the entire history')
    .option(
      '--from <commit>',
      'SHA of the last commit which will NOT be included in this changelog'
    )
    .action(async (nextVersion, options: ChangelogCommandOptions) => {
      const { json = false, ...changelogOptions } = options
      const result = await perfekt.changelog(
        nextVersion,
        changelogOptions,
        json ? 'silent' : 'default'
      )

      if (json) {
        writeJson(createChangelogResponse(result))
      }
    })

  program
    .command('release <version>')
    .description('execute a new release')
    .option('--dry-run', 'preview the release without changing files or git')
    .option('--json', 'print the command result as JSON')
    .option(
      '--from <commit>',
      'SHA of the last commit which will NOT be included in this release'
    )
    .action(async (nextVersion, options: ReleaseCommandOptions) => {
      const { json = false, ...releaseOptions } = options
      const result = await perfekt.release(nextVersion, releaseOptions)

      if (json) {
        writeJson(createReleaseResponse(result))
        return
      }

      printReleaseSummary(result)
    })

  return program
}

export const run = async (argv = process.argv) => {
  const version = readPackageVersion()
  const perfekt = createPerfekt()
  const jsonOutput = argv.includes('--json')
  const warn = console.warn

  try {
    if (jsonOutput) {
      console.warn = () => undefined
    }

    await createProgram(perfekt, version, jsonOutput).parseAsync(argv)
  } catch (error) {
    if (!jsonOutput) {
      if (error instanceof CommanderError) {
        process.exitCode = error.exitCode
        return
      }

      throw error
    }

    writeJson({
      success: false,
      command: getCommandName(argv),
      error: {
        code: getErrorCode(error),
        message: error instanceof Error ? error.message : String(error)
      }
    })
    process.exitCode = error instanceof CommanderError ? error.exitCode : 1
  } finally {
    console.warn = warn
  }
}

/* istanbul ignore next */
if (require.main === module) {
  void run()
}
