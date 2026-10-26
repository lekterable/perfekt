// The shared commit rules: @commitlint/config-conventional plus the house overrides, without
// commitlint. Self-contained (no imports) so the shared PR title workflow can run this file with
// plain node straight from a sparse checkout.

export const COMMIT_TYPES = [
  'feat',
  'fix',
  'chore',
  'refactor',
  'docs',
  'test',
  'ci',
  'build',
  'style',
  'perf',
  'revert',
] as const

export const HEADER_MAX_LENGTH = 72
export const SUBJECT_MAX_LENGTH = 50
export const LINE_MAX_LENGTH = 100

export type LintResult = {
  valid: boolean
  ignored: boolean
  errors: string[]
  warnings: string[]
}

// Messages git or a release tool writes, as in commitlint's default ignores.
const IGNORED = [
  /^((Merge pull request)|(Merge (.*?) into (.*?)|(Merge branch (.*?)))(?:\r?\n)*$)/m,
  /^(Merge tag (.*?))(?:\r?\n)*$/m,
  /^(R|r)evert (.*)/,
  /^(R|r)eapply (.*)/,
  /^(amend|fixup|squash)!/,
  /^(chore(\([^)]+\))?:\s*)?v?\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?\s*(\n|$)/,
  /^(Merged (.*?)(in|into) (.*)|Merged PR (.*): (.*))/,
  /^Merge remote-tracking branch(\s*)(.*)/,
  /^Automatic merge(.*)/,
  /^Auto-merged (.*?) into (.*)/,
]

const HEADER = /^(\w*)(?:\((.*)\))?!?: (.*)$/
const NOTE = /^BREAKING[ -]CHANGE: /
const URL = /\bhttps?:\/\/\S+/

const IMPERATIVE_EXCEPTIONS = new Set([
  'bring',
  'embed',
  'exceed',
  'feed',
  'need',
  'proceed',
  'seed',
  'shred',
  'speed',
  'spring',
  'string',
  'succeed',
  'swing',
])

const isNonImperative = (word: string) =>
  !IMPERATIVE_EXCEPTIONS.has(word) &&
  (/(ed|ing)$/.test(word) || /[^siua]s$/.test(word))

/** Drops the comments and the `git commit -v` diff git leaves in a commit message file. */
export const cleanMessage = (raw: string) =>
  raw
    .replace(/\r\n?/g, '\n')
    .split(/^# -+ >8 -+$/m)[0]
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n')
    .replace(/\s+$/, '')

export const lintMessage = (raw: string): LintResult => {
  const message = raw.replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, '')

  if (IGNORED.some((pattern) => pattern.test(message))) {
    return { valid: true, ignored: true, errors: [], warnings: [] }
  }

  const [header = '', ...rest] = message.split('\n')
  const [, type = '', , subject = ''] = HEADER.exec(header) ?? []
  const firstWord = subject.split(' ')[0].toLowerCase()
  const noteIndex = rest.findIndex((line) => NOTE.test(line))
  const tooLong = rest.some(
    (line) => line.length > LINE_MAX_LENGTH && !URL.test(line),
  )

  const errors = [
    header !== header.trim() && 'header must not start or end with whitespace',
    header.length > HEADER_MAX_LENGTH &&
      `header must not be longer than ${HEADER_MAX_LENGTH} characters, current length is ${header.length}`,
    !type && 'type may not be empty',
    type && type !== type.toLowerCase() && 'type must be lower-case',
    type &&
      !(COMMIT_TYPES as readonly string[]).includes(type) &&
      `type must be one of [${COMMIT_TYPES.join(', ')}]`,
    !subject && 'subject may not be empty',
    /^[\p{Lu}\p{Lt}]/u.test(subject) &&
      'subject must not be sentence-case, start-case, pascal-case, upper-case',
    header.endsWith('.') &&
      !header.endsWith('...') &&
      'subject may not end with full stop',
    tooLong &&
      `body's lines must not be longer than ${LINE_MAX_LENGTH} characters`,
  ].filter((problem): problem is string => Boolean(problem))

  const warnings = [
    rest.length > 0 && rest[0] !== '' && 'body must have leading blank line',
    noteIndex > 0 &&
      rest[noteIndex - 1] !== '' &&
      'footer must have leading blank line',
    subject.length > SUBJECT_MAX_LENGTH &&
      `subject must not be longer than ${SUBJECT_MAX_LENGTH} characters`,
    /^[a-z]+$/.test(firstWord) &&
      isNonImperative(firstWord) &&
      `subject should start with an imperative verb ("add", not "${firstWord}")`,
  ].filter((problem): problem is string => Boolean(problem))

  return { valid: errors.length === 0, ignored: false, errors, warnings }
}

/** The report commitlint prints: the input, one line per problem, then the counts. */
export const formatLint = (message: string, result: LintResult) =>
  [
    `⧗ input: ${message.split('\n')[0]}`,
    ...result.errors.map((error) => `✖ ${error}`),
    ...result.warnings.map((warning) => `⚠ ${warning}`),
    `${result.valid ? '✔' : '✖'} found ${result.errors.length} problems, ${result.warnings.length} warnings`,
  ].join('\n')
