import exec from './exec'

describe('exec', () => {
  it('should read output larger than the 1 MiB default buffer', () => {
    const size = 2 * 1024 * 1024
    const output = exec(`node -e "process.stdout.write('x'.repeat(${size}))"`)

    expect(output?.length).toBe(size)
  })
})
