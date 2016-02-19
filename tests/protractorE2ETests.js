/**
 * Created by gerard on 29/04/2015.
 */
exports.config = {
    // Do not start a Selenium Standalone sever - only run this using chrome.
    directConnect: true,
    chromeDriver: 'E:/Art/code/Memslate/ionic/memslate/node_modules/protractor/selenium/chromedriver', //'C:/Users/gerard/AppData/Roaming/npm/node_modules/protractor/selenium/chromedriver',
    // Capabilities to be passed to the webdriver instance.
    capabilities: {
        'browserName': 'chrome',
        'chromeOptions': {
            'args': ['incognito', 'disable-extensions', 'start-maximized', 'enable-crash-reporter-for-testing']
        },
        'loggingPrefs': {
            'browser': 'ALL'
        }
    },
    // Spec patterns are relative to the current working directly when
    // protractor is called.
    specs: ['e2eTests/**/*Tests.js'],
    // Options to be passed to Jasmine-node.
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 50000
    },
    suites: {
        all: 'e2eTests/**/*Tests.js',
        home: 'e2eTests/**/homeTests.js',
        user: 'e2eTests/**/userTests.js',
        translate: 'e2eTests/**/translateTests.js',
        memo: 'e2eTests/**/memoTests.js',
        play: 'e2eTests/**/playTests.js'
    }
};