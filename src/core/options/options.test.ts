import Options, { defaults } from '.'

describe('Options', () => {
  let options: Options<{ from?: string }>

  beforeEach(() => {
    options = new Options(defaults.releaseOptions)
  })

  it('should return default options', () => {
    expect(options.options).toStrictEqual(defaults.releaseOptions)
  })

  it('should merge overrides into the defaults', () => {
    options.merge({ from: '1.1.1' })

    expect(options.options).toStrictEqual({
      ...defaults.releaseOptions,
      from: '1.1.1'
    })
  })

  it('should replace overrides when restored', () => {
    options.merge({ from: '1.1.1' })

    options.restore()

    expect(options.options).toStrictEqual(defaults.releaseOptions)
  })
})
