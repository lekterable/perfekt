import { createCommit, createConfig } from '~testing/fixtures'
import type { GroupedCommits } from '~types'
import generateChangelog from './generate-changelog'

const unreleased: GroupedCommits[number] = {
  feat: [
    createCommit(
      'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
    ),
  ],
  fix: [createCommit('bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug')],
  misc: [
    createCommit(
      '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies',
    ),
  ],
}

const unreleasedNotes = `## Features

- add option to write to local CHANGELOG file aa805ce7

## Fixes

- a bug bffc2f9e

## Misc

- update dependencies 2ea04355
`

describe('generateChangelog', () => {
  const config = createConfig()

  it('should throw if no commits passed', () => {
    expect(() => generateChangelog([], undefined, config)).toThrow(
      'Cannot generate a changelog, no commits passed.',
    )
  })

  it.each([
    [undefined, '# Latest'],
    ['2.0.0', '# 2.0.0'],
  ])('should title version %j as %j', (version, title) => {
    expect(generateChangelog([unreleased], version, config)).toBe(
      `${title}\n\n${unreleasedNotes}`,
    )
  })

  it('should generate changelog with multiple releases', () => {
    const released = {
      feat: [
        createCommit(
          'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences',
        ),
      ],
      release: createCommit(
        '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0',
      ),
    }

    expect(generateChangelog([unreleased, released], '3.0.0', config)).toBe(
      `# 3.0.0\n\n${unreleasedNotes}\n# 1.2.0\n\n## Features\n\n- replace all placeholder occurrences d0e72481\n`,
    )
  })

  it('should skip empty historical release headers', () => {
    const grouped: GroupedCommits = [
      {
        feat: [
          createCommit(
            '04081447d7f85b91f761bf35d9fabc90790f25a1 feat: show last sync dates in project list',
          ),
        ],
        misc: [
          createCommit(
            '29d6eb7f4f3da2a7f3bf0fa4d3ef8aa1df86b8bf chore: add release script',
          ),
        ],
      },
      {
        release: createCommit(
          '60a2d0a9b503d6c8bd0209ac4971dae463c67b34 chore(release): 1.1.0',
        ),
      },
    ]

    expect(generateChangelog(grouped, '1.2.0', config)).toBe(
      '# 1.2.0\n\n## Features\n\n- show last sync dates in project list 04081447\n\n## Misc\n\n- add release script 29d6eb7f\n',
    )
  })

  it('should put breaking changes first under the breaking header', () => {
    const grouped = [
      {
        ...unreleased,
        breaking: [
          createCommit(
            '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat!: add release `new` keyword',
          ),
        ],
      },
    ]

    expect(generateChangelog(grouped, '2.0.0', config)).toBe(
      `# 2.0.0\n\n## BREAKING\n\n- add release \`new\` keyword 86aa5dc1\n\n${unreleasedNotes}`,
    )
  })
})
