import { writeFileSync } from 'fs'
import { mockProcessStdout } from 'jest-mock-process'
import { defaultChangelogOptions as defaultOptions, defaultConfig } from './'
import { changelog } from './changelog'
import {
  generateChangelog,
  generateReleased,
  getCommits,
  getLatestTag,
  groupCommits
} from './utils'

jest.mock('./utils', () => ({
  generateChangelog: jest.fn(),
  generateReleased: jest.fn(),
  getCommits: jest.fn(),
  getLatestTag: jest.fn(),
  groupCommits: jest.fn()
}))
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFile: jest.fn()
}))

describe('changelog', () => {
  it('should throw if no commits found', async () => {
    const mockedCommits = []

    getCommits.mockReturnValueOnce(mockedCommits)

    expect(changelog(null, defaultOptions, defaultConfig)).rejects.toThrow(
      'No commits found'
    )
  })

  it('should throw if no commits found with tag', async () => {
    const mockedTag = '2.2.3'
    const mockedCommits = []

    getLatestTag.mockReturnValueOnce(mockedTag)
    getCommits.mockReturnValueOnce(mockedCommits)

    expect(changelog(null, defaultOptions, defaultConfig)).rejects.toThrow(
      "No commits found since the latest tag '2.2.3'"
    )
  })

  it('should print to output', async () => {
    const stdoutMock = mockProcessStdout()
    const mockedTag = '2.2.3'
    const mockedCommits = [
      'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
      'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
      '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
      'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
      '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
    ]
    const mockedGrouped = [
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
    const mockedChangelog =
      '# Latest\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n\n'
    const mockedReleased = ''

    getLatestTag.mockReturnValueOnce(mockedTag)
    getCommits.mockReturnValueOnce(mockedCommits)
    groupCommits.mockReturnValueOnce(mockedGrouped)
    generateChangelog.mockReturnValueOnce(mockedChangelog)
    generateReleased.mockReturnValueOnce(mockedReleased)

    await changelog(null, defaultOptions, defaultConfig)

    expect(getLatestTag).toBeCalledTimes(1)
    expect(getLatestTag).toBeCalledWith()
    expect(getCommits).toBeCalledTimes(1)
    expect(getCommits).toBeCalledWith(mockedTag)
    expect(groupCommits).toBeCalledTimes(1)
    expect(groupCommits).toBeCalledWith(mockedCommits, defaultConfig)
    expect(generateChangelog).toBeCalledTimes(1)
    expect(generateChangelog).toBeCalledWith(null, mockedGrouped, defaultConfig)
    expect(generateReleased).not.toBeCalled()
    expect(stdoutMock).toBeCalledTimes(1)
    expect(stdoutMock).toBeCalledWith(mockedChangelog)
    expect(writeFileSync).not.toBeCalled()
  })

  it('should generate changelog with version', async () => {
    const stdoutMock = mockProcessStdout()
    const mockedTag = '2.2.3'
    const mockedChangelog =
      '# 2.2.3\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n\n'
    const mockedCommits = [
      'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
      'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
      '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
      'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
      '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
    ]
    const mockedGrouped = [
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
    const mockedReleased = ''

    getLatestTag.mockReturnValueOnce(mockedTag)
    getCommits.mockReturnValueOnce(mockedCommits)
    groupCommits.mockReturnValueOnce(mockedGrouped)
    generateChangelog.mockReturnValueOnce(mockedChangelog)
    generateReleased.mockReturnValueOnce(mockedReleased)

    await changelog('2.2.3', defaultOptions, defaultConfig)

    expect(generateChangelog).toBeCalledTimes(1)
    expect(generateChangelog).toBeCalledWith(
      mockedTag,
      mockedGrouped,
      defaultConfig
    )
    expect(stdoutMock).toBeCalledTimes(1)
    expect(stdoutMock).toBeCalledWith(mockedChangelog)
    expect(writeFileSync).not.toBeCalled()
  })

  it('should write to file with --write option', async () => {
    const options = { ...defaultOptions, write: true }
    const mockedTag = '2.2.3'
    const mockedChangelog =
      '# Latest\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n\n'
    const mockedCommits = [
      'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
      'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
      '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
      'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
      '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
    ]
    const mockedReleased = ''
    const mockedFilename = 'CHANGELOG.md'
    const mockedOutput =
      '# Latest\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n'

    getLatestTag.mockReturnValueOnce(mockedTag)
    getCommits.mockReturnValueOnce(mockedCommits)
    generateChangelog.mockReturnValueOnce(mockedChangelog)
    generateReleased.mockReturnValueOnce(mockedReleased)

    await changelog(null, options, defaultConfig)

    expect(writeFileSync).toBeCalledTimes(1)
    expect(writeFileSync).toBeCalledWith(mockedFilename, mockedOutput)
  })

  it('should write to file with --write option and released', async () => {
    const options = { ...defaultOptions, write: true }
    const stdoutMock = mockProcessStdout()
    const mockedTag = '2.2.3'
    const mockedChangelog =
      '# 2.2.3\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n\n'
    const mockedCommits = [
      'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
      'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
      '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
      'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
      '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
    ]
    const mockedReleased = '# 2.2.2\n- feat: add feature 2da21c56'
    const mockedFilename = 'CHANGELOG.md'

    getLatestTag.mockReturnValueOnce(mockedTag)
    getCommits.mockReturnValueOnce(mockedCommits)
    generateChangelog.mockReturnValueOnce(mockedChangelog)
    generateReleased.mockReturnValueOnce(mockedReleased)

    await changelog('2.2.3', options, defaultConfig)

    expect(generateReleased).toBeCalledTimes(1)
    expect(generateReleased).toBeCalledWith(mockedTag, defaultConfig)
    expect(stdoutMock).not.toBeCalled()
    expect(writeFileSync).toBeCalledTimes(1)
    expect(writeFileSync).toBeCalledWith(
      mockedFilename,
      mockedChangelog + mockedReleased
    )
  })

  it('should generate changelog with --root option', async () => {
    const stdoutMock = mockProcessStdout()
    const options = { ...defaultOptions, root: true }
    const mockedTag = '2.2.3'
    const mockedChangelog =
      '# Latest\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n\n'
    const mockedCommits = [
      'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
      'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
      '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
      'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
      '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
    ]

    getLatestTag.mockReturnValueOnce(mockedTag)
    getCommits.mockReturnValueOnce(mockedCommits)
    generateChangelog.mockReturnValueOnce(mockedChangelog)

    await changelog(null, options, defaultConfig)

    expect(stdoutMock).toBeCalledTimes(1)
    expect(stdoutMock).toBeCalledWith(mockedChangelog)
    expect(writeFileSync).not.toBeCalled()
  })

  it('should generate changelog with --from option', async () => {
    const stdoutMock = mockProcessStdout()
    const options = { ...defaultOptions, from: '4e02179c' }
    const mockedTag = '2.2.3'
    const mockedChangelog =
      '# Latest\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n\n'
    const mockedCommits = [
      'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
      'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
      '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
      'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
      '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
    ]

    getLatestTag.mockReturnValueOnce(mockedTag)
    getCommits.mockReturnValueOnce(mockedCommits)
    generateChangelog.mockReturnValueOnce(mockedChangelog)

    await changelog(null, options, defaultConfig)

    expect(stdoutMock).toBeCalledTimes(1)
    expect(stdoutMock).toBeCalledWith(mockedChangelog)
    expect(writeFileSync).not.toBeCalled()
  })
})
