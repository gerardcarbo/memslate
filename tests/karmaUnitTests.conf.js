// Karma configuration
// Generated on Thu Apr 23 2015 11:03:23 GMT+0200 (Romance Daylight Time)
module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            '../ionic/www/js/utils.js',
            '../ionic/www/js/config.debug.js',
            '../ionic/www/lib/ionic/js/ionic.bundle.min.js',
            '../ionic/www/lib/angular-resource/angular-resource.min.js',
            '../ionic/www/lib/angular-cookies/angular-cookies.min.js',
            '../ionic/www/js/controllers.js',
            '../ionic/www/js/directives.js',
            '../ionic/www/js/services/base.js',
            '../ionic/www/js/services/translate.js',
            '../ionic/www/lib/angular-mocks/angular-mocks.js',
            'lib/testingData.js',
            'unitTests/*Tests.js'
        ],

        // list of files to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};
