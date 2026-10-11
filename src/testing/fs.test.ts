import { rejectReadFile } from './fs'

describe('fs helpers', () => {
  it('should pass through existing Error instances', () => {
    const error = new Error('boom')
    const callback = jest.fn()

    rejectReadFile(error)('file.txt', 'utf8', callback)

    expect(callback).toHaveBeenCalledWith(error, '')
  })
})
