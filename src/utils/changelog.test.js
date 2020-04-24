import { readFile } from 'fs'
import { generateChangelog, generateLine, generateReleased } from './changelog'

jest.mock('fs', () => ({
  readFile: jest.fn()
}))

describe('changelog', () => {
  beforeEach(() => jest.resetAllMocks())

  describe('generateReleased', () => {
    it('should reject if receives an error', async () => {
      const error = 'error'
      readFile.mockImplementation((_, __, cb) => cb(error))

      expect(generateReleased()).rejects.toMatch(error)
    })

    it('should reject if there is no released but tag provided', async () => {
      const error = 'Previous release not found in CHANGELOG'
      const mockedInput =
        '# Latest\n- feat: include changelog in the releases 2da21c56\n- test: add utils tests 217b25d0'
      readFile.mockImplementation((_, __, cb) => cb(null, mockedInput))

      expect(generateReleased('2.2.2')).rejects.toThrow(error)
    })

    it('should generate released', async () => {
      const mockedInput =
        '# Latest\n- feat: include changelog in the releases 2da21c56\n- test: add utils tests 217b25d0\n# 2.2.2\n- feat: add feature 2da21c56'
      const mockedOutput = '# 2.2.2\n- feat: add feature 2da21c56'
      readFile.mockImplementation((_, __, cb) => cb(null, mockedInput))
      const released = await generateReleased('2.2.2')

      expect(released).toBe(mockedOutput)
    })
  })

  describe('generateChangelog', () => {
    it('should generate changelog', () => {
      const mockedInput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 feat!: add new api',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 feat!: deprecate function'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ]
        },
        {
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
          ],
          feat: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 chore: update dependencies'
          ]
        }
      ]
      const mockedOutput =
        '# Latest\n\n## BREAKING\n\n- add new api b2f59019\n- deprecate function 2ea04355\n\n## Features\n\n- add option to write to local CHANGELOG file aa805ce7\n\n## Misc\n\n- extract line generating logic to function and promisify exec bffc2f9e\n\n# 0.1.0\n\n## Features\n\n- add execute release feature 4e02179c\n\n## Fixes\n\n- support other conventions b2f59019\n\n## Misc\n\n- update dependencies 4e02179c\n\n'

      expect(generateChangelog(null, mockedInput)).toBe(mockedOutput)
    })

    it('should generate changelog with version', () => {
      const mockedInput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 feat!: add new api',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 feat!: deprecate function'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ]
        },
        {
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
          ],
          feat: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 chore: update dependencies'
          ]
        }
      ]
      const mockedOutput =
        '# 2.0.0\n\n## BREAKING\n\n- add new api b2f59019\n- deprecate function 2ea04355\n\n## Features\n\n- add option to write to local CHANGELOG file aa805ce7\n\n## Misc\n\n- extract line generating logic to function and promisify exec bffc2f9e\n\n# 0.1.0\n\n## Features\n\n- add execute release feature 4e02179c\n\n## Fixes\n\n- support other conventions b2f59019\n\n## Misc\n\n- update dependencies 4e02179c\n\n'

      expect(generateChangelog('2.0.0', mockedInput)).toBe(mockedOutput)
    })
  })

  describe('generateLine', () => {
    it('should generate line', () => {
      const mockedInput = {
        message: 'generate changelog',
        hash: 'b2f5901922505efbfb6dd684252e8df0cdffeeb2'
      }
      const mockedOutput = '- generate changelog b2f59019'

      const line = generateLine(mockedInput)

      expect(line).toEqual(mockedOutput)
    })
  })
})
