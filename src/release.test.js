import Git from './git'
import NPM from './npm'
import Release from './release'

jest.mock('./utils/misc/exec')

describe('Release', () => {
  const release = new Release()

  let updateVersionSpy
  let releaseSpy

  beforeEach(() => {
    updateVersionSpy = jest.spyOn(NPM.prototype, 'updateVersion')
    releaseSpy = jest.spyOn(Git.prototype, 'release')
  })

  describe('finish', () => {
    it('should finish the release', () => {
      const mockVersion = '1.1.1'

      release.finish(mockVersion)

      expect(updateVersionSpy).toBeCalledTimes(1)
      expect(updateVersionSpy).toBeCalledWith(mockVersion)
      expect(releaseSpy).toBeCalledTimes(1)
      expect(releaseSpy).toBeCalledWith(mockVersion)
    })
  })
})
