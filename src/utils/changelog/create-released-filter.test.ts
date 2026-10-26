import { createConfig } from '~testing/fixtures'
import createReleasedFilter from './create-released-filter'

const unreleased = (header: string) =>
  `${header}\n\n## Features\n\n- feat: add feature 2da21c56\n\n## Fixes\n\n- fix: patch a vulnerability ac5c2a84\n`

const released = (header: string) =>
  `${header}\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n`

describe('createReleasedFilter', () => {
  it.each([
    ['the default headers', {}, '2.2.2', '# Latest', '# 2.2.2'],
    [
      'custom headers',
      {
        unreleasedHeader: '## **Unreleased**',
        releaseHeader: '## Release version - @%version%',
      },
      '2.2.2',
      '## **Unreleased**',
      '## Release version - @2.2.2',
    ],
    ['a v-prefixed tag', {}, 'v2.2.2', '# Latest', '# 2.2.2'],
  ])(
    'should drop the unreleased section with %s',
    (_label, overrides, version, unreleasedHeader, releaseHeader) => {
      const changelog = `${unreleased(unreleasedHeader)}\n${released(releaseHeader)}`

      expect(
        changelog
          .split('\n')
          .filter(createReleasedFilter(version, createConfig(overrides)))
          .join('\n'),
      ).toBe(released(releaseHeader))
    },
  )
})
