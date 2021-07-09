import exec from './utils/misc/exec'
import * as updateVersion from './utils/npm/update-version'
import NPM from './npm'

jest.mock('./utils/misc/exec')

describe('NPM', () => {
  const npm = new NPM()

  describe('updateVersion', () => {
    let updateVersionSpy

    beforeEach(() => {
      updateVersionSpy = jest.spyOn(updateVersion, 'default')
    })

    it('sould update version', () => {
      const mockVersion = '2.0.0'

      exec.mockReturnValue('')

      npm.updateVersion(mockVersion)

      expect(updateVersionSpy).toBeCalled()
      expect(updateVersionSpy).toBeCalledWith(mockVersion)
    })
  })
})
