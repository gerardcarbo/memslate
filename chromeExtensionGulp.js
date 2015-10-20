'use strict';

//npm install gulp gulp-minify-css gulp-uglify gulp-clean gulp-cleanhtml gulp-jshint gulp-strip-debug gulp-zip --save-dev

var gulp = require('gulp'),
	clean = require('gulp-clean'),
	cleanhtml = require('gulp-cleanhtml'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	stripdebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	zip = require('gulp-zip');

//clean build directory
gulp.task('clean', function() {
	return gulp.src('build_ext/*', {read: false})
		.pipe(clean());
});

//copy static folders to build directory
gulp.task('copy', function() {
	gulp.src('ionic/www/img/**')
		.pipe(gulp.dest('build_ext/www/img'));
	gulp.src('ionic/www/lib/ionic/fonts/**')
		.pipe(gulp.dest('build_ext/www/lib/ionic/fonts'));
	gulp.src('ionic/chrome_ext/fonts/**')
		.pipe(gulp.dest('build_ext/fonts'));
	gulp.src('ionic/chrome_ext/icons/**')
		.pipe(gulp.dest('build_ext/icons'));
	gulp.src('ionic/memslate-*.png')
		.pipe(gulp.dest('build_ext'));
	return gulp.src('ionic/manifest.json')
		.pipe(gulp.dest('build_ext'));
});

//copy and compress HTML files
gulp.task('html', function() {
	gulp.src('ionic/options.html')
		.pipe(cleanhtml())
		.pipe(gulp.dest('build_ext'));
	gulp.src('ionic/www/*.html')
		.pipe(cleanhtml())
		.pipe(gulp.dest('build_ext/www'));
	gulp.src('ionic/www/templates/**/*.html')
		.pipe(cleanhtml())
		.pipe(gulp.dest('build_ext/www/templates'));
	return gulp.src('ionic/chrome_ext/*.html')
		.pipe(cleanhtml())
		.pipe(gulp.dest('build_ext/chrome_ext'));
});

//run scripts through JSHint
gulp.task('jshint', function() {
	return gulp.src('ionic/chrome_ext/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

//copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('scripts', ['jshint'], function() {
	//memslate app
	gulp.src('ionic/www/lib/ionic/js/ionic.bundle.min.js')
		.pipe(gulp.dest('build_ext/www/lib/ionic/js'));
	gulp.src('ionic/www/lib/ui-bootstrap/ui-bootstrap-custom-tpls-0.13.3.min.js')
		.pipe(gulp.dest('build_ext/www/lib/ui-bootstrap'));
	gulp.src('ionic/www/lib/api-check/dist/api-check.min.js')
		.pipe(gulp.dest('build_ext/www/lib/api-check/dist'));
	gulp.src('ionic/www/lib/angular-formly/dist/formly.min.js')
		.pipe(gulp.dest('build_ext/www/lib/angular-formly/dist'));
	gulp.src('ionic/www/lib/angular-formly-templates-ionic/dist/angular-formly-templates-ionic.min.js')
		.pipe(gulp.dest('build_ext/www/lib/angular-formly-templates-ionic/dist'));
	gulp.src('ionic/www/lib/oclazyload/dist/ocLazyLoad.min.js')
		.pipe(gulp.dest('build_ext/www/lib/oclazyload/dist'));
	gulp.src('ionic/www/lib/ngCordova/dist/ng-cordova.min.js')
		.pipe(gulp.dest('build_ext/www/lib/ngCordova/dist'));
	gulp.src(['ionic/www/js/**/*.js','!ionic/www/js/dist/*.*'])
		.pipe(gulp.dest('build_ext/www/js'));

	//chrome ext
	gulp.src('ionic/www/lib/angular/angular.min.js')
		.pipe(gulp.dest('build_ext/www/lib/angular/'));
	gulp.src('ionic/www/lib/angular-resource/angular-resource.min.js')
		.pipe(gulp.dest('build_ext/www/lib/angular-resource/'));
	gulp.src('ionic/www/lib/angular-cookies/angular-cookies.min.js')
		.pipe(gulp.dest('build_ext/www/lib/angular-cookies/'));
	gulp.src('ionic/chrome_ext/lib/**/*.js')
		.pipe(gulp.dest('build_ext/chrome_ext/lib'));
	return gulp.src(['ionic/chrome_ext/js/**/*.js'])
		//.pipe(stripdebug())
		//.pipe(uglify({outSourceMap: true}))
		.pipe(gulp.dest('build_ext/chrome_ext/js'));
});

//minify styles
gulp.task('styles', function() {
// 	return gulp.src('ionic/chrome_ext/styles/**/*.css')
// 		.pipe(minifycss({root: 'ionic/chrome_ext/styles', keepSpecialComments: 0}))
// 		.pipe(gulp.dest('build_ext/styles'));
	gulp.src('ionic/www/css/**')
		.pipe(gulp.dest('build_ext/www/css'))
	return gulp.src('ionic/chrome_ext/css/**')
		.pipe(gulp.dest('build_ext/chrome_ext/css'));
});

//build ditributable and sourcemaps after other tasks completed
gulp.task('zip', ['html', 'scripts', 'styles', 'copy'], function() {
	var manifest = require('./ionic/manifest'),
		distFileName = manifest.name + ' v' + manifest.version + '.zip',
		mapFileName = manifest.name + ' v' + manifest.version + '-maps.zip';
	//collect all source maps
	gulp.src('build_ext/scripts/**/*.map')
		.pipe(zip(mapFileName))
		.pipe(gulp.dest('dist'));
	//build distributable extension
	return gulp.src(['build_ext/**', '!build_ext/scripts/**/*.map'])
		.pipe(zip(distFileName))
		.pipe(gulp.dest('build_ext/dist'));
});

//run all tasks after build_ext directory has been cleaned
gulp.task('default', ['clean'], function() {
    gulp.start('zip');
});
