var gulp = require('gulp');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var jshint = require('gulp-jshint');
var shell = require('gulp-shell');
var ngmin = require("gulp-ngmin"); // NEW
var uglify = require("gulp-uglify");
var eslint = require('gulp-eslint');

var paths = {
  sass: ['./scss/scss/**/*.scss']
};

//Ionic Serve Task
gulp.task('serve-ionic',shell.task([
    'ionic serve'
]));

gulp.task('default', gulp.series('serve-ionic', function(done){done()}));


gulp.task('serve-ionic lab',shell.task([
    'ionic serve --lab'
]));

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('lint_client', function () {
    gulp.src('./www/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-path-reporter'));
});

gulp.task('eslint_client', function () {
    gulp.src(['www/js/*.js'])
        // eslint() attaches the lint output to the eslint property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format('node_modules\\eslint-path-formatter'));
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failOnError last.
    //.pipe(eslint.failOnError());
});

gulp.task('watch sass', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  Git is not installed.',
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('install', gulp.series('git-check', function(done) {
  return bower.commands.install()
    .on('log', function(data) {
      console.log('bower', data.message);
      done();
    });
}));

gulp.task("dist", function() {
  gulp.src(["www/js/*.js"])            // Read the files
      .pipe(concat("ng-memslate.js"))   // Combine into 1 file
      .pipe(gulp.dest("www/js/dist"))            // Write non-minified to disk
      .pipe(ngmin())                     // Minify
      .pipe(uglify())                     // Minify
      .pipe(rename({extname: ".min.js"})) // Rename to ng-quick-date.min.js
      .pipe(gulp.dest("www/js/dist"))            // Write minified to disk
});

