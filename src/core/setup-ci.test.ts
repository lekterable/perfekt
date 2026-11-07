import fs from 'node:fs'
import type { MockInstance } from 'vitest'
import exec from '~utils/misc/exec'
import * as writeFile from '../utils/misc/write-file'
import { CI_WORKFLOW_PATH, getCiWorkflow } from './commits'
import setupCi from './setup-ci'

vi.mock('node:fs')
vi.mock('~utils/misc/exec')

const fsMock = vi.mocked(fs)

describe('setup-ci', () => {
  let writeFileSpy: MockInstance<typeof writeFile.default>

  beforeEach(() => {
    writeFileSpy = vi.spyOn(writeFile, 'default').mockResolvedValue()
    fsMock.existsSync.mockReturnValue(false)
    vi.mocked(exec).mockImplementation((command: string) =>
      command.includes('origin/HEAD') ? 'origin/main' : '',
    )
  })

  it('should write the CI caller for the detected branch', async () => {
    const result = await setupCi()

    expect(writeFileSpy).toHaveBeenCalledWith(
      CI_WORKFLOW_PATH,
      getCiWorkflow('main'),
    )
    expect(result).toEqual({
      files: [{ path: CI_WORKFLOW_PATH, status: 'written' }],
      defaultBranch: 'main',
    })
  })

  it('should skip an existing CI workflow unless force is set', async () => {
    fsMock.existsSync.mockReturnValue(true)

    expect((await setupCi()).files[0]?.status).toBe('skipped')
    expect(writeFileSpy).not.toHaveBeenCalled()
    expect((await setupCi({ force: true })).files[0]?.status).toBe('written')
  })

  it.each([
    ['no ci.yml', false],
    ['a ci.yml of its own', true],
  ])(
    'should keep another workflow that already calls the shared CI next to %s',
    async (_label, ciYmlExists) => {
      fsMock.existsSync.mockReturnValue(ciYmlExists)
      fsMock.readdirSync.mockReturnValue(['ci.yaml'] as unknown as ReturnType<
        typeof fs.readdirSync
      >)
      fsMock.readFileSync.mockReturnValue(
        'uses: lekterable/perfekt/.github/workflows/ci.yml@master',
      )

      expect((await setupCi()).files).toEqual([
        { path: '.github/workflows/ci.yaml', status: 'skipped' },
      ])
      expect(writeFileSpy).not.toHaveBeenCalled()
      expect((await setupCi({ force: true })).files).toEqual([
        { path: CI_WORKFLOW_PATH, status: 'written' },
      ])
    },
  )
})
