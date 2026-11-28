import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

// The rule bullets of the synced code conventions block, without the leading "- ".
const rules = (agents: string) =>
  (
    agents.match(
      /<!-- synapse:code-conventions -->([\s\S]*?)<!-- \/synapse:code-conventions -->/,
    )?.[1] ?? ''
  )
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2))

// The rows of the "Code conventions and their checks" table: what a rule starts with, and its checks.
const rows = (tooling: string) =>
  (tooling.split('## Code conventions and their checks')[1] ?? '')
    .split('\n## ')[0]
    ?.split('\n')
    .filter(
      (line) => line.startsWith('| ') && !/^\| (Rule starts|---)/.test(line),
    )
    .map((line) => {
      const [start = '', checks = ''] = line
        .split('|')
        .slice(1, 3)
        .map((cell) => cell.trim())
      return {
        start,
        checks: [...checks.matchAll(/`([^`]+)`/g)].map(
          (match) => match[1] ?? '',
        ),
      }
    }) ?? []

const table = rows(read('docs/tooling.md'))
const block = rules(read('AGENTS.md'))
const biome = read('biome.json')

describe('code conventions table', () => {
  it('should find the rules and the table', () => {
    expect(block.length).toBeGreaterThan(10)
    expect(table.length).toBeGreaterThan(10)
  })

  it.each(block)('should give a row to the rule "%s"', (rule) => {
    expect(table.filter((row) => rule.startsWith(row.start))).toHaveLength(1)
  })

  it.each(table)('should match a rule with the row "$start"', ({ start }) => {
    expect(block.some((rule) => rule.startsWith(start))).toBe(true)
  })

  it.each(table.flatMap((row) => row.checks))(
    'should ship the check %s',
    (check) => {
      if (check.endsWith('.grit')) {
        expect(fs.existsSync(path.join(root, check))).toBe(true)
        expect(biome).toContain(`./node_modules/perfekt/${check}`)
      } else expect(biome).toContain(`"${check.split('/')[1]}"`)
    },
  )
})
