import Optionable from './optionable'
import { defaults } from '.'

describe('Optionable', () => {
  let optionable: Optionable<{ from?: string; root?: boolean; write?: boolean }>

  beforeEach(() => {
    optionable = new Optionable(defaults.releaseOptions)
  })

  it('should expose the default options', () => {
    expect(optionable.options).toStrictEqual(defaults.releaseOptions)
  })

  it('should merge assigned options into the defaults', () => {
    optionable.options = { from: '1.1.1' }

    expect(optionable.options).toStrictEqual({
      ...defaults.releaseOptions,
      from: '1.1.1'
    })
  })

  it('should replace stale overrides when reassigned', () => {
    optionable.options = { from: '1.1.1' }
    optionable.options = defaults.changelogOptions

    expect(optionable.options).toStrictEqual(defaults.changelogOptions)
  })

  it('should keep only the latest override values', () => {
    optionable.options = { from: '1.1.1' }
    optionable.options = { from: '2.2.2' }

    expect(optionable.options).toStrictEqual({
      ...defaults.releaseOptions,
      from: '2.2.2'
    })
  })
})
