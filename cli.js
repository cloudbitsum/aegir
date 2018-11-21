#! /usr/bin/env node

'use strict'

const updateNotifier = require('update-notifier')
const chalk = require('chalk')
const pkg = require('./package.json')

updateNotifier({
  pkg: pkg,
  isGlobal: false
}).notify()

require('yargs') // eslint-disable-line
  .env('AEGIR')
  .commandDir('cmds')
  .demandCommand()
  .help()
  .fail((msg, err, yargs) => {
    // errors from execa output the child_process stderr
    if (err && err.stderr) {
      console.error('Error running command: ', err.cmd, '\n') // eslint-disable-line no-console
      console.error(err.stderr) // eslint-disable-line no-console
    } else {
      if (msg) {
        console.error(chalk.red(msg)) // eslint-disable-line no-console
      }
      if (err) {
        console.error(chalk.red(err.message)) // eslint-disable-line no-console
        console.error(chalk.gray(err.stack)) // eslint-disable-line no-console
      }
    }
    process.exit(1)
  })
  .argv
