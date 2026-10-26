import { createConfig } from '~testing/fixtures'
import { readFile } from '../misc'
import determineBump from './determine-bump'
import resolveVersion from './resolve-version'

vi.mock('../misc', () => ({
  readFile: vi.fn(),
}))

vi.mock('./determine-bump', () => ({ default: vi.fn() }))

const readFileMock = vi.mocked(readFile)
const determineBumpMock = vi.mocked(determineBump)

describe('resolveVersion', () => {
  const config = createConfig()

  it.each([
    ['major', '2.0.0', 'major'],
    ['v3', '3.0.0', null],
  ])('should resolve %j to %s', async (version, resolvedVersion, bump) => {
    readFileMock.mockResolvedValueOnce('{ "version": "1.2.3" }')

    await expect(resolveVersion(version, config)).resolves.toEqual({
      currentVersion: '1.2.3',
      resolvedVersion,
      resolvedBump: bump,
    })
  })

  it('should resolve the `new` keyword using determineBump', async () => {
    readFileMock.mockResolvedValueOnce('{ "version": "1.2.3" }')
    determineBumpMock.mockResolvedValueOnce('minor')

    await expect(resolveVersion('new', config)).resolves.toEqual({
      currentVersion: '1.2.3',
      resolvedVersion: '1.3.0',
      resolvedBump: 'minor',
    })
  })

  it.each([
    ['{ "version": "x" }', 'patch', "Version `x` couldn't be bumped."],
    [
      '{ "version": "1.2.3" }',
      'version',
      "Version `version` doesn't look right.",
    ],
  ])('should reject %s with %j', async (packageJson, version, message) => {
    readFileMock.mockResolvedValueOnce(packageJson)

    await expect(resolveVersion(version, config)).rejects.toThrow(message)
  })
})
