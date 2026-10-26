import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadConfig } from './load'

const makeDir = (files: Record<string, string>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-config-'))
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content)
  }
  return dir
}

describe('loadConfig', () => {
  it('should read perfekt.json and return undefined without a config', () => {
    expect(
      loadConfig(makeDir({ 'perfekt.json': '{"miscHeader":"# x"}' })),
    ).toEqual({ miscHeader: '# x' })
    expect(
      loadConfig(
        makeDir({ 'perfekt.json': '{"a":1}', '.perfektrc': '{"a":2}' }),
      ),
    ).toEqual({ a: 1 })
    expect(loadConfig(makeDir({ 'package.json': '{"name":"x"}' }))).toBe(
      undefined,
    )
  })

  it('should read a JSON .perfektrc from perfekt 3', () => {
    expect(loadConfig(makeDir({ '.perfektrc': '{"a":2}' }))).toEqual({ a: 2 })
  })

  it.each([
    [{ 'perfekt.json': '{ nope' }, 'not valid JSON'],
    [{ '.perfektrc': 'a: 1' }, '.perfektrc is not valid JSON'],
    [{ '.perfektrc.yml': 'a: 1' }, 'move the config from .perfektrc.yml'],
    [{ 'package.json': '{"perfekt":{}}' }, '"perfekt" key in package.json'],
  ])('should reject %j instead of ignoring it', (files, message) => {
    expect(() => loadConfig(makeDir(files))).toThrow(message)
  })
})
