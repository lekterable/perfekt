import getChangesType from './get-changes-type'
import Config from '../../config'

const generateError = (type: string) =>
  `Unexpected commit type \`${type}\` received.`

describe('getChangesType', () => {
  const { config } = new Config()

  let warnSpy: jest.SpiedFunction<typeof console.warn>

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn')
  })

  it('should return `undefined` and warn when cannot determine version update', () => {
    const mockTypes = ['refactor', 'chore']

    warnSpy.mockImplementation()

    const type = getChangesType(mockTypes, config)

    expect(warnSpy).toBeCalledTimes(2)
    expect(warnSpy).toHaveBeenNthCalledWith(1, generateError('refactor'))
    expect(warnSpy).toHaveBeenNthCalledWith(2, generateError('chore'))
    expect(type).toBeUndefined()
  })

  it('should determine version update with unknown types', () => {
    const mockTypes = ['feat', 'refactor', 'fix', 'unknown', 'custom']

    warnSpy.mockImplementation()

    const type = getChangesType(mockTypes, config)

    expect(warnSpy).toBeCalledTimes(3)
    expect(warnSpy).toHaveBeenNthCalledWith(1, generateError('refactor'))
    expect(warnSpy).toHaveBeenNthCalledWith(2, generateError('unknown'))
    expect(warnSpy).toHaveBeenNthCalledWith(3, generateError('custom'))
    expect(type).toBe('minor')
  })

  it('should return `major` for `breaking`', () => {
    const mockTypes = ['fix', 'misc', 'fix', 'feat', 'misc', 'misc', 'breaking']

    const type = getChangesType(mockTypes, config)

    expect(warnSpy).not.toBeCalled()
    expect(type).toBe('major')
  })

  it('should return `minor` for `feature`', () => {
    const mockTypes = ['fix', 'misc', 'fix', 'feat', 'misc', 'misc']

    const type = getChangesType(mockTypes, config)

    expect(warnSpy).not.toBeCalled()
    expect(type).toBe('minor')
  })

  it('should return `patch` for `fix`', () => {
    const mockTypes = ['refactor', 'fix', 'unknown']

    warnSpy.mockImplementation()

    const type = getChangesType(mockTypes, config)

    expect(warnSpy).toBeCalledTimes(2)
    expect(warnSpy).toHaveBeenNthCalledWith(1, generateError('refactor'))
    expect(warnSpy).toHaveBeenNthCalledWith(2, generateError('unknown'))
    expect(type).toBe('patch')
  })

  it('should return `patch` for `misc`', () => {
    const mockTypes = ['misc', 'misc', 'misc']

    const type = getChangesType(mockTypes, config)

    expect(warnSpy).not.toBeCalled()
    expect(type).toBe('patch')
  })
})
