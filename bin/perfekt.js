#!/usr/bin/env node

const { program } = require('commander')
const { changelog } = require('../dist').default

program
  .command('changelog')
  .description('generate package changelog')
  .action(() => changelog())

program.parse(process.argv)
