import { createTagMessage } from './release'

describe('createTagMessage', () => {
  it.each([
    ['# 2.0.1\n\n## Misc\n\n- docs', '## Misc\n\n- docs'],
    ['# 2.0.1\n## Misc\n\n- docs', '## Misc\n\n- docs'],
  ])('should drop the release heading from %j', (changelog, message) => {
    expect(createTagMessage(changelog)).toBe(message)
  })
})
