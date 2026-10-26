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
    expect(loadConfig(makeDir({ 'package.json': '{"name":"x"}' }))).toBe(
      undefined,
    )
  })

  it.each([
    [{ 'perfekt.json': '{ nope' }, 'not valid JSON'],
    [{ '.perfektrc': '{}' }, 'move the config from .perfektrc'],
    [{ 'package.json': '{"perfekt":{}}' }, '"perfekt" key in package.json'],
  ])('should reject %j instead of ignoring it', (files, message) => {
    expect(() => loadConfig(makeDir(files))).toThrow(message)
  })
})
