module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
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
    ],
    'subject-full-stop': [2, 'never', '.']
  }
}
