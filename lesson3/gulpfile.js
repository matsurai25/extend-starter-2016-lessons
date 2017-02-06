'use strict';
const gulp         = require('gulp');
const browserify   = require('browserify');
const source       = require('vinyl-source-stream');
const rimraf       = require('rimraf');
const sequence     = require('run-sequence');
const header       = require('gulp-header');

const BUNDLENAME = 'colorIntegrator.jsx';
const DIST = './dist/';

gulp.task('default', () => {
  sequence('clean', 'build', 'watch');
});

gulp.task('clean', (cb) => {
  rimraf(DIST, cb);
});

gulp.task('build', () => {
  browserify({
    entries: ['./lib/entry.js']
  })
  .transform("require-globify")
  .transform("babelify", {presets: ["es2015"]})
  .bundle()
  .on('error', function(e){
    console.log(e.message);
    console.log(e.stack);
    this.emit("end");
  })
  .pipe(source(BUNDLENAME))
  .pipe(header("var thisObj = this;\n")) // browserifyする関係で最初のthisが取れなくなるので、ここで代入して使用する。
  .pipe(gulp.dest(DIST));
});

gulp.task('watch', () => {
  gulp.watch(['src/**/*.js','lib/**/*.js'], ['build']);
});

// gulp.task('init', () => {
//   exec(`osascript -e 'tell application "Adobe After Effects CC 2014" to DoScriptFile "${DISTFILE}"'`);
// });
