import Options, { defaults } from '.'

describe('Options', () => {
  const testOptions = new Options(defaults.releaseOptions)

  beforeEach(() => {
    testOptions.restore()
  })

  describe('get options', () => {
    it('should return default options', () => {
      expect(testOptions.options).toStrictEqual(defaults.releaseOptions)
    })
  })

  describe('merge', () => {
    it('should merge options and return', () => {
      const mockOptions = { from: '1.1.1' }
      const newTestOptions = testOptions.merge(mockOptions)

      expect(newTestOptions.options).toStrictEqual({
        ...defaults.releaseOptions,
        ...mockOptions
      })
      expect(newTestOptions).toStrictEqual(testOptions)
    })
  })

  describe('restore', () => {
    it('should restore options to default', () => {
      const mockOptions = { from: '1.1.1' }
      const newTestOptions = testOptions.merge(mockOptions)

      expect(newTestOptions.options).toStrictEqual({
        ...defaults.releaseOptions,
        ...mockOptions
      })

      testOptions.restore()

      expect(newTestOptions.options).toStrictEqual(defaults.releaseOptions)
    })
  })
})
