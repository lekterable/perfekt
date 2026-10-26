#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { Command, CommanderError } from 'commander'
import { cosmiconfigSync, getDefaultSearchPlacesSync } from 'cosmiconfig'
import type {
  ChangelogOptions,
  ChangelogResult,
  ReleaseOptions,
  ReleaseResult,
  SetupCommitsOptions,
  SetupCommitsResult,
} from '~types'
import { Config, Perfekt } from './core'
import { type CiResult, type CiStep, ci } from './core/ci'
import { SQUASH_MERGE_NOTE } from './core/commits'
import { cleanMessage, formatLint, lintMessage } from './core/lint'

type ChangelogCommandOptions = ChangelogOptions & { json?: boolean }
type ReleaseCommandOptions = ReleaseOptions & { json?: boolean }

type PerfektCLI = Pick<Perfekt, 'init' | 'setupCommits'> & {
  changelog: (
    version: string | undefined,
    options: Partial<ChangelogOptions>,
    output?: 'default' | 'silent',
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
      command: 'setup'
      files: SetupCommitsResult['files']
      defaultBranch: SetupCommitsResult['defaultBranch']
      lekterableTip: string
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
      success: boolean
      command: 'ci'
      dir: string
      steps: CiStep[]
    }
  | {
      success: boolean
      command: 'lint'
      input: string
      ignored: boolean
      errors: string[]
      warnings: string[]
    }
  | {
      success: false
      command:
        | 'changelog'
        | 'release'
        | 'init'
        | 'setup'
        | 'ci'
        | 'lint'
        | 'unknown'
      error: {
        code: string
        message: string
      }
    }

export const readPackageVersion = (
  packageJsonPath = path.resolve(__dirname, '../package.json'),
) =>
  (JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version: string })
    .version

// perfekt.json and perfekt.yaml first, like biome.json or turbo.json, then cosmiconfig's own
// places (package.json, .perfektrc, perfekt.config.js and the rest).
export const CONFIG_SEARCH_PLACES = [
  'perfekt.json',
  'perfekt.yaml',
  'perfekt.yml',
  ...getDefaultSearchPlacesSync('perfekt'),
]

export const loadConfig = () =>
  cosmiconfigSync('perfekt', { searchPlaces: CONFIG_SEARCH_PLACES }).search()
    ?.config

export const createPerfekt = (overrides = loadConfig()) => {
  const { config } = new Config(overrides)

  return new Perfekt(config)
}

const writeJson = (response: JsonResponse) =>
  process.stdout.write(JSON.stringify(response, null, 2) + '\n')

type DetailRow = [label: string, value: string]

const formatDetailBlock = (
  title: string,
  rows: DetailRow[],
  writer: typeof process.stdout.write = process.stdout.write.bind(
    process.stdout,
  ),
) => {
  const labels = rows.map(([label]) => `${label}:`)
  const width = Math.max(...labels.map((label) => label.length))
  const lines = [
    title,
    '',
    ...rows.map(([label, value]) => `  ${`${label}:`.padEnd(width)}  ${value}`),
  ]

  writer(lines.join('\n') + '\n')
}

const printSetupCommitsSummary = (result: SetupCommitsResult) => {
  const written = result.files
    .filter((file) => file.status === 'written')
    .map((file) => file.path)
  const skipped = result.files
    .filter((file) => file.status === 'skipped')
    .map((file) => file.path)

  formatDetailBlock('🌱 Commit linting setup', [
    ['Written', written.join(', ') || 'none'],
    ['Skipped', skipped.join(', ') || 'none'],
    ['Default branch', result.defaultBranch ?? 'not detected'],
    ['Tip', result.lekterableTip],
  ])

  process.stdout.write(`\n  ${SQUASH_MERGE_NOTE}\n`)
}

const STEP_ICONS = { passed: '✓', failed: '✗', skipped: '–', 'not run': '·' }

const printCiSummary = (result: CiResult) => {
  const width = Math.max(...result.steps.map((step) => step.name.length))
  const lines = result.steps.map((step) => {
    const time = step.ms > 0 ? ` ${(step.ms / 1000).toFixed(1)}s` : ''
    const detail = step.detail ? `  ${step.detail}` : ''

    return `  ${STEP_ICONS[step.status]} ${step.name.padEnd(width)}${time}${detail}`
  })
  const failed = result.steps.find((step) => step.status === 'failed')

  process.stdout.write(
    `${result.success ? '✅ CI passed' : '❌ CI failed'}\n\n${lines.join('\n')}\n`,
  )
  if (failed?.output) process.stdout.write(`\n${failed.output}\n`)
}

const printReleaseSummary = (result: ReleaseResult) => {
  const title = result.dryRun ? '🧭 Release plan' : '📦 Release summary'

  formatDetailBlock(title, [
    ['Version', `${result.currentVersion} -> ${result.resolvedVersion}`],
    ['Package manager', result.packageManager],
    ['From', result.from ?? 'root'],
    ['Files', result.files.join(', ')],
    ['Commit', result.git.commitMessage],
    ['Tag', result.git.tag],
    ['Commits included', String(result.commitCount)],
  ])
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

const printCliError = (
  command: ReturnType<typeof getCommandName>,
  error: unknown,
) => {
  const message = error instanceof Error ? error.message : String(error)
  const title =
    command === 'unknown'
      ? '⛔️ Command failed'
      : `⛔️ ${capitalize(command)} failed`

  formatDetailBlock(
    title,
    [['Reason', message]],
    process.stderr.write.bind(process.stderr),
  )
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
  markdown: result.markdown,
})

const createSetupResponse = (result: SetupCommitsResult): JsonResponse => ({
  success: true,
  command: 'setup',
  files: result.files,
  defaultBranch: result.defaultBranch,
  lekterableTip: result.lekterableTip,
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
  changelog: result.changelog,
})

export const getCommandName = (
  argv = process.argv,
): 'changelog' | 'release' | 'init' | 'setup' | 'ci' | 'lint' | 'unknown' => {
  const command = argv[2]

  if (
    command === 'changelog' ||
    command === 'release' ||
    command === 'init' ||
    command === 'setup' ||
    command === 'ci' ||
    command === 'lint'
  ) {
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
  jsonOutput = false,
) => {
  const program = new Command()

  program.exitOverride()
  program.configureOutput(
    jsonOutput
      ? {
          writeErr: () => undefined,
          writeOut: () => undefined,
        }
      : {
          writeErr: () => undefined,
        },
  )

  program.name('perfekt').version(version, '-v, --version')

  program
    .command('init [file]')
    .description(
      'write an empty config: perfekt.json (default), perfekt.yaml, .perfektrc or perfekt.config.js',
    )
    .action(async (file?: string) => {
      const written = await perfekt.init(file)
      process.stdout.write(`🌱 Wrote ${written}\n`)
    })

  const setup = program
    .command('setup')
    .description('scaffold project conventions')

  setup
    .command('commits')
    .description(
      'add a GitHub Action that lints pull request titles with perfekt lint',
    )
    .option('--force', 'overwrite an existing workflow')
    .option('--json', 'print the command result as JSON')
    .action(async (options: SetupCommitsOptions & { json?: boolean }) => {
      const { json = false, ...setupOptions } = options
      const result = await perfekt.setupCommits({
        force: Boolean(setupOptions.force),
      })

      if (json) {
        writeJson(createSetupResponse(result))
        return
      }

      printSetupCommitsSummary(result)
    })

  program
    .command('changelog [version]')
    .description('generate package changelog')
    .option('--write', 'write output to the file')
    .option('--json', 'print the command result as JSON')
    .option('--root', 'generate changelog for the entire history')
    .option(
      '--from <commit>',
      'SHA of the last commit which will NOT be included in this changelog',
    )
    .action(async (nextVersion, options: ChangelogCommandOptions) => {
      const { json = false, ...changelogOptions } = options
      const result = await perfekt.changelog(
        nextVersion,
        changelogOptions,
        json ? 'silent' : 'default',
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
      'SHA of the last commit which will NOT be included in this release',
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

  program
    .command('ci')
    .description(
      'run the shared CI steps on a clean checkout of HEAD: install, commits, lint, typecheck, test, build',
    )
    .option('--dirty', 'run in this folder, uncommitted changes included')
    .option(
      '--title <title>',
      'lint this pull request title instead of the branch commits',
    )
    .option(
      '--base <ref>',
      'lint the commits since this ref (default: origin/HEAD, else origin/master)',
    )
    .option('--json', 'print the command result as JSON')
    .addHelpText(
      'after',
      `
Stops at the first failing step, prints the end of its output and exits 1.

Examples:
  perfekt ci                          # before opening a pull request
  perfekt ci --dirty                  # include uncommitted changes
  perfekt ci --title "feat: add x"    # lint the PR title, not the commits
  perfekt ci --json                   # steps, timings and failure output`,
    )
    .action(
      async (options: {
        dirty?: boolean
        title?: string
        base?: string
        json?: boolean
      }) => {
        const { json = false, ...ciOptions } = options
        const result = await ci(ciOptions)

        if (json) writeJson({ command: 'ci', ...result })
        else printCiSummary(result)

        if (!result.success) process.exitCode = 1
      },
    )

  program
    .command('lint [message]')
    .description(
      'lint a commit message or pull request title with the shared rules (reads stdin without a message)',
    )
    .option(
      '--edit <file>',
      'lint the message in this file, as a commit-msg hook passes it',
    )
    .option('--json', 'print the command result as JSON')
    .addHelpText(
      'after',
      `
Exits 1 when the message breaks a rule; warnings print but pass.

Examples:
  perfekt lint "feat(cli): add x"
  git log -1 --format=%B | perfekt lint
  perfekt lint --edit "$1"          # in a git commit-msg hook`,
    )
    .action(
      async (
        message: string | undefined,
        options: { edit?: string; json?: boolean },
      ) => {
        if (message === undefined && !options.edit && process.stdin.isTTY) {
          throw new Error(
            'Pass a message, --edit <file>, or pipe the message in',
          )
        }

        const input = cleanMessage(
          message ??
            (options.edit
              ? fs.readFileSync(options.edit, 'utf8')
              : fs.readFileSync(0, 'utf8')),
        )
        const result = lintMessage(input)

        if (options.json) {
          writeJson({
            success: result.valid,
            command: 'lint',
            input,
            ignored: result.ignored,
            errors: result.errors,
            warnings: result.warnings,
          })
        } else if (result.errors.length + result.warnings.length > 0) {
          const report = formatLint(input, result)
          if (result.valid) process.stdout.write(`${report}\n`)
          else process.stderr.write(`${report}\n`)
        }

        if (!result.valid) process.exitCode = 1
      },
    )

  return program
}

const isCommanderDisplayExit = (error: unknown) =>
  error instanceof CommanderError && error.exitCode === 0

export const run = async (argv = process.argv) => {
  const version = readPackageVersion()
  const jsonOutput = argv.includes('--json')
  const warn = console.warn

  try {
    if (jsonOutput) {
      console.warn = () => undefined
    }

    // Inside the try, so an invalid config reports INVALID_CONFIG instead of a stack trace.
    await createProgram(createPerfekt(), version, jsonOutput).parseAsync(argv)
  } catch (error) {
    if (isCommanderDisplayExit(error)) {
      return
    }

    if (!jsonOutput) {
      printCliError(getCommandName(argv), error)
      process.exitCode = error instanceof CommanderError ? error.exitCode : 1
      return
    }

    writeJson({
      success: false,
      command: getCommandName(argv),
      error: {
        code: getErrorCode(error),
        message: error instanceof Error ? error.message : String(error),
      },
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
