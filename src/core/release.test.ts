import Git from './git'
import NPM from './npm'
import Release, { createTagMessage } from './release'

jest.mock('~utils/misc/exec', () => ({
  __esModule: true,
  default: jest.fn(),
  execFile: jest.fn()
}))

describe('Release', () => {
  let release: Release

  let updateVersionSpy: jest.SpiedFunction<typeof NPM.prototype.updateVersion>
  let releaseSpy: jest.SpiedFunction<typeof Git.prototype.release>

  beforeEach(() => {
    release = new Release()
    updateVersionSpy = jest.spyOn(NPM.prototype, 'updateVersion')
    releaseSpy = jest.spyOn(Git.prototype, 'release')
  })

  describe('finish', () => {
    it('should finish the release', () => {
      const mockVersion = '1.1.1'
      const mockChangelog = '# 1.1.1\n\n## Misc\n\n- tidy up things'

      release.finish(mockVersion, mockChangelog)

      expect(updateVersionSpy).toHaveBeenCalledTimes(1)
      expect(updateVersionSpy).toHaveBeenCalledWith(mockVersion)
      expect(releaseSpy).toHaveBeenCalledTimes(1)
      expect(releaseSpy).toHaveBeenCalledWith(
        mockVersion,
        '## Misc\n\n- tidy up things'
      )
    })
  })

  describe('createTagMessage', () => {
    it('should remove the release heading and the following blank line', () => {
      expect(createTagMessage('# 2.0.1\n\n## Misc\n\n- docs')).toBe(
        '## Misc\n\n- docs'
      )
    })

    it('should keep the remaining body when there is no blank separator', () => {
      expect(createTagMessage('# 2.0.1\n## Misc\n\n- docs')).toBe(
        '## Misc\n\n- docs'
      )
    })
  })
})
