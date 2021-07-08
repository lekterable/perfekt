import { exec } from 'child_process'
import { readFileSync } from 'fs'
import { defineVersion, isObjectEmpty, updateVersion } from './misc'

jest.mock('fs', () => ({ readFileSync: jest.fn() }))
jest.mock('child_process', () => ({ exec: jest.fn() }))

describe('misc', () => {
  describe('defineVersion', () => {
    it('should throw if incorrect version passed', () => {
      const mockedInput = 'version'

      expect(() => defineVersion(mockedInput)).toThrow(
        "Version 'version' doesn't look right"
      )
    })

    it('should bump the version', () => {
      const mockedInput = 'major'
      const mockedFile = '{ "version": "3.3.3" }'
      const mockedOutput = '4.0.0'

      readFileSync.mockReturnValueOnce(mockedFile)

      const version = defineVersion(mockedInput)

      expect(version).toBe(mockedOutput)
    })

    it('should define the version', () => {
      const mockedInput = '3.3.3'

      const version = defineVersion(mockedInput)

      expect(version).toBe(mockedInput)
    })
  })

  describe('isObjectEmpty', () => {
    it('should return false if object is not empty', () => {
      expect(isObjectEmpty({ key: 'value' })).toBe(false)
    })

    it('should return true if object is empty', () => {
      expect(isObjectEmpty({})).toBe(true)
    })
  })

  describe('updateVersion', () => {
    it('should update version', async () => {
      exec.mockImplementation((_, cb) => cb(null))
      const version = '3.3.3'
      await updateVersion(version)

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith(
        `npm version ${version} --no-git-tag-version`,
        expect.any(Function)
      )
    })
  })
})
