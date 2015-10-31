var gulp = require('gulp'),
    clean = require('gulp-clean'),
    gutil = require('gulp-util'),
    nodemon = require('gulp-nodemon'),
    jshint = require('gulp-jshint'),
    shell = require('gulp-shell'),
    eslint = require('gulp-eslint'),
    runSequence = require('run-sequence'),
    rename = require('gulp-rename');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['serve']);


gulp.task('serve', function () {
    nodemon({ script: 'bin/www.js', ignore: ["tests/**/*","ionic/memslate/ionic/**/*","ionic/memslate/node_modules/**/*"]})
        .on('restart', function () {
            console.log('restarted!')
        })
});

// Watch Files For Changes
gulp.task('watch', function () {
    gulp.watch(['bin/**/*.js','server/**/*.js'], ['lint']);
});

gulp.task('lint', function () {
    gulp.src(['bin/**/*.js','server/**/*.js','ionic/www/js/*.js'])
        .pipe(jshint({
            "node": true,
            "eqeqeq": true,
            "esnext": true,
            "bitwise": false,
            "curly": false,
            "eqeqeq": true,
            "eqnull": true,
            "immed": true,
            "latedef": true,
            "newcap": true,
            "noarg": true,
            "undef": true,
            "strict": false,
            "trailing": true,
            "smarttabs": true,
            globals:{
                "angular":true,
                "window":true,
                "cordova":true,
                "StatusBar":true,
                "$":true,
                "objectFindByKey":true,
                "decoratePromise":true
            }
        }))
        .pipe(jshint.reporter('jshint-path-reporter'))
});

gulp.task('eslint', function () {
    gulp.src(['bin/**/*.js','server/**/*.js'])//,'ionic/www/js/*.js'])
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

gulp.task('clean_config', function() {
    return gulp.src('ionic/www/js/config.js', {read: false})
        .pipe(clean());
});

gulp.task('config_debug', function() {
    return gulp.src('ionic/www/js/config.debug.js', { base: './' })
            .pipe(rename('config.js'))
            .pipe(gulp.dest('ionic/www/js/'));
});

gulp.task('config_release', function() {
    return gulp.src('ionic/www/js/config.release.js', { base: './' })
        .pipe(rename('config.js'))
        .pipe(gulp.dest('ionic/www/js/'));
});

gulp.task('git_amend_config', shell.task('git -c core.quotepath=false commit --amend --only --no-edit -- ionic/www/js/config.js'));
gulp.task('git_dokku_master', shell.task('git push dokku master'));

gulp.task('dokku_install',function(cb){
    runSequence('config_release','git_amend_config','git_dokku_master',cb);
});
