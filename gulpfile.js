var gulp = require('gulp');
var gutil = require('gulp-util');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['serve']);

gulp.task('serve', function () {
    nodemon({ script: 'server.js', ext: 'html js', ignore: ['/ionic'] })
        .on('change', ['lint'])
        .on('restart', function () {
            console.log('restarted!')
        })
});

gulp.task('lint', function () {
    gulp.src('./**/*.js')
        .pipe(jshint())
});

