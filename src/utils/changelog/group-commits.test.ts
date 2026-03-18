import groupCommits from './group-commits'
import {
  createCommit,
  createCommits,
  createConfig,
  summarizeGroupedCommits
} from '~testing/fixtures'

const mockLog = [
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
  'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
  '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
  '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
]

const defaultSummary = {
  feat: [
    'add option to write to local CHANGELOG file',
    'add execute release feature'
  ],
  fix: ['support other conventions', 'a bug'],
  misc: [
    'extract line generating logic to function and promisify exec',
    'add core tests',
    'update dependencies'
  ]
}

describe('groupCommits', () => {
  it('should group unconventional commits as misc', () => {
    const grouped = groupCommits(
      createCommits([
        '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 Add a new feature',
        'acaa27892bc96dd4d4a48f6a732d81a4d9e360fc Fix a bug',
        'aea7f150d13aabaac487253bd26c809121333a17 Refactor some legacy code'
      ]),
      createConfig()
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([
      {
        misc: ['Add a new feature', 'Fix a bug', 'Refactor some legacy code']
      }
    ])
  })

  it('should skip changelog-scoped commits by default', () => {
    const grouped = groupCommits(
      [
        ...createCommits(mockLog),
        createCommit(
          '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
        )
      ],
      createConfig()
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([defaultSummary])
  })

  it('should group unreleased commits by their configured type', () => {
    const grouped = groupCommits(createCommits(mockLog), createConfig())

    expect(summarizeGroupedCommits(grouped)).toEqual([defaultSummary])
  })

  it('should attach release commits to the current release group', () => {
    const grouped = groupCommits(
      [
        createCommit(
          'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
        ),
        ...createCommits(mockLog)
      ],
      createConfig()
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([
      {
        ...defaultSummary,
        release: '0.1.0'
      }
    ])
  })

  it('should start a new group when unreleased work appears before a release marker', () => {
    const grouped = groupCommits(
      [
        createCommit(
          '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat: add release `new` keyword'
        ),
        createCommit(
          'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
        ),
        ...createCommits(mockLog)
      ],
      createConfig()
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([
      {
        feat: ['add release `new` keyword']
      },
      {
        ...defaultSummary,
        release: '0.1.0'
      }
    ])
  })

  it('should group multiple releases independently', () => {
    const grouped = groupCommits(
      [
        createCommit(
          '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
        ),
        createCommit(
          '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat: add release `new` keyword'
        ),
        createCommit(
          'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
        ),
        ...createCommits(mockLog)
      ],
      createConfig()
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([
      {
        feat: ['add release `new` keyword'],
        release: '1.2.0'
      },
      {
        ...defaultSummary,
        release: '0.1.0'
      }
    ])
  })

  it('should separate breaking changes from regular groups', () => {
    const grouped = groupCommits(
      [
        ...createCommits(mockLog),
        createCommit(
          '17feea4af5e339532d680a6ef6e9ec331f8abd2e feat!: add release version bumping'
        ),
        createCommit(
          'aea7f150d13aabaac487253bd26c809121333a17 feat!: change some important api'
        )
      ],
      createConfig()
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([
      {
        breaking: ['add release version bumping', 'change some important api'],
        ...defaultSummary
      }
    ])
  })

  it('should fall back to misc for unknown types', () => {
    const grouped = groupCommits(
      createCommits([
        '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 refactor: rewrite some code',
        'acaa27892bc96dd4d4a48f6a732d81a4d9e360fc tests: add new test cases',
        'aea7f150d13aabaac487253bd26c809121333a17 ci: setup github actions workflow'
      ]),
      createConfig()
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([
      {
        misc: [
          'rewrite some code',
          'add new test cases',
          'setup github actions workflow'
        ]
      }
    ])
  })

  it('should support custom release groups and ignored scopes', () => {
    const grouped = groupCommits(
      [
        createCommit(
          'b2f5901922505efbfb6dd684252e8df0cdffeeb2 custom: make changelog customizable'
        ),
        ...createCommits(mockLog),
        createCommit(
          'abfb3d86c05b3680a6aed505d0f9194f13912878 chore(ignored): update README badges'
        )
      ],
      createConfig({
        groups: [
          { name: '## Feat', change: 'minor', types: ['feat', 'feature'] },
          { name: '## Fix', change: 'patch', types: ['fix'] },
          { name: '## Refactor', change: 'patch', types: ['refactor'] },
          { name: '## Custom', change: 'patch', types: ['custom'] }
        ],
        ignoredScopes: ['ignored']
      })
    )

    expect(summarizeGroupedCommits(grouped)).toEqual([
      {
        custom: ['make changelog customizable'],
        feat: defaultSummary.feat,
        fix: defaultSummary.fix,
        refactor: [
          'extract line generating logic to function and promisify exec'
        ],
        misc: ['add core tests', 'update dependencies']
      }
    ])
  })
})
