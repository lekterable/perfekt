import Optionable from './optionable'

describe('Optionable', () => {
  const defaults = { from: undefined, root: false }
  let optionable: Optionable<{ from?: string; root: boolean }>

  beforeEach(() => {
    optionable = new Optionable(defaults)
  })

  it('should merge assigned options into the defaults', () => {
    optionable.options = { from: '1.1.1' }

    expect(optionable.options).toStrictEqual({ ...defaults, from: '1.1.1' })
  })

  it('should drop earlier overrides when options are reassigned', () => {
    optionable.options = { from: '1.1.1' }
    optionable.options = { root: true }

    expect(optionable.options).toStrictEqual({ ...defaults, root: true })
  })
})
