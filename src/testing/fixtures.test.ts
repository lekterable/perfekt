import { createCommit, summarizeGroupedCommits } from './fixtures'

describe('testing fixtures', () => {
  it('should skip falsy group values when summarizing grouped commits', () => {
    const summary = summarizeGroupedCommits([
      {
        release: undefined,
        misc: [
          createCommit(
            '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 Add a new feature'
          )
        ]
      }
    ])

    expect(summary).toEqual([
      {
        misc: ['Add a new feature']
      }
    ])
  })
})
