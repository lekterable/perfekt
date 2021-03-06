import { existsSync, readFile } from 'fs'
import { defaultConfig } from '../'
import {
  generateChangelog,
  generateLine,
  generateReleased,
  groupCommits
} from './changelog'

jest.mock('fs', () => ({ readFile: jest.fn(), existsSync: jest.fn() }))

describe('changelog', () => {
  describe('groupCommits', () => {
    it('should group commits with no releases', async () => {
      const mockedInput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
      ]
      const mockedOutput = [
        {
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should group commits', async () => {
      const mockedInput = [
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      ]
      const mockedOutput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases'
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
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should group commits with custom config', async () => {
      const config = {
        ...defaultConfig,
        groups: [
          { name: '## Feat', types: ['feat', 'feature'] },
          { name: '## Fix', types: ['fix'] },
          { name: '## Custom', types: ['custom'] }
        ],
        ignoredScopes: ['ignored']
      }

      const mockedInput = [
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor(ignored): rewrite legacy code',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 custom: make changelog customizable',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      ]
      const mockedOutput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          custom: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 custom: make changelog customizable'
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
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, config)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should skip changelog scope', async () => {
      const mockedInput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
      ]
      const mockedOutput = [
        {
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should group commits with no unreleased', async () => {
      const mockedInput = [
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
      ]
      const mockedOutput = [
        {
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ],
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })
  })

  describe('generateReleased', () => {
    it("should return null if CHANGELOG doesn't exist", async () => {
      existsSync.mockReturnValueOnce(false)

      const released = await generateReleased()

      expect(existsSync).toBeCalledTimes(1)
      expect(existsSync).toBeCalledWith('CHANGELOG.md')
      expect(released).toBe(null)
    })

    it('should reject if receives an error', async () => {
      const error = 'error'

      existsSync.mockReturnValueOnce(true)
      readFile.mockImplementation((_, __, cb) => cb(error))

      expect(generateReleased(null, defaultConfig)).rejects.toMatch(error)
    })

    it('should reject if there is no released but tag provided', async () => {
      const error = 'Previous release not found in CHANGELOG'
      const mockedInput =
        '# Latest\n- feat: include changelog in the releases 2da21c56\n- test: add utils tests 217b25d0'

      existsSync.mockReturnValueOnce(true)
      readFile.mockImplementation((_, __, cb) => cb(null, mockedInput))

      expect(generateReleased('2.2.2', defaultConfig)).rejects.toThrow(error)
    })

    it('should generate released', async () => {
      const mockedInput =
        '# Latest\n- feat: include changelog in the releases 2da21c56\n- test: add utils tests 217b25d0\n# 2.2.2\n- feat: add feature 2da21c56'
      const mockedOutput = '# 2.2.2\n- feat: add feature 2da21c56'

      existsSync.mockReturnValueOnce(true)
      readFile.mockImplementation((_, __, cb) => cb(null, mockedInput))

      const released = await generateReleased('2.2.2', defaultConfig)

      expect(released).toBe(mockedOutput)
    })

    it('should generate released with custom config', async () => {
      const config = {
        ...defaultConfig,
        unreleasedFormat: '## Unreleased',
        releaseFormat: '## Release v%version%'
      }
      const mockedInput =
        '## Unreleased\n- feat: include changelog in the releases 2da21c56\n- test: add utils tests 217b25d0\n## Release v2.2.2\n- feat: add feature 2da21c56'
      const mockedOutput = '## Release v2.2.2\n- feat: add feature 2da21c56'

      existsSync.mockReturnValueOnce(true)
      readFile.mockImplementation((_, __, cb) => cb(null, mockedInput))

      const released = await generateReleased('2.2.2', config)

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

      expect(generateChangelog(null, mockedInput, defaultConfig)).toBe(
        mockedOutput
      )
    })

    it('should generate changelog with custom config', () => {
      const config = {
        ...defaultConfig,
        unreleasedFormat: '## Unreleased',
        releaseFormat: '# v.%version%',
        breakingFormat: '### BREAKING CHANGE',
        groups: [
          { name: '## Feat', types: ['feat', 'feature'] },
          { name: '## Fix', types: ['fix'] },
          { name: '## Custom', types: ['custom'] }
        ],
        miscFormat: '### Miscellaneous',
        lineFormat: '* %message% %hash%'
      }
      const mockedInput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 feat!: add new api',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 feat!: deprecate function'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          custom: [
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 custom: make changelog customizable'
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
        '## Unreleased\n\n### BREAKING CHANGE\n\n* add new api b2f59019\n* deprecate function 2ea04355\n\n## Custom\n\n* make changelog customizable 2ea04355\n\n## Feat\n\n* add option to write to local CHANGELOG file aa805ce7\n\n### Miscellaneous\n\n* extract line generating logic to function and promisify exec bffc2f9e\n\n# v.0.1.0\n\n## Feat\n\n* add execute release feature 4e02179c\n\n## Fix\n\n* support other conventions b2f59019\n\n### Miscellaneous\n\n* update dependencies 4e02179c\n\n'

      expect(generateChangelog(null, mockedInput, config)).toBe(mockedOutput)
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

      expect(generateChangelog('2.0.0', mockedInput, defaultConfig)).toBe(
        mockedOutput
      )
    })

    it('should generate changelog with version and custom config', () => {
      const config = {
        ...defaultConfig,
        releaseFormat: '## Release v%version%'
      }
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
        '## Release v2.0.0\n\n## BREAKING\n\n- add new api b2f59019\n- deprecate function 2ea04355\n\n## Features\n\n- add option to write to local CHANGELOG file aa805ce7\n\n## Misc\n\n- extract line generating logic to function and promisify exec bffc2f9e\n\n## Release v0.1.0\n\n## Features\n\n- add execute release feature 4e02179c\n\n## Fixes\n\n- support other conventions b2f59019\n\n## Misc\n\n- update dependencies 4e02179c\n\n'

      expect(generateChangelog('2.0.0', mockedInput, config)).toBe(mockedOutput)
    })
  })

  describe('generateLine', () => {
    it('should generate line', () => {
      const mockedInput = {
        message: 'generate changelog',
        hash: 'b2f5901922505efbfb6dd684252e8df0cdffeeb2'
      }
      const mockedOutput = '- generate changelog b2f59019'

      const line = generateLine(mockedInput, defaultConfig)

      expect(line).toEqual(mockedOutput)
    })

    it('should generate line with custom config', () => {
      const config = {
        ...defaultConfig,
        lineFormat: '* %message% %hash% %hash%'
      }
      const mockedInput = {
        message: 'generate changelog',
        hash: 'b2f5901922505efbfb6dd684252e8df0cdffeeb2'
      }
      const mockedOutput = '* generate changelog b2f59019 b2f59019'

      const line = generateLine(mockedInput, config)

      expect(line).toEqual(mockedOutput)
    })
  })
})
