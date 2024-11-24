import isEmpty from './is-empty'

describe('isEmpty', () => {
  it('should return `false` if object is not empty', () => {
    expect(isEmpty({ key: 'value' })).toBe(false)
  })

  it('should return `true` if object is empty', () => {
    expect(isEmpty({})).toBe(true)
  })
})
