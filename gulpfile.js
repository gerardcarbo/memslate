var gulp = require('gulp');
var gutil = require('gulp-util');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');
var shell = require('gulp-shell');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['serve']);

// Watch Files For Changes
gulp.task('watch', function () {
    gulp.watch('bin/**/*.js', ['lint']);
});

gulp.task('serve', function () {
    nodemon({ script: 'bin/www.js', ignore: ["ionic/memslate/ionic/**/*","ionic/memslate/node_modules/**/*"]})
        .on('restart', function () {
            console.log('restarted!')
        })
});


/*gulp.task('serve',shell.task([
    'nodemon bin/www.js --ignore ionic/'
]));*/

gulp.task('lint', function () {
    gulp.src('./**/*.js')
        .pipe(jshint())
});

