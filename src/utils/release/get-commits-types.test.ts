import { createCommits } from '~testing/fixtures'
import getCommitsTypes from './get-commits-types'

const log = [
  'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable',
  '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits',
  'abfb3d86c05b3680a6aed505d0f9194f13912878 chore: update README badges',
]

describe('getCommitsTypes', () => {
  it.each([
    ['each type once', [...log, ...log], ['feat', 'fix', 'chore']],
    [
      'breaking in place of the type',
      [
        ...log,
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific',
      ],
      ['feat', 'fix', 'chore', 'breaking'],
    ],
    [
      'nothing for untyped commits',
      [
        ...log,
        '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 Add a new feature without convention',
      ],
      ['feat', 'fix', 'chore'],
    ],
  ])('should return %s', (_label, commits, types) => {
    expect(getCommitsTypes(createCommits(commits))).toEqual(types)
  })
})
