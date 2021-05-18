'use strict';

//npm install gulp gulp-minify-css gulp-uglify gulp-clean gulp-cleanhtml gulp-jshint gulp-strip-debug gulp-zip merge-stream --save-dev

var gulp = require('gulp'),
	clean = require('gulp-clean'),
	cleanhtml = require('gulp-cleanhtml'),
	jshint = require('gulp-jshint'),
	zip = require('gulp-zip'),
	merge = require('merge-stream'),
	rename = require('gulp-rename'),
	runSequence = require('run-sequence'),
	debug = require('gulp-debug'),
	process = require('process');

gulp.task('build_debug', function(callback) {
	runSequence('clean', 'copy_all', 'copy_config_debug', 'clean_end', callback);
});

gulp.task('copy_config_debug', function() {
	return merge(
		gulp.src(['ionic/www/js/config.debug.js'])
			.pipe(rename('config.js'))
			.pipe(debug({title: 'copy_config_debug:'}))
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/js/'))
	);
});

gulp.task('copy_config_release', function() {
	return merge(
		gulp.src(['ionic/www/js/config.release.js'])
			.pipe(rename('config.js'))
			.pipe(debug({title: 'copy_config_release:'}))
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/js/'))
	);
});


//build ditributable and sourcemaps after other tasks completed
gulp.task('zip', function() {
	var manifest = require('./ionic/manifest');
	
	process.stdout.write('version: ' +  manifest.version);
	var distFileName = manifest.name + ' v' + manifest.version + '.zip';
	var mapFileName = manifest.name + ' v' + manifest.version + '-maps.zip';
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
	return merge(gulp.src('chrome_ext/build/chrome_ext/www/js/config.*.js', {read: false})
			.pipe(clean()));
});


//copy and compress HTML files
gulp.task('copy_html', function() {
	return merge(
		gulp.src(['ionic/www/*.html','!ionic/www/googleb656a46304b8158f.html'])
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www')),
		gulp.src(['ionic/www/app/components/widgets/ms-select.html'])
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/app/components/widgets')),
		gulp.src(['ionic/www/app/components/app/dialogs/*.html'])
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/app/components/app/dialogs')),
		gulp.src('ionic/chrome_ext/*.html')
			.pipe(cleanhtml())
			.pipe(gulp.dest('chrome_ext/build/chrome_ext'))
	);
});

//copy and compress app files
gulp.task('copy_app', function() {
	return merge(
		gulp.src('ionic/www/app/**/*')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/app/'))
	);
});

//copy static folders to build directory
gulp.task('copy_static', function() {
	return merge(
		gulp.src('ionic/www/img/**')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/img')),
		gulp.src('ionic/www/lib/ionic/fonts/**')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/ionic/fonts')),
		gulp.src('ionic/chrome_ext/fonts/**')
			.pipe(gulp.dest('chrome_ext/build/fonts')),
		gulp.src('ionic/chrome_ext/icons/**')
			.pipe(gulp.dest('chrome_ext/build/icons')),
		gulp.src('ionic/memslate-*.png')
			.pipe(gulp.dest('chrome_ext/build')),
		gulp.src('ionic/manifest.json')
			.pipe(gulp.dest('chrome_ext/build')),
		gulp.src('ionic/www/img/icon_bn.svg')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/img')),
		gulp.src('ionic/www/img/icon_siluete.svg')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/img')),
		gulp.src('ionic/www/img/waves.jpg')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/img'))
	);
});


//copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('copy_scripts', function() {

	return merge([
		//memslate app
		gulp.src('ionic/www/lib/ionic/js/ionic.bundle.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/ionic/js')),
		gulp.src('ionic/www/lib/ionic/js/ionic.bundle.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/ionic/js')),
		gulp.src('ionic/www/lib/ui-bootstrap/ui-bootstrap-custom-tpls-0.13.3.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/ui-bootstrap')),
		gulp.src('ionic/www/lib/api-check/dist/api-check.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/api-check/dist')),
		gulp.src('ionic/www/lib/angular-formly/dist/formly.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/angular-formly/dist')),
		gulp.src('ionic/www/lib/angular-formly-templates-ionic/dist/angular-formly-templates-ionic.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/angular-formly-templates-ionic/dist')),
		gulp.src('ionic/www/lib/oclazyload/dist/ocLazyLoad.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/oclazyload/dist')),
		gulp.src('ionic/www/lib/ngCordova/dist/ng-cordova.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/ngCordova/dist')),
		gulp.src(['ionic/www/js/**/*.js','!ionic/www/js/config.js'])
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/js')),
		//chrome ext
		gulp.src('ionic/www/lib/angular/angular.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/angular/')),
		gulp.src('ionic/www/lib/angular-resource/angular-resource.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/angular-resource/')),
		gulp.src('ionic/www/lib/angular-cookies/angular-cookies.min.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/lib/angular-cookies/')),
		gulp.src('ionic/chrome_ext/lib/**/*.js')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/lib')),
		gulp.src(['ionic/chrome_ext/js/**/*.js'])
			//.pipe(stripdebug())
			//.pipe(uglify({outSourceMap: true}))
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/js'))
	]);
});

//minify styles
gulp.task('copy_styles', function() {
// 	return gulp.src('ionic/chrome_ext/styles/**/*.css')
// 		.pipe(minifycss({root: 'ionic/chrome_ext/styles', keepSpecialComments: 0}))
// 		.pipe(gulp.dest('chrome_ext/build/styles'));
	return merge(
		gulp.src('ionic/www/css/**')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/www/css')),
		gulp.src('ionic/chrome_ext/css/**')
			.pipe(gulp.dest('chrome_ext/build/chrome_ext/css'))
	);
});

gulp.task('copy_all', gulp.series('copy_html', 'copy_app', 'copy_scripts', 'copy_styles', 'copy_static', function(done){done()}));


//run scripts through JSHint
gulp.task('jshint', function() {
	return gulp.src('ionic/chrome_ext/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('build_release', gulp.series('clean', 'copy_all', 'copy_config_release', 'clean_end', 'zip', function(done){done()}));

//run all tasks after build_ext directory has been cleaned
gulp.task('default', gulp.series('build_release', function(done){done()}));