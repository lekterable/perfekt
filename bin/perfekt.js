#!/usr/bin/env node

const { program } = require('commander')
const { cosmiconfigSync } = require('cosmiconfig')
const { Perfekt, Config } = require('../dist')
const { version } = require('../package.json')

const cosmiConfig = cosmiconfigSync('perfekt').search()

const { config } = new Config(cosmiConfig.config)
const perfekt = new Perfekt(config)

program
  .command('init')
  .description('initialize config')
  .action(perfekt.initialize)

program
  .command('changelog [version]')
  .description('generate package changelog')
  .option('--write', 'write output to the file')
  .option('--root', 'generate changelog for the entire history')
  .option(
    '--from <commit>',
    'SHA of the last commit which will NOT be included in this changelog'
  )
  .action((version, options) => perfekt.changelog(version, options))

program
  .command('release <version>')
  .description('execute a new release')
  .option(
    '--from <commit>',
    'SHA of the last commit which will NOT be included in this release'
  )
  .action((version, options) => perfekt.release(version, options))

program.version(version).parse(process.argv)
