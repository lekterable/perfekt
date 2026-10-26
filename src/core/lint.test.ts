import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { cleanMessage, formatLint, lintMessage } from './lint'

const [major, minor] = process.versions.node.split('.').map(Number)
const canStripTypes =
  'typescript' in process.features || major > 22 || (major === 22 && minor >= 6)
const itWhenStrippable = canStripTypes ? it : it.skip

describe('lint', () => {
  it.each([
    ['feat: init :seedling:', true],
    ['feat(web): add x', true],
    ['feat!: drop node 18', true],
    ['feat: add x (#12)', true],
    ['feat: add `X` support', true],
    ['feat: add x.', false],
    ['feat: add x...', true],
    ['wip: try this', false],
    ['content: add page', false],
    ['Feat: add x', false],
    ['feat: Add x', false],
    ['feat:add x', false],
    ['Added stuff.', false],
    [' feat: add x', false],
    [`feat: ${'add '.repeat(17)}x`, false],
    [`feat: add x\n\n${'y'.repeat(101)}`, false],
    [`feat: add x\n\nsee https://example.com/${'y'.repeat(100)}`, true],
    ['Added stuff\n\n1.2.3', false],
    ['feat: add x\r\n\r\nbody from windows\r\n', true],
    ['feat: add x ', false],
    ['01.2.3', false],
    ['feat: ǅungla titlecase', true],
  ])('should lint %j as valid: %s', (message, valid) => {
    expect(lintMessage(message).valid).toBe(valid)
  })

  it.each([
    'chore(release): 3.1.0',
    'v2.0.0\n\nbody',
    '1.2.3 [skip ci]',
    'Merge branch master into topic',
    'Merge pull request #3 from lekterable/topic',
    'Revert "feat: add x"',
    'fixup! feat: add x',
  ])('should ignore %j like commitlint does', (message) => {
    expect(lintMessage(message)).toMatchObject({ valid: true, ignored: true })
  })

  it.each([
    ['feat: added x', 'imperative'],
    ['feat: adding x', 'imperative'],
    ['fix: fixes x', 'imperative'],
    [
      'feat: add a subject that runs well past the fifty character mark',
      'longer than 50',
    ],
    ['feat: add x\nbody right away', 'body must have leading blank line'],
    [
      'feat: add x\n\nbody\nBREAKING CHANGE: y',
      'footer must have leading blank line',
    ],
  ])('should warn on %j without failing', (message, warning) => {
    const result = lintMessage(message)

    expect(result.valid).toBe(true)
    expect(result.warnings.join('\n')).toContain(warning)
  })

  it.each([
    'feat: add x',
    'fix: address x',
    'refactor: focus x',
    'chore: bump x',
    'feat: embed x',
  ])('should not warn on %j', (message) => {
    expect(lintMessage(message).warnings).toEqual([])
  })

  it('should drop the comments and diff git leaves in the message file', () => {
    const file = [
      'feat: add x',
      '',
      '# Please enter the commit message',
      '# ------------------------ >8 ------------------------',
      'diff --git a/x b/x',
    ].join('\n')

    expect(cleanMessage(file)).toBe('feat: add x')
  })

  it('should report errors, warnings and counts like commitlint', () => {
    const message = 'feat: Added x.\nbody'

    expect(formatLint(message, lintMessage(message))).toBe(
      [
        '⧗ input: feat: Added x.',
        '✖ subject must not be sentence-case, start-case, pascal-case, upper-case',
        '✖ subject may not end with full stop',
        '⚠ body must have leading blank line',
        '⚠ subject should start with an imperative verb ("add", not "added")',
        '✖ found 2 problems, 2 warnings',
      ].join('\n'),
    )
  })

  // The shared PR title workflow imports this file with plain node from a sparse checkout.
  itWhenStrippable('should run under plain node without other files', () => {
    const script =
      'const { lintMessage } = await import(process.argv[1]); process.stdout.write(String(lintMessage("feat: add x").valid))'
    const output = execFileSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--no-warnings',
        '--input-type=module',
        '-e',
        script,
        path.join(__dirname, 'lint.ts'),
      ],
      { encoding: 'utf8' },
    )

    expect(output).toBe('true')
  })
})
