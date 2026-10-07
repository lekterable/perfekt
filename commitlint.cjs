const COMMIT_TYPES = [
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
  'revert'
]

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
  'swing'
])

const isNonImperative = word =>
  !IMPERATIVE_EXCEPTIONS.has(word) &&
  (/(ed|ing)$/.test(word) || /[^siua]s$/.test(word))

const subjectImperative = ({ subject }) => {
  const firstWord = subject?.split(' ')[0]?.toLowerCase()

  if (!firstWord || !/^[a-z]+$/.test(firstWord)) return [true]

  return [
    !isNonImperative(firstWord),
    `subject should start with an imperative verb ("add", not "${firstWord}")`
  ]
}

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [{ rules: { 'subject-imperative': subjectImperative } }],
  rules: {
    'type-enum': [2, 'always', COMMIT_TYPES],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'subject-max-length': [1, 'always', 50],
    'subject-imperative': [1, 'always']
  }
}
