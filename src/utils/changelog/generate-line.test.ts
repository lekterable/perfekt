import { Commit } from '~libs'
import generateLine from './generate-line'
import Config from '../../config'

const mockCommit = new Commit(
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 feat: generate changelog'
)

describe('generateLine', () => {
  const { config } = new Config()

  it('should generate line', () => {
    const line = generateLine(mockCommit, config)

    expect(line).toMatchInlineSnapshot(`"- generate changelog b2f59019"`)
  })

  it('should generate line with custom config', () => {
    const { config } = new Config({ lineFormat: '* %message% %hash% %hash%' })

    const line = generateLine(mockCommit, config)

    expect(line).toMatchInlineSnapshot(
      `"* generate changelog b2f59019 b2f59019"`
    )
  })
})
