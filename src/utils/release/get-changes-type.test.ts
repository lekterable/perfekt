import getChangesType, { sortChangeTypes } from './get-changes-type'
import Config from '~core/config'

describe('getChangesType', () => {
  const { config } = new Config()

  it('should determine version update with unknown types', () => {
    const mockTypes = ['feat', 'refactor', 'fix', 'unknown', 'custom']

    const type = getChangesType(mockTypes, config)

    expect(type).toBe('minor')
  })

  it('should return `undefined` when no supported bump types are present', () => {
    const mockTypes = ['chore', 'docs', 'test']

    const type = getChangesType(mockTypes, config)

    expect(type).toBeUndefined()
  })

  it('should return `major` for `breaking`', () => {
    const mockTypes = ['fix', 'misc', 'fix', 'feat', 'misc', 'misc', 'breaking']

    const type = getChangesType(mockTypes, config)

    expect(type).toBe('major')
  })

  it('should return `minor` for `feature`', () => {
    const mockTypes = ['fix', 'misc', 'fix', 'feat', 'misc', 'misc']

    const type = getChangesType(mockTypes, config)

    expect(type).toBe('minor')
  })

  it('should return `patch` for `fix` and `refactor`', () => {
    const mockTypes = ['refactor', 'fix', 'unknown']

    const type = getChangesType(mockTypes, config)

    expect(type).toBe('patch')
  })

  it('should return `patch` for `misc`', () => {
    const mockTypes = ['misc', 'misc', 'misc']

    const type = getChangesType(mockTypes, config)

    expect(type).toBe('patch')
  })

  it('should sort undefined change types after supported ones', () => {
    expect(sortChangeTypes(undefined, undefined)).toBe(0)
    expect(sortChangeTypes(undefined, 'minor')).toBe(1)
    expect(sortChangeTypes('patch', undefined)).toBe(-1)
  })

  it('should handle arrays that only resolve to undefined changes', () => {
    const mockTypes = ['unknown', 'custom']

    const type = getChangesType(mockTypes, config)

    expect(type).toBeUndefined()
  })
})
