#!/usr/bin/env node

const { program } = require('commander')
const { changelog, release } = require('../dist')

program
  .command('changelog')
  .description('generate package changelog')
  .action(() => changelog())

program
  .command('release <version>')
  .description('execute a new release')
  .action(version => release(version))

program.parse(process.argv)
