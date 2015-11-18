'use strict';

//npm install gulp gulp-minify-css gulp-uglify gulp-clean gulp-cleanhtml gulp-jshint gulp-strip-debug gulp-zip merge-stream --save-dev

var gulp = require('gulp'),
	clean = require('gulp-clean'),
	cleanhtml = require('gulp-cleanhtml'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	stripdebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	zip = require('gulp-zip'),
	merge = require('merge-stream'),
	rename = require('gulp-rename'),
	runSequence = require('run-sequence'),
	debug = require('gulp-debug');

//run all tasks after build_ext directory has been cleaned
gulp.task('default', ['build_release']);

gulp.task('build_release', function(callback) {
	runSequence('clean', 'copy_all', 'copy_config_release', 'clean_end', 'zip', callback);
});

gulp.task('build_debug', function(callback) {
	runSequence('clean', 'copy_all', 'copy_config_debug', 'clean_end', callback);
});

gulp.task('copy_config_debug', function() {
	return merge(
		gulp.src(['ionic/www/js/config.debug.js'])
			.pipe(rename('config.js'))
			.pipe(debug({title: 'copy_config_debug:'}))
			.pipe(gulp.dest('chrome_ext/build/www/js/'))
	);
});

gulp.task('copy_config_release', function() {
	return merge(
		gulp.src(['ionic/www/js/config.release.js'])
			.pipe(rename('config.js'))
			.pipe(debug({title: 'copy_config_release:'}))
			.pipe(gulp.dest('chrome_ext/build/www/js/'))
	);
});

gulp.task('copy_all', ['html', 'scripts', 'styles', 'copy']);

//build ditributable and sourcemaps after other tasks completed
gulp.task('zip', function() {
	var manifest = require('./ionic/manifest'),
		distFileName = manifest.name + ' v' + manifest.version + '.zip',
		mapFileName = manifest.name + ' v' + manifest.version + '-maps.zip';
	//collect all source maps
	gulp.src('chrome_ext/build/scripts/**/*.map')
		.pipe(zip(mapFileName))
		.pipe(gulp.dest('dist'));
	//build distributable extension
	return gulp.src(['chrome_ext/build/**/*.*','!chrome_ext/build/scripts/**/*.map'])
		.pipe(debug({title: 'zipFiles:'}))
		.pipe(zip(distFileName))
		.pipe(gulp.dest('chrome_ext/dist'));
});


//clean build directory
gulp.task('clean', function() {
	return gulp.src('chrome_ext/build/*', {read: false})
			.pipe(clean());
});

//clean build directory once build done
gulp.task('clean_end', function() {
	return merge(gulp.src('chrome_ext/build/www/js/config.*.js', {read: false})
			.pipe(clean()));
});

//copy static folders to build directory
gulp.task('copy', function() {
	return merge(
		gulp.src('ionic/www/img/**')
			.pipe(gulp.dest('chrome_ext/build/www/img')),
		gulp.src('ionic/www/lib/ionic/fonts/**')
			.pipe(gulp.dest('chrome_ext/build/www/lib/ionic/fonts')),
		gulp.src('ionic/chrome_ext/fonts/**')
			.pipe(gulp.dest('chrome_ext/build/fonts')),
		gulp.src('ionic/chrome_ext/icons/**')
			.pipe(gulp.dest('chrome_ext/build/icons')),
		gulp.src('ionic/memslate-*.png')
			.pipe(gulp.dest('chrome_ext/build')),
		gulp.src('ionic/manifest.json')
			.pipe(gulp.dest('chrome_ext/build')),
		gulp.src('ionic/www/img/icon_bn.svg')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/img'))
	);
});

//copy and compress HTML files
gulp.task('html', function() {
	return merge(
		gulp.src('ionic/options.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build')),
		gulp.src(['ionic/www/*.html','!ionic/www/googleb656a46304b8158f.html'])
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/www')),
		gulp.src('ionic/www/templates/**/*.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/www/templates')),
		gulp.src('ionic/www/templates/register.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/templates')),
		gulp.src('ionic/www/templates/recoverPwd.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/templates')),
		gulp.src('ionic/www/templates/login.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/templates')),
		gulp.src('ionic/www/templates/widgets/ms-select.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/templates/widgets')),
		gulp.src('ionic/chrome_ext/*.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/chrome_ext'))
	);
});

//run scripts through JSHint
gulp.task('jshint', function() {
	return gulp.src('ionic/chrome_ext/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

//copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('scripts', function() {

	return merge([
		//memslate app
		gulp.src('ionic/www/lib/ionic/js/ionic.bundle.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/ionic/js')),
		gulp.src('ionic/www/lib/ui-bootstrap/ui-bootstrap-custom-tpls-0.13.3.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/ui-bootstrap')),
		gulp.src('ionic/www/lib/api-check/dist/api-check.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/api-check/dist')),
		gulp.src('ionic/www/lib/angular-formly/dist/formly.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/angular-formly/dist')),
		gulp.src('ionic/www/lib/angular-formly-templates-ionic/dist/angular-formly-templates-ionic.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/angular-formly-templates-ionic/dist')),
		gulp.src('ionic/www/lib/oclazyload/dist/ocLazyLoad.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/oclazyload/dist')),
		gulp.src('ionic/www/lib/ngCordova/dist/ng-cordova.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/ngCordova/dist')),
		gulp.src(['ionic/www/js/**/*.js','!ionic/www/js/config.js'])
			.pipe(gulp.dest('chrome_ext/build/www/js')),
		//chrome ext
		gulp.src('ionic/www/lib/angular/angular.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/angular/')),
		gulp.src('ionic/www/lib/angular-resource/angular-resource.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/angular-resource/')),
		gulp.src('ionic/www/lib/angular-cookies/angular-cookies.min.js')
			.pipe(gulp.dest('chrome_ext/build/www/lib/angular-cookies/')),
		gulp.src('ionic/chrome_ext/lib/**/*.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/lib')),
		gulp.src(['ionic/chrome_ext/js/**/*.js'])
			//.pipe(stripdebug())
			//.pipe(uglify({outSourceMap: true}))
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/js'))
	]);
});

//minify styles
gulp.task('styles', function() {
// 	return gulp.src('ionic/chrome_ext/styles/**/*.css')
// 		.pipe(minifycss({root: 'ionic/chrome_ext/styles', keepSpecialComments: 0}))
// 		.pipe(gulp.dest('chrome_ext/build/styles'));
	return merge(
		gulp.src('ionic/www/css/**')
			.pipe(gulp.dest('chrome_ext/build/www/css')),
		gulp.src('ionic/chrome_ext/css/**')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/css'))
	);
});


