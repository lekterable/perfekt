import { createConfig } from '~testing/fixtures'
import getChangesType from './get-changes-type'

describe('getChangesType', () => {
  const config = createConfig()

  it.each([
    [['fix', 'feat', 'misc', 'breaking'], 'major'],
    [['feat', 'refactor', 'fix', 'unknown'], 'minor'],
    [['refactor', 'fix', 'unknown'], 'patch'],
    [['misc'], 'patch'],
    [['chore', 'docs', 'test'], undefined],
  ])('should resolve %j to %s', (types, change) => {
    expect(getChangesType(types, config)).toBe(change)
  })
})
