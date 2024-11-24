import Commit from '~libs/commit'
import { GroupedCommits } from '~types'
import Config from '../../config'
import generateChangelog from './generate-changelog'

const mockGrouped: GroupedCommits = [
  {
    feat: [
      new Commit(
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
      ),
      new Commit(
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      )
    ],
    fix: [
      new Commit(
        'nb2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
      ),
      new Commit('bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug')
    ],
    misc: [
      new Commit(
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
      ),
      new Commit(
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests'
      ),
      new Commit(
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
      )
    ]
  }
]

const mockGroupedRelease = [
  {
    feat: [
      new Commit(
        'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
      )
    ],
    fix: [
      new Commit(
        '4d95659f302e0fe968154e17214876849172509f fix: check if changelog exists before accessing'
      )
    ],
    misc: [
      new Commit(
        'abfb3d86c05b3680a6aed505d0f9194f13912878 chore: update README badges'
      )
    ],
    release: new Commit(
      '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
    )
  }
]

const mockGroupedBreaking = [
  {
    breaking: [
      new Commit(
        '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat!: add release `new` keyword'
      )
    ],
    feat: [
      new Commit(
        '6b05a3b8430eb18af4c2d9fa67addc78c7357cfb feat: make breaking and misc headers configurable'
      ),
      new Commit(
        'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable'
      )
    ],
    fix: [
      new Commit(
        '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
      )
    ],
    misc: [
      new Commit(
        '8f622021665bc6076d00fde6527800980eba836a chore: include commit links in the changelog'
      )
    ]
  }
]

describe('generateChangelog', () => {
  const { config } = new Config()

  it('should throw if no commits passed', () => {
    const mockGrouped: GroupedCommits = []
    const mockVersion = undefined

    expect(() =>
      generateChangelog(mockGrouped, mockVersion, config)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot generate a changelog, no commits passed."`
    )
  })

  it('should generate changelog with no version', () => {
    const mockVersion = undefined

    const changelog = generateChangelog(mockGrouped, mockVersion, config)

    expect(changelog).toMatchSnapshot()
  })

  it('should generate changelog', () => {
    const mockVersion = '2.0.0'

    const changelog = generateChangelog(mockGrouped, mockVersion, config)

    expect(changelog).toMatchSnapshot()
  })

  it('should generate changelog with multiple releases', () => {
    const grouped = [...mockGrouped, ...mockGroupedRelease]
    const mockVersion = '3.0.0'

    const changelog = generateChangelog(grouped, mockVersion, config)

    expect(changelog).toMatchSnapshot()
  })

  it('should generate changelog with breaking changes', () => {
    const mockVersion = '2.0.0'

    const changelog = generateChangelog(
      mockGroupedBreaking,
      mockVersion,
      config
    )

    expect(changelog).toMatchSnapshot()
  })

  it('should generate changelog with unconvetional commits', () => {
    const mockGrouped = [
      {
        misc: [
          new Commit(
            '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 Add a new feature'
          ),
          new Commit('acaa27892bc96dd4d4a48f6a732d81a4d9e360fc Fix a bug'),
          new Commit(
            'aea7f150d13aabaac487253bd26c809121333a17 Refactor some legacy code'
          ),
          new Commit(
            '7a50d00cd7ad6f82d86cdb9857ed7d1fa74144b6 Update CHANGELOG.md'
          )
        ]
      }
    ]
    const mockVersion = '2.0.0'

    const changelog = generateChangelog(mockGrouped, mockVersion, config)

    expect(changelog).toMatchSnapshot()
  })
})
