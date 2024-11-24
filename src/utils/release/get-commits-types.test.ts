import getCommitsTypes from './get-commits-types'
import Commit from '~libs/commit'

const mockCommits = [
  new Commit(
    'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable'
  ),
  new Commit(
    '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
  ),
  new Commit(
    'abfb3d86c05b3680a6aed505d0f9194f13912878 chore: update README badges'
  )
]

describe('getCommitsTypes', () => {
  it('should return commits types', () => {
    const types = getCommitsTypes(mockCommits)

    expect(types).toMatchSnapshot()
  })

  it('should return unique types', () => {
    const commits = [...mockCommits, ...mockCommits]
    const types = getCommitsTypes(commits)

    expect(types).toMatchSnapshot()
  })

  it('should return `breaking` for breaking changes', () => {
    const commits = [
      ...mockCommits,
      new Commit(
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific'
      ),
      new Commit(
        '8f622021665bc6076d00fde6527800980eba836a chore: include commit links in the changelog'
      )
    ]
    const types = getCommitsTypes(commits)

    expect(types).toMatchSnapshot()
  })
})
