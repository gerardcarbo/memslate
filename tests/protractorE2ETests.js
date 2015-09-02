/**
 * Created by gerard on 29/04/2015.
 */
exports.config = {
    // Do not start a Selenium Standalone sever - only run this using chrome.
    directConnect: true,
    chromeDriver: 'C:/Users/gerard/AppData/Roaming/npm/node_modules/protractor/selenium/chromedriver',
    // Capabilities to be passed to the webdriver instance.
    capabilities: {
        'browserName': 'chrome'
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

    /*,
    onPrepare: function(){
        browser.driver.manage().window().maximize();
        browser.driver.get('http://localhost:4400/?enableripple=cordova-3.0.0-iPhone5');
        // Enable this if you get syntonization errors from protractor,
        // var ptor = protractor.getInstance();
        // ptor.ignoreSynchronization = true;

        // Allow ripple to load
        browser.sleep(2000);
        browser.driver.switchTo().frame(0);
    }*/
};