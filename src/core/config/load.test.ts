import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadConfig } from './load'

const dirs: string[] = []

afterAll(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true })
})

const makeDir = (files: Record<string, string>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-config-'))
  dirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), content)
  }
  return dir
}

describe('loadConfig', () => {
  it.each([
    [{ 'perfekt.json': '{"a":1}' }, { a: 1 }],
    [{ '.perfektrc': '{"a":2}' }, { a: 2 }],
    [{ '.config/perfektrc.json': '{"a":3}' }, { a: 3 }],
    [{ 'perfekt.json': '\n' }, undefined],
    [{ 'perfekt.json': 'null' }, undefined],
    [{ 'package.json': '{"name":"x"}' }, undefined],
  ])('should read %j', (files, config) => {
    expect(loadConfig(makeDir(files))).toEqual(config)
  })

  it.each([
    [{ 'perfekt.json': '{ nope' }, 'not valid JSON'],
    [{ '.perfektrc': 'a: 1' }, '.perfektrc is not valid JSON'],
    [{ '.perfektrc.yml': 'a: 1' }, 'move the config from .perfektrc.yml'],
    [{ 'package.json': '{"perfekt":null}' }, '"perfekt" key in package.json'],
    [
      { 'perfekt.json': '{}', '.perfektrc.yml': 'a: 1' },
      'found perfekt.json, .perfektrc.yml',
    ],
    [
      { '.perfektrc': '{}', 'package.json': '{"perfekt":{}}' },
      'found .perfektrc, the "perfekt" key in package.json',
    ],
  ])('should reject %j instead of guessing', (files, message) => {
    expect(() => loadConfig(makeDir(files))).toThrow(message)
  })
})
