import printOutput from './print-output'

describe('printOutput', () => {
  const input = 'printed'

  let stdoutSpy

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write')
  })

  it('should print to output', () => {
    stdoutSpy.mockImplementation()

    printOutput(input)

    expect(stdoutSpy).toBeCalledTimes(1)
    expect(stdoutSpy).toBeCalledWith(input)
  })
})
