var os = require('os')
var path = require('path')
var fs = require('fs')
var chalk = require('chalk')
var isGitClean = require('is-git-clean')
var { run: jscodeshift } = require('jscodeshift/src/Runner')
var pkgInfo = require('./config')

var transformers = [
  'component-name-migration',
  'icon-migration',
  'props-changed-migration',
]
var transformersDir = path.join(__dirname, '../transforms')
var ignoreConfig = path.join(__dirname, './codemod.ignore')

function checkGitStatus() {
  let clean = false
  try {
    clean = isGitClean.sync(process.cwd())
  } catch (err) {
    if (
      err &&
      err.stderr &&
      err.stderr.toLowerCase().includes('not a git repository') >= 0
    ) {
      clean = true
    }
  }

  if (!clean) {
    console.log(chalk.yellow('Sorry that there are still some git changes'))
    console.log('\n you must commit or stash them firstly')
    process.exit(1)
  }
}

function getMaxWorkers(options = {}) {
  // limit usage for cpus
  return options.cpus || Math.max(2, Math.ceil(os.cpus().length / 3))
}

function getRunnerArgs(
  transformerPath,
  parser = 'babylon', // use babylon as default parser
  options = {}
) {
  var args = {
    verbose: 2,
    // limit usage for cpus
    cpus: getMaxWorkers(options),
    // https://github.com/facebook/jscodeshift/blob/master/src/Runner.js#L255
    // https://github.com/facebook/jscodeshift/blob/master/src/Worker.js#L50
    babel: false,
    parser,
    // override default babylon parser config to enable `decorator-legacy`
    // https://github.com/facebook/jscodeshift/blob/master/parser/babylon.js
    // eslint-disable-next-line global-require
    parserConfig: require('./babylon.config.json'),
    extensions: ['tsx', 'ts', 'jsx', 'js'].join(','),
    transform: transformerPath,
    ignorePattern: '**/node_modules',
    ignoreConfig,
    pkgInfo,
  }
  return args
}

async function runTransform({ dir }) {
  for (var transformer of transformers) {
    var transformPath = path.join(transformersDir, `${transformer}.js`)
    var options = getRunnerArgs(transformPath)
    var res = await jscodeshift(transformPath, [dir], options)
    console.log(res)
  }
}

function run() {
  var dir = process.argv[2]
  checkGitStatus()

  if (!dir || !fs.existsSync(dir)) {
    console.log(chalk.yellow('Invalid dir:', dir, ', please pass a valid dir'))
    process.exit(1)
  }

  runTransform({ dir })
}

module.exports = {
  run,
}
