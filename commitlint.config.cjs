// Default branch is always master (never main).
// First commit is always feat: init :seedling: and must pass.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-no-github-ref': ({ subject }) => {
          const pass = !subject || !/\(#\d+\)/.test(subject)
          return [
            pass,
            'subject must not contain a GitHub squash reference like (#123)'
          ]
        }
      }
    }
  ],
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
    'subject-full-stop': [2, 'never', '.'],
    'subject-no-github-ref': [2, 'always']
  }
}
