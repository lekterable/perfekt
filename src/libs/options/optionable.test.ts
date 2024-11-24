import Options, { defaults } from '.'
import Optionable from './optionable'

describe('Optionable', () => {
  const optionable = new Optionable(defaults.releaseOptions)

  let restoreSpy: jest.SpiedFunction<typeof Options.prototype.restore>
  let mergeSpy: jest.SpiedFunction<typeof Options.prototype.merge>

  beforeEach(() => {
    restoreSpy = jest.spyOn(Options.prototype, 'restore')
    mergeSpy = jest.spyOn(Options.prototype, 'merge')
  })

  describe('get options', () => {
    it('should return options', () => {
      expect(optionable.options).toStrictEqual(defaults.releaseOptions)
    })
  })

  describe('set options', () => {
    it('should set options', () => {
      const options = { from: '1.1.1' }

      optionable.options = options

      expect(restoreSpy).toBeCalledTimes(1)
      expect(mergeSpy).toBeCalledTimes(1)
      expect(optionable.options).toStrictEqual(options)
    })

    it('should restore options', () => {
      const options = { from: '1.1.1' }

      optionable.options = options

      expect(restoreSpy).toBeCalledTimes(1)
      expect(mergeSpy).toBeCalledTimes(1)
      expect(optionable.options).toStrictEqual({
        ...defaults.releaseOptions,
        ...options
      })

      optionable.options = defaults.changelogOptions

      expect(restoreSpy).toBeCalledTimes(2)
      expect(mergeSpy).toBeCalledTimes(2)
      expect(optionable.options).toStrictEqual(defaults.changelogOptions)
    })

    it('should set options multiple times', () => {
      const options1 = { from: '1.1.1' }

      optionable.options = options1

      expect(restoreSpy).toBeCalledTimes(1)
      expect(mergeSpy).toBeCalledTimes(1)
      expect(optionable.options).toStrictEqual({
        ...defaults.releaseOptions,
        ...options1
      })

      const options2 = { from: '2.2.2' }

      optionable.options = options2

      expect(restoreSpy).toBeCalledTimes(2)
      expect(mergeSpy).toBeCalledTimes(2)
      expect(optionable.options).toStrictEqual({
        ...defaults.releaseOptions,
        ...options2
      })

      const options3 = { from: '3.3.3' }

      optionable.options = options3

      expect(restoreSpy).toBeCalledTimes(3)
      expect(mergeSpy).toBeCalledTimes(3)
      expect(optionable.options).toStrictEqual({
        ...defaults.releaseOptions,
        ...options3
      })
    })
  })
})
