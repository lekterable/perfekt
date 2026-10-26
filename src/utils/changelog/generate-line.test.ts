import { createCommit, createConfig } from '~testing/fixtures'
import generateLine from './generate-line'

describe('generateLine', () => {
  it.each([
    [
      '- %message% %hash%',
      'feat: generate changelog',
      '- generate changelog b2f59019',
    ],
    [
      '* %message% %hash% %hash%',
      'feat: generate changelog',
      '* generate changelog b2f59019 b2f59019',
    ],
    [
      '- %message% [%hash%](https://x/commit/%HASH%)',
      'feat: generate changelog',
      '- generate changelog [b2f59019](https://x/commit/b2f5901922505efbfb6dd684252e8df0cdffeeb2)',
    ],
    [
      '- %message% %hash%',
      'fix: replace %hash% and %HASH% placeholders',
      '- replace %hash% and %HASH% placeholders b2f59019',
    ],
  ])('should format %j for %j', (lineFormat, title, line) => {
    const commit = createCommit(
      `b2f5901922505efbfb6dd684252e8df0cdffeeb2 ${title}`,
    )

    expect(generateLine(commit, createConfig({ lineFormat }))).toBe(line)
  })
})
