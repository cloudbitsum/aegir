'use strict'

const execa = require('execa')
const path = require('path')
const { fromAegir, hook } = require('../utils')

const DEFAULT_TIMEOUT = global.DEFAULT_TIMEOUT || 5 * 1000

const coverageFiles = [
  'src/**/*.js'
]

const coverageFilesExclude = [
  'node_modules/**',
  'test/**',
  'dist/**',
  'examples/**'
]

function testNode (ctx) {
  let exec = 'mocha'

  const env = {
    NODE_ENV: 'test'
  }

  let args = [
    ctx.progress && '--reporter=progress',
    '--ui', 'bdd'
  ].filter(Boolean)

  let files = [
    'test/node.js',
    'test/**/*.spec.js'
  ]

  if (ctx.colors) {
    args.push('--colors')
  } else {
    args.push('--no-colors')
  }

  if (ctx.grep) {
    args.push(`--grep=${ctx.grep}`)
  }

  if (ctx.files && ctx.files.length > 0) {
    files = ctx.files
  }

  if (ctx.verbose) {
    args.push('--verbose')
  }

  if (process.env.CI) {
    args.push('--reporter=mocha-jenkins-reporter')
    const randomNumber = Math.floor(Math.random() * 10000)
    env.JUNIT_REPORT_PATH = path.join(process.cwd(), `junit-report-node-${randomNumber}.xml`)
  }

  if (ctx.watch) {
    args.push('--watch')
  }

  if (ctx.exit) {
    args.push('--exit')
  }

  if (ctx.bail) {
    args.push('--bail')
  }

  if (ctx.flow) {
    args.push(...['--resolve', fromAegir('src/test/register.js')])
  }

  const timeout = ctx.timeout || DEFAULT_TIMEOUT
  if (ctx.coverage) {
    exec = 'nyc'
    args = [
      '--include',
      coverageFiles,
      '--exclude',
      coverageFilesExclude.join(' '),
      '--reporter=lcov', '--reporter=text',
      'mocha',
      `--timeout=${timeout}`
    ].concat(args)
  }

  if (!ctx.coverage) {
    args = [
      '--timeout',
      timeout
    ].concat(args)
  }

  const postHook = hook('node', 'post')
  const preHook = hook('node', 'pre')

  let err

  return preHook(ctx).then(() => {
    return execa(exec, args.concat(files.map((p) => path.normalize(p))), {
      env: env,
      cwd: process.cwd(),
      preferLocal: true,
      localDir: path.join(__dirname, '../..'),
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr
    }).catch((_err) => {
      err = _err
    })
  }).then(() => postHook(ctx))
    .then(() => {
      if (err) {
        throw err
      }
    })
}

module.exports = testNode
