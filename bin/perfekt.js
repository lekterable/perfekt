#!/usr/bin/env node

const { program } = require('commander')
const { changelog, release } = require('../dist')

program
  .command('changelog [version]')
  .description('generate package changelog')
  .option('--write', 'write the output to file')
  .action((version, options) => changelog(version, options))

program
  .command('release <version>')
  .description('execute a new release')
  .action(version => release(version))

program.parse(process.argv)
