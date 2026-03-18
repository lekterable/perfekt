import exec from '../misc/exec'
import updateVersion from './update-version'
import { getVersionCommand } from './get-package-manager'

jest.mock('../misc/exec')
jest.mock('./get-package-manager', () => ({
  getVersionCommand: jest.fn()
}))

const execMock = jest.mocked(exec)
const getVersionCommandMock = jest.mocked(getVersionCommand)

describe('updateVersion', () => {
  it('should update version', () => {
    const version = '3.3.3'
    const command = `pnpm version ${version} --no-git-tag-version`

    getVersionCommandMock.mockReturnValueOnce(command)
    execMock.mockReturnValueOnce('')

    updateVersion(version)

    expect(getVersionCommandMock).toHaveBeenCalledTimes(1)
    expect(getVersionCommandMock).toHaveBeenCalledWith(version)
    expect(exec).toHaveBeenCalledTimes(1)
    expect(exec).toHaveBeenCalledWith(command)
  })
})
