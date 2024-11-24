import exec from '~utils/misc/exec'
import * as updateVersion from '~utils/npm/update-version'
import NPM from './npm'

jest.mock('~utils/misc/exec')

const execMock = jest.mocked(exec)

describe('NPM', () => {
  const npm = new NPM()

  describe('updateVersion', () => {
    let updateVersionSpy: jest.SpiedFunction<typeof updateVersion.default>

    beforeEach(() => {
      updateVersionSpy = jest.spyOn(updateVersion, 'default')
    })

    it('sould update version', () => {
      const mockVersion = '2.0.0'

      execMock.mockReturnValue('')

      npm.updateVersion(mockVersion)

      expect(updateVersionSpy).toBeCalled()
      expect(updateVersionSpy).toBeCalledWith(mockVersion)
    })
  })
})
