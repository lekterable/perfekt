import defaultConfig from './default'
import Config from '.'

describe('Config', () => {
  const { config } = new Config()

  describe('get config', () => {
    it('should return default config', () => {
      expect(config).toStrictEqual(defaultConfig)
      expect(config).toMatchSnapshot()
    })

    it('should return config with overrides', () => {
      const overrides = {
        unreleasedHeader: '## **Unreleased**',
        releaseHeader: '## Release version - @%version%',
        breakingHeader: '# BREAKING',
        lineFormat: '* %message% %hash% %hash%'
      }
      const { config } = new Config(overrides)

      expect(config).toStrictEqual({ ...defaultConfig, ...overrides })
      expect(config).toMatchSnapshot()
    })

    it('should extend default groups with custom groups', () => {
      const { config } = new Config({
        groups: [{ name: '## Refactors', change: 'patch', types: ['refactor'] }]
      })

      expect(config.groups).toEqual([
        ...defaultConfig.groups,
        { name: '## Refactors', change: 'patch', types: ['refactor'] }
      ])
    })

    it('should replace overlapping default groups when custom groups reuse their types', () => {
      const { config } = new Config({
        groups: [{ name: '## Bug Fixes', change: 'patch', types: ['fix'] }]
      })

      expect(config.groups).toEqual([
        { name: '## Features', change: 'minor', types: ['feat', 'feature'] },
        { name: '## Bug Fixes', change: 'patch', types: ['fix'] }
      ])
    })

    it('should throw when config is not an object', () => {
      expect(() => new Config('nope')).toThrow(
        'Invalid perfekt config: expected an object.'
      )
    })

    it('should throw on unknown top-level properties', () => {
      expect(() => new Config({ nope: true })).toThrow(
        'Invalid perfekt config: contains unknown properties `nope`.'
      )
    })

    it('should throw on invalid group changes', () => {
      expect(
        () =>
          new Config({
            groups: [{ name: '## Docs', change: 'majorish', types: ['docs'] }]
          })
      ).toThrow(
        'Invalid perfekt config: `groups[0].change` must be one of `major`, `minor`, `patch`.'
      )
    })

    it('should throw on invalid miscHeader values', () => {
      expect(() => new Config({ miscHeader: true })).toThrow(
        'Invalid perfekt config: `miscHeader` must be a string.'
      )
    })

    it('should throw on invalid ignoredScopes values', () => {
      expect(() => new Config({ ignoredScopes: ['changelog', 1] })).toThrow(
        'Invalid perfekt config: `ignoredScopes` must be an array of strings.'
      )
    })

    it('should throw when groups is not an array', () => {
      expect(() => new Config({ groups: 'docs' })).toThrow(
        'Invalid perfekt config: `groups` must be an array.'
      )
    })

    it('should throw when group entries are not objects', () => {
      expect(() => new Config({ groups: ['docs'] })).toThrow(
        'Invalid perfekt config: `groups[0]` must be an object.'
      )
    })

    it('should throw on unknown group properties', () => {
      expect(
        () =>
          new Config({
            groups: [
              {
                name: '## Docs',
                change: 'patch',
                types: ['docs'],
                extra: true
              }
            ]
          })
      ).toThrow(
        'Invalid perfekt config: `groups[0]` contains unknown properties `extra`.'
      )
    })
  })
})
