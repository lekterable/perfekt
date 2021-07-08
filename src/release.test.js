import { defaultConfig } from './'
import { changelog } from './changelog'
import { release } from './release'
import { commitRelease, defineVersion, updateVersion } from './utils'

jest.mock('./changelog', () => ({ changelog: jest.fn() }))
jest.mock('./utils', () => ({
  commitRelease: jest.fn(),
  updateVersion: jest.fn(),
  defineVersion: jest.fn()
}))
jest.mock('console', () => ({ error: jest.fn() }))

describe('release', () => {
  it('should throw if no version passed', () => {
    expect(release()).rejects.toThrow('Relese requires a version')
  })

  it('should execute release', async () => {
    const mockedVersion = '2.2.2'

    defineVersion.mockReturnValueOnce(mockedVersion)

    await release(mockedVersion, {}, defaultConfig)

    expect(defineVersion).toBeCalledTimes(1)
    expect(defineVersion).toBeCalledWith(mockedVersion)
    expect(updateVersion).toBeCalledTimes(1)
    expect(updateVersion).toBeCalledWith(mockedVersion)
    expect(changelog).toBeCalledTimes(1)
    expect(changelog).toBeCalledWith(
      mockedVersion,
      { write: true },
      defaultConfig
    )
    expect(commitRelease).toBeCalledTimes(1)
    expect(commitRelease).toBeCalledWith(mockedVersion)
  })
})
