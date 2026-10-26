import Config from '.'
import defaultConfig from './default'

describe('Config', () => {
  it('should return the default config', () => {
    expect(new Config().config).toStrictEqual(defaultConfig)
  })

  it('should return the config with overrides', () => {
    const overrides = {
      unreleasedHeader: '## **Unreleased**',
      releaseHeader: '## Release version - @%version%',
      breakingHeader: '# BREAKING',
      lineFormat: '* %message% %hash% %hash%',
    }

    expect(new Config(overrides).config).toStrictEqual({
      ...defaultConfig,
      ...overrides,
    })
  })

  it('should extend default groups with custom groups', () => {
    const { config } = new Config({
      groups: [{ name: '## Refactors', change: 'patch', types: ['refactor'] }],
    })

    expect(config.groups).toEqual([
      ...defaultConfig.groups,
      { name: '## Refactors', change: 'patch', types: ['refactor'] },
    ])
  })

  it('should replace overlapping default groups when custom groups reuse their types', () => {
    const { config } = new Config({
      groups: [{ name: '## Bug Fixes', change: 'patch', types: ['fix'] }],
    })

    expect(config.groups).toEqual([
      { name: '## Features', change: 'minor', types: ['feat', 'feature'] },
      { name: '## Bug Fixes', change: 'patch', types: ['fix'] },
    ])
  })

  it.each([
    ['nope', 'expected an object.'],
    [{ nope: true }, 'contains unknown properties `nope`.'],
    [
      { groups: [{ name: '## Docs', change: 'majorish', types: ['docs'] }] },
      '`groups[0].change` must be one of `major`, `minor`, `patch`.',
    ],
    [{ miscHeader: true }, '`miscHeader` must be a string.'],
    [
      { ignoredScopes: ['changelog', 1] },
      '`ignoredScopes` must be an array of strings.',
    ],
    [{ groups: 'docs' }, '`groups` must be an array.'],
    [{ groups: ['docs'] }, '`groups[0]` must be an object.'],
    [
      {
        groups: [
          { name: '## Docs', change: 'patch', types: ['docs'], extra: true },
        ],
      },
      '`groups[0]` contains unknown properties `extra`.',
    ],
  ])('should reject %j', (overrides, message) => {
    expect(() => new Config(overrides)).toThrow(
      `Invalid perfekt config: ${message}`,
    )
  })
})
