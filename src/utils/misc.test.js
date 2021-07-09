import { exec } from 'child_process'
import { readFileSync } from 'fs'
import { defineVersion, isObjectEmpty, updateVersion } from './misc'
import { defaultConfig } from '../'

jest.mock('fs', () => ({ readFileSync: jest.fn() }))
jest.mock('child_process', () => ({ exec: jest.fn() }))

describe('misc', () => {
  describe('defineVersion', () => {
    it('should throw if incorrect version passed', async () => {
      const mockedInput = 'version'

      await expect(defineVersion(mockedInput, defaultConfig)).rejects.toThrow(
        "Version 'version' doesn't look right"
      )
    })

    it('should bump the version', async () => {
      const mockedInput = 'major'
      const mockedFile = '{ "version": "3.3.3" }'
      const mockedOutput = '4.0.0'

      readFileSync.mockReturnValueOnce(mockedFile)

      const version = await defineVersion(mockedInput, defaultConfig)

      expect(version).toBe(mockedOutput)
    })

    it('should determine the version', async () => {
      const mockedInput = 'new'
      const mockedFile = '{ "version": "1.0.0" }'
      const mockedCommits =
        'c02bbda1489af11372198c01e75110cbac1ebbf3 refactor!: update `groups` configuration option\n25cbe30fa5e641068842b2e9af8888eacf10c238 chore: update dependencies and configurations\n8c3ff1c8776cb3cf739b5c8133fa2883b7909f7a chore: reword question\nd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
      const mockedOutput = '2.0.0'

      readFileSync.mockReturnValueOnce(mockedFile)

      exec.mockImplementationOnce((_, cb) => cb(null, '1.2.0'))
      exec.mockImplementationOnce((_, cb) => cb(null, mockedCommits))

      const version = await defineVersion(mockedInput, defaultConfig)

      expect(version).toBe(mockedOutput)
    })

    it('should define the version', async () => {
      const mockedInput = '3.3.3'

      const version = await defineVersion(mockedInput, defaultConfig)

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
      exec.mockImplementationOnce((_, cb) => cb(null))
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
