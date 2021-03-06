#!/usr/bin/env node

const { program } = require('commander')
const { changelog, release, initialize, defaultConfig } = require('../dist')
const { version } = require('../package.json')
const { cosmiconfig } = require('cosmiconfig')

program
  .command('changelog [version]')
  .description('generate package changelog')
  .option('--write', 'write the output to file')
  .option('--root', 'generate changelog for the entire history')
  .option(
    '--from <commit>',
    "SHA of the last commit that won't be a included in this changelog"
  )
  .action(async (version, options) => {
    const cosmiConfig = (await cosmiconfig('perfekt').search()) || {}
    const config = {
      ...defaultConfig,
      ...cosmiConfig.config
    }

    changelog(version, options, config).catch(error =>
      console.error(error.message)
    )
  })

program
  .command('init')
  .description('initialize config')
  .action(() => initialize())

program
  .command('release <version>')
  .description('execute a new release')
  .option(
    '--from <commit>',
    "SHA of the last commit that won't be a included in this release"
  )
  .action(async (version, options) => {
    const cosmiConfig = (await cosmiconfig('perfekt').search()) || {}
    const config = {
      ...defaultConfig,
      ...cosmiConfig.config
    }

    release(version, options, config).catch(error =>
      console.error(error.message)
    )
  })

program.version(version).parse(process.argv)
