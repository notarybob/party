// replace scss alias for build
let package = require('../package.json')
let vfs = require('vinyl-fs')
let map = require('map-stream')
let dest_docs = './dist/packages'

let correctionImport = function (file, cb) {
  let contents = file.contents
    .toString()
    .replace(/^@\/packages/g, `${package.name}/dist/packages`)
    .replace(/^@\/styles/g, `${package.name}/dist/styles`)
  file.contents = Buffer.from(contents, 'utf8')
  cb(null, file)
}
vfs
  .src(['./src/packages/**/*.scss', '!./src/packages/**/demo.scss'])
  .pipe(map(correctionImport))
  .pipe(vfs.dest(dest_docs))
  .on('end', () => {})
