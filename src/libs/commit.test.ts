import Commit from './commit'

describe('Commit', () => {
  it('should throw if invalid commit passed', () => {
    expect(
      () => new Commit('Add a feature')
    ).toThrowErrorMatchingInlineSnapshot(`"Received commit is invalid."`)
  })

  it('should parse unconventional commit', () => {
    const { commit, hash, message, isConventional, isBreaking, type, scope } =
      new Commit('bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 Add a new feature')

    expect({
      commit,
      hash,
      message,
      isConventional,
      isBreaking,
      type,
      scope
    }).toMatchInlineSnapshot(`
      {
        "commit": "bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 Add a new feature",
        "hash": "bffc2f9e8da1c7ac133689bc9cd14494f3be08e3",
        "isBreaking": undefined,
        "isConventional": false,
        "message": "Add a new feature",
        "scope": undefined,
        "type": undefined,
      }
    `)
  })

  it('should parse conventional commit', () => {
    const { commit, hash, message, isConventional, isBreaking, type, scope } =
      new Commit(
        'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable'
      )

    expect({
      commit,
      hash,
      message,
      isConventional,
      isBreaking,
      type,
      scope
    }).toMatchInlineSnapshot(`
      {
        "commit": "d34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable",
        "hash": "d34a9f12500df6ea21a17b85b783a41b1fca5347",
        "isBreaking": false,
        "isConventional": true,
        "message": "make changelog ignored scopes configurable",
        "scope": undefined,
        "type": "feat",
      }
    `)
  })

  it('should parse commit with scope', () => {
    const { commit, hash, message, isConventional, isBreaking, type, scope } =
      new Commit(
        'c02bbda1489af11372198c01e75110cbac1ebbf3 refactor(config): update `groups` configuration option'
      )

    expect({
      commit,
      hash,
      message,
      isConventional,
      isBreaking,
      type,
      scope
    }).toMatchInlineSnapshot(`
      {
        "commit": "c02bbda1489af11372198c01e75110cbac1ebbf3 refactor(config): update \`groups\` configuration option",
        "hash": "c02bbda1489af11372198c01e75110cbac1ebbf3",
        "isBreaking": false,
        "isConventional": true,
        "message": "update \`groups\` configuration option",
        "scope": "config",
        "type": "refactor",
      }
    `)
  })

  it('should parse breaking commit', () => {
    const { commit, hash, message, isConventional, isBreaking, type, scope } =
      new Commit(
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific'
      )

    expect({
      commit,
      hash,
      message,
      isConventional,
      isBreaking,
      type,
      scope
    }).toMatchInlineSnapshot(`
      {
        "commit": "a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific",
        "hash": "a357a61a4197d01201a84b9ae7ed7f447e16c7d7",
        "isBreaking": true,
        "isConventional": true,
        "message": "make no-commits error more specific",
        "scope": undefined,
        "type": "feat",
      }
    `)
  })
})
