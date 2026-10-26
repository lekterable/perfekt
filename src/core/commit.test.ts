import Commit from './commit'

describe('Commit', () => {
  it('should throw if invalid commit passed', () => {
    expect(() => new Commit('Add a feature')).toThrow(
      'Received commit is invalid.',
    )
  })

  it.each([
    [
      'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 Add a new feature',
      {
        isConventional: false,
        type: undefined,
        scope: undefined,
        isBreaking: undefined,
        message: 'Add a new feature',
      },
    ],
    [
      'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable',
      {
        isConventional: true,
        type: 'feat',
        scope: undefined,
        isBreaking: false,
        message: 'make changelog ignored scopes configurable',
      },
    ],
    [
      'c02bbda1489af11372198c01e75110cbac1ebbf3 refactor(config): update `groups` configuration option',
      {
        isConventional: true,
        type: 'refactor',
        scope: 'config',
        isBreaking: false,
        message: 'update `groups` configuration option',
      },
    ],
    [
      'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific',
      {
        isConventional: true,
        type: 'feat',
        scope: undefined,
        isBreaking: true,
        message: 'make no-commits error more specific',
      },
    ],
  ])('should parse %j', (line, expected) => {
    const commit = new Commit(line)

    expect({
      isConventional: commit.isConventional,
      type: commit.type,
      scope: commit.scope,
      isBreaking: commit.isBreaking,
      message: commit.message,
    }).toEqual(expected)
    expect(commit.hash).toBe(line.slice(0, 40))
  })
})
