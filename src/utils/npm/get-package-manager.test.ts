import fs from 'node:fs'
import { getPackageManager } from './get-package-manager'

vi.mock('node:fs')

const fsMock = vi.mocked(fs)

describe('getPackageManager', () => {
  it.each([
    ['the packageManager field', ['package.json'], 'pnpm@9.0.0', 'pnpm'],
    ['a lockfile', ['package.json', 'yarn.lock'], undefined, 'yarn'],
    [
      'a lockfile over an unsupported packageManager',
      ['package.json', 'pnpm-lock.yaml'],
      'bun@1.0.0',
      'pnpm',
    ],
    ['nothing', [], undefined, 'npm'],
  ])('should pick a manager from %s', (_label, files, field, expected) => {
    fsMock.existsSync.mockImplementation((file) => files.includes(String(file)))
    fsMock.readFileSync.mockReturnValue(
      JSON.stringify({ packageManager: field }) as never,
    )

    expect(getPackageManager()).toBe(expected)
  })
})
