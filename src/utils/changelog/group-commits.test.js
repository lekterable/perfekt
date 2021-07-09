import Commit from '../../commit'
import Config from '../../config'
import groupCommits from './group-commits'

const mockLog = [
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
  'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
  '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
  '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
]
const mockCommits = mockLog.map(commit => new Commit(commit))

describe('groupCommits', () => {
  const { config } = new Config()

  it('should group unconventional commits', () => {
    const commits = [
      new Commit('8c56a8d694955eb02d665f9e78a95cd076e8fcf5 Add a new feature'),
      new Commit('acaa27892bc96dd4d4a48f6a732d81a4d9e360fc Fix a bug'),
      new Commit(
        'aea7f150d13aabaac487253bd26c809121333a17 Refactor some legacy code'
      )
    ]

    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should skip `changelog` scope by default', () => {
    const commits = [
      ...mockCommits,
      new Commit(
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
      )
    ]

    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should group commits with no releases', () => {
    const commits = mockCommits
    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should group commits with no unreleased', () => {
    const commits = [
      new Commit(
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
      ),
      ...mockCommits
    ]
    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should group commits with release', () => {
    const commits = [
      new Commit(
        '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat: add release `new` keyword'
      ),
      new Commit(
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
      ),
      ...mockCommits
    ]

    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should group commits with multiple releases', () => {
    const commits = [
      new Commit(
        '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
      ),
      new Commit(
        '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat: add release `new` keyword'
      ),
      new Commit(
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
      ),
      ...mockCommits
    ]

    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should group commits with breaking changes', () => {
    const commits = [
      ...mockCommits,
      new Commit(
        '17feea4af5e339532d680a6ef6e9ec331f8abd2e feat!: add release version bumping'
      ),
      new Commit(
        'aea7f150d13aabaac487253bd26c809121333a17 feat!: change some important api'
      )
    ]

    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should group commits with unknown types', () => {
    const commits = [
      new Commit(
        '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 refactor: rewrite some code'
      ),
      new Commit(
        'acaa27892bc96dd4d4a48f6a732d81a4d9e360fc tests: add new test cases'
      ),
      new Commit(
        'aea7f150d13aabaac487253bd26c809121333a17 ci: setup github actions workflow'
      )
    ]

    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })

  it('should group commits with custom config', () => {
    const { config } = new Config({
      groups: [
        { name: '## Feat', type: 'minor', types: ['feat', 'feature'] },
        { name: '## Fix', type: 'patch', types: ['fix'] },
        { name: '## Custom', type: 'patch', types: ['custom'] }
      ],
      ignoredScopes: ['ignored']
    })
    const commits = [
      new Commit(
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 custom: make changelog customizable'
      ),
      ...mockCommits,
      new Commit(
        'abfb3d86c05b3680a6aed505d0f9194f13912878 chore(ignored): update README badges'
      )
    ]

    const grouped = groupCommits(commits, config)

    expect(grouped).toMatchSnapshot()
  })
})
