import Config from '../../config'
import createReleasedFilter from './create-released-filter'

describe('createReleasedFilter', () => {
  const mockVersion = '2.2.2'
  const { config } = new Config()

  it('should return released filter function', () => {
    const filterReleased = createReleasedFilter(mockVersion, config)

    expect(filterReleased).toEqual(expect.any(Function))
  })
})

describe('filterReleased', () => {
  const mockVersion = '2.2.2'
  const { config } = new Config()
  const filterReleased = createReleasedFilter(mockVersion, config)

  const mockUnreleased =
    '# Latest\n\n## Features\n\n- feat: add feature 2da21c56\n\n## Fixes\n\n- fix: patch a vulnerability ac5c2a84\n\n## Misc\n\n- refactor: change some code a2ec46eb\n'
  const mockReleased =
    '# 2.2.2\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n'
  const mockChangelog = mockUnreleased + '\n' + mockReleased
  const mockLines = mockChangelog.split('\n')

  it('should filter released', () => {
    const released = mockLines.filter(filterReleased)

    expect(released).toEqual(mockReleased.split('\n'))
    expect(released).toMatchSnapshot()
  })

  it('should filter released with custom config', async () => {
    const { config } = new Config({
      unreleasedHeader: '## **Unreleased**',
      releaseHeader: '## Release version - @%version%'
    })
    const filterReleased = createReleasedFilter(mockVersion, config)

    const mockChangelog =
      '## **Unreleased**\n\n## Features\n\n- feat: add feature 2da21c56\n\n## Fixes\n\n- fix: patch a vulnerability ac5c2a84\n\n## Misc\n\n- refactor: change some code a2ec46eb\n\n## Release version - @2.2.2\n\n## Features\n\n- add %HASH% placeholder to line format a3c93b2f\n- introduce changelog customization using config file e66d6176\n- use higher level of headers for changelog eea23d95\n\n## Fixes\n\n- replace %message% as last to avoid bugs ec507396\n- stop adding empty line at the end of the file on --root faee4801\n- stop adding Latest when not applicable c64fa467\n\n## Misc\n\n- include commit links in the changelog 8f622021\n'
    const mockLines = mockChangelog.split('\n')

    const released = mockLines.filter(filterReleased)

    expect(released).toMatchSnapshot()
  })
})
