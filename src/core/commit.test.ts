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
    [
      'b7c1e0d2a4f6e8c0b2d4f6a8c0e2b4d6f8a0c2e4 feat(api-client): add retries',
      {
        isConventional: true,
        type: 'feat',
        scope: 'api-client',
        isBreaking: false,
        message: 'add retries',
      },
    ],
    [
      'c8d2f1e3b5a7c9e1d3f5b7a9c1e3d5f7b9a1c3e5 fix(web/auth.v2): keep the session',
      {
        isConventional: true,
        type: 'fix',
        scope: 'web/auth.v2',
        isBreaking: false,
        message: 'keep the session',
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

  it.each([
    ['BREAKING CHANGE: /v1 is gone', true],
    ['Closes #12\nBREAKING-CHANGE: /v1 is gone', true],
    ['Mentions a BREAKING CHANGE: inline', false],
    ['', false],
  ])('should read a breaking change footer from %j', (body, isBreaking) => {
    const commit = new Commit(
      'a05ed8ff3c1d2e4f5a6b7c8d9e0f1a2b3c4d5e6f fix: drop the legacy endpoint',
      body,
    )

    expect(commit.isBreaking).toBe(isBreaking)
  })
})
