import fs from 'fs'
import inquirer from 'inquirer'
import Git from './git'
import Config from '~config'
import Perfekt from './perfekt'
import * as groupCommits from '~utils/changelog/group-commits'
import * as determineVersion from '~utils/release/determine-version'
import * as initialize from './initialize'
import * as writeFile from '~utils/misc/write-file'
import Release from './release'
import Changelog from './changelog'
import Options, { defaults } from './options'
import exec from '~utils/misc/exec'
import Commit from './commit'

jest.mock('fs')
jest.mock('inquirer')
jest.mock('~utils/misc/exec')

const fsMock = jest.mocked(fs)
const inquirerMock = jest.mocked(inquirer)
const execMock = jest.mocked(exec)

describe('Perfekt', () => {
  const { config } = new Config()
  const perfekt = new Perfekt(config)

  const mockLog =
    'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec\naa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file\nb2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions\nbffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug\n4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature\nb2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests\n2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'

  const mockGrouped = [
    {
      feat: [
        new Commit(
          'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
        ),
        new Commit(
          '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
        )
      ],
      fix: [
        new Commit(
          'nb2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
        ),
        new Commit('bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug')
      ],
      misc: [
        new Commit(
          'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
        ),
        new Commit(
          'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests'
        ),
        new Commit(
          '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
        )
      ]
    }
  ]

  const mockCommits = mockLog.split('\n').map(commit => new Commit(commit))

  describe('init', () => {
    let writeFileSpy: jest.SpiedFunction<typeof writeFile.default>
    let initializeSpy: jest.SpiedFunction<typeof initialize.default>

    beforeEach(() => {
      writeFileSpy = jest.spyOn(writeFile, 'default')
      initializeSpy = jest.spyOn(initialize, 'default')
    })

    it('should initialize configuration', async () => {
      const mockConfigFormat = '.perfektrc'

      inquirerMock.prompt.mockResolvedValue({ configFormat: mockConfigFormat })

      await perfekt.init()

      expect(initializeSpy).toBeCalledTimes(1)
      expect(writeFileSpy).toBeCalledTimes(1)
      expect(writeFileSpy).toBeCalledWith(mockConfigFormat, '')
    })
  })

  describe('release', () => {
    const releaseOptions = new Options(defaults.releaseOptions)

    let changelogSpy: jest.SpiedFunction<typeof Perfekt.prototype.changelog>
    let finishSpy: jest.SpiedFunction<typeof Release.prototype.finish>
    let determineVersionSpy: jest.SpiedFunction<typeof determineVersion.default>

    beforeEach(() => {})

    beforeEach(() => {
      releaseOptions.restore()

      changelogSpy = jest.spyOn(Perfekt.prototype, 'changelog')
      finishSpy = jest.spyOn(Release.prototype, 'finish')
      determineVersionSpy = jest.spyOn(determineVersion, 'default')
    })

    it('should execute a release', async () => {
      const mockVersion = '2.2.2'
      const options = releaseOptions.options

      execMock.mockReturnValueOnce(mockVersion)
      execMock.mockReturnValueOnce(mockLog)
      // @ts-expect-error -- Make type-safe later
      fsMock.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(undefined))

      await perfekt.release(mockVersion, options)

      expect(determineVersionSpy).toBeCalledTimes(1)
      expect(determineVersionSpy).toBeCalledWith(mockVersion, config)
      expect(changelogSpy).toBeCalledTimes(1)
      expect(changelogSpy).toBeCalledWith(mockVersion, {
        from: undefined,
        root: false,
        write: true
      })
      expect(finishSpy).toBeCalledTimes(1)
      expect(finishSpy).toBeCalledWith(mockVersion)
    })

    it('should execute a release with `--from` option', async () => {
      const mockVersion = '2.2.2'
      const mockSHA = '4e02179c'
      const options = releaseOptions.merge({ from: mockSHA }).options

      execMock.mockReturnValueOnce(mockVersion)
      execMock.mockReturnValueOnce(mockLog)
      // @ts-expect-error -- Make type-safe later
      fsMock.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(undefined))

      await perfekt.release(mockVersion, options)

      expect(determineVersionSpy).toBeCalledTimes(1)
      expect(determineVersionSpy).toBeCalledWith(mockVersion, config)
      expect(changelogSpy).toBeCalledTimes(1)
      expect(changelogSpy).toBeCalledWith(mockVersion, {
        from: mockSHA,
        root: false,
        write: true
      })
      expect(finishSpy).toBeCalledTimes(1)
      expect(finishSpy).toBeCalledWith(mockVersion)
    })
  })

  describe('changelog', () => {
    const changelogOptions = new Options(defaults.changelogOptions)

    let printSpy: jest.SpiedFunction<typeof Changelog.prototype.print>
    // @ts-expect-error -- Make type-safe later
    let latestTagSpy: jest.SpiedFunction<typeof Git.prototype.latestTag>
    let finishSpy: jest.SpiedFunction<typeof Changelog.prototype.finish>
    let getCommitsSpy: jest.SpiedFunction<typeof Git.prototype.getCommits>
    let groupCommitsSpy: jest.SpiedFunction<typeof groupCommits.default>

    beforeEach(() => {
      changelogOptions.restore()

      printSpy = jest.spyOn(Changelog.prototype, 'print')
      // @ts-expect-error -- Make type-safe later
      latestTagSpy = jest.spyOn(Git.prototype, 'latestTag', 'get')
      finishSpy = jest.spyOn(Changelog.prototype, 'finish')
      getCommitsSpy = jest.spyOn(Git.prototype, 'getCommits')
      groupCommitsSpy = jest.spyOn(groupCommits, 'default')
    })

    it('should generate changelog', async () => {
      const mockVersion = '2.2.2'
      const options = changelogOptions.options

      execMock.mockReturnValueOnce(mockVersion)
      execMock.mockReturnValueOnce(mockLog)
      printSpy.mockImplementation()

      await perfekt.changelog(mockVersion, options)

      expect(latestTagSpy).toBeCalledTimes(1)
      expect(getCommitsSpy).toBeCalledTimes(1)
      expect(getCommitsSpy).toBeCalledWith(mockVersion)
      expect(groupCommitsSpy).toBeCalledTimes(1)
      expect(groupCommitsSpy).toBeCalledWith(mockCommits, config)
      expect(finishSpy).toBeCalledTimes(1)
      expect(finishSpy).toBeCalledWith(mockGrouped, mockVersion, mockVersion)
      expect(printSpy.mock.calls[0][0]).toMatchSnapshot()
    })

    it('should generate changelog with `--root` option', async () => {
      const mockVersion = '2.2.2'
      const options = changelogOptions.merge({ root: true }).options

      execMock.mockReturnValueOnce(mockVersion)
      execMock.mockReturnValueOnce(mockLog)
      printSpy.mockImplementation()

      await perfekt.changelog(mockVersion, options)

      expect(latestTagSpy).toBeCalledTimes(1)
      expect(getCommitsSpy).toBeCalledTimes(1)
      expect(getCommitsSpy).toBeCalledWith(undefined)
      expect(groupCommitsSpy).toBeCalledTimes(1)
      expect(groupCommitsSpy).toBeCalledWith(mockCommits, config)
      expect(finishSpy).toBeCalledTimes(1)
      expect(finishSpy).toBeCalledWith(mockGrouped, mockVersion, mockVersion)
      expect(printSpy.mock.calls[0][0]).toMatchSnapshot()
    })

    it('should generate changelog with `--from` option', async () => {
      const mockVersion = '2.2.2'
      const mockSHA = '4e02179c'
      const options = changelogOptions.merge({ from: mockSHA }).options

      execMock.mockReturnValueOnce(mockVersion)
      execMock.mockReturnValueOnce(mockLog)
      printSpy.mockImplementation()

      await perfekt.changelog(mockVersion, options)

      expect(latestTagSpy).toBeCalledTimes(1)
      expect(getCommitsSpy).toBeCalledTimes(1)
      expect(getCommitsSpy).toBeCalledWith(mockSHA)
      expect(groupCommitsSpy).toBeCalledTimes(1)
      expect(groupCommitsSpy).toBeCalledWith(mockCommits, config)
      expect(finishSpy).toBeCalledTimes(1)
      expect(finishSpy).toBeCalledWith(mockGrouped, mockVersion, mockVersion)
      expect(printSpy.mock.calls[0][0]).toMatchSnapshot()
    })
  })
})
