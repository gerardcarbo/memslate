// Karma configuration
// Generated on Thu Apr 23 2015 11:03:23 GMT+0200 (Romance Daylight Time)
module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../ionic/www/',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            {pattern: 'templates/**/*', watched: false, included: false, served: true},
            'lib/jquery/dist/jquery.min.js',
            'lib/ionic/js/ionic.bundle.min.js',
            'lib/angular-resource/angular-resource.min.js',
            'lib/angular-cookies/angular-cookies.min.js',
            'lib/api-check/dist/api-check.min.js',
            'lib/angular-formly/dist/formly.min.js',
            'lib/angular-formly-templates-ionic/dist/angular-formly-templates-ionic.min.js',
            "lib/oclazyload/dist/ocLazyLoad.js",
            "lib/ui-bootstrap/ui-bootstrap-custom-tpls-0.13.3.js",
            "lib/ngCordova/dist/ng-cordova.js",
            'js/utils.js',
            'js/config.debug.js',
            'js/services/base.js',
            'js/services/translate.js',
            'js/services/memo.js',
            'js/services/play.js',
            'js/services/authenticate.js',
            'js/services/ui.js',
            'js/directives.js',
            'js/controllers.js',
            'js/app.js',
            '../../tests/lib/ngMidwayTester.js',
            '../../tests/lib/testingData.js',
            /*'../../tests/midwayTests/servicesTests.js',*/
            '../../tests/midwayTests/*Tests.js'
        ],

        // list of files to exclude
        exclude: [],

        proxies: {
            '/templates/': '/base/templates/'   //OJO: port can change if another test is running (midway tests changed to port 9877 to avoid collission with unit tests)
            //'/templates/': 'http://localhost:9877/base/templates/'
        },

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // web server port
        port: 9877,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,

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
