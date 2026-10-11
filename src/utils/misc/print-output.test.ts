import printOutput from './print-output'

describe('printOutput', () => {
  const input = 'printed'

  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation()
  })

  it('should print to output', () => {
    printOutput(input)

    expect(stdoutSpy).toHaveBeenCalledTimes(1)
    expect(stdoutSpy).toHaveBeenCalledWith(input)
  })
})
