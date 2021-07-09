import { it } from '@jest/globals'
import Options from '.'

describe('Options', () => {
  const defaultOptions = { from: null }
  const testOptions = new Options(defaultOptions)

  beforeEach(() => {
    testOptions.restore()
  })

  describe('get options', () => {
    it('should return default options', () => {
      expect(testOptions.options).toStrictEqual(defaultOptions)
    })
  })

  describe('merge', () => {
    it('should merge options and return', () => {
      const mockOptions = { from: '1.1.1' }
      const newTestOptions = testOptions.merge(mockOptions)

      expect(newTestOptions.options).toStrictEqual({
        ...defaultOptions,
        ...mockOptions
      })
      expect(newTestOptions).toStrictEqual(testOptions)
    })

    it('should merge multiple options and return', () => {
      const mockOptions1 = { from: '1.1.1' }
      const newTestOptions1 = testOptions.merge(mockOptions1)

      expect(newTestOptions1.options).toStrictEqual({
        ...defaultOptions,
        ...mockOptions1
      })
      expect(newTestOptions1).toStrictEqual(testOptions)

      const mockOptions2 = { force: true }
      const newTestOptions2 = testOptions.merge(mockOptions2)

      expect(newTestOptions2.options).toStrictEqual({
        ...defaultOptions,
        ...mockOptions1,
        ...mockOptions2
      })
      expect(newTestOptions2).toStrictEqual(testOptions)
    })
  })

  describe('restore', () => {
    it('should restore options to default', () => {
      const mockOptions = { from: '1.1.1' }
      const newTestOptions = testOptions.merge(mockOptions)

      expect(newTestOptions.options).toStrictEqual({
        ...defaultOptions,
        ...mockOptions
      })

      testOptions.restore()

      expect(newTestOptions.options).toStrictEqual(defaultOptions)
    })
  })
})
