import exec from '../misc/exec'
import updateVersion from './update-version'

jest.mock('../misc/exec')

describe('updateVersion', () => {
  it('should update version', () => {
    const version = '3.3.3'

    exec.mockReturnValueOnce()

    updateVersion(version)

    expect(exec).toBeCalledTimes(1)
    expect(exec).toBeCalledWith(`npm version ${version} --no-git-tag-version`)
  })
})
