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
        breakingHeader: '# BREAKING',
        lineFormat: '* %message% %hash% %hash%',
        unreleasedHeader: '## **Unreleased**',
        releaseHeader: '## Release version - @%version%'
      }
      const { config } = new Config(overrides)

      expect(config).toStrictEqual({ ...defaultConfig, ...overrides })
      expect(config).toMatchSnapshot()
    })
  })
})
