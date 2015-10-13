'use strict';

require('../lib/testUtils.js');
var MemslateMemoPage = require('./pages/memoPage.js');
var MemslateMemoFilterPage = require('./pages/memoFilterPage.js');
var MemslateLoginPage = require('./pages/loginPage.js');
var MainPage = require('./pages/mainPage.js');

describe("Memslate Memo Page", function () {
    var mainPage = new MainPage();
    var memoPage = new MemslateMemoPage();
    var memoFilterPage = new MemslateMemoFilterPage();
    var loginPage = new MemslateLoginPage();

    beforeEach(function () {
        memoPage.get();
        browser.waitForAngular();
    });

    var fs = require('fs'),
        path = require('path');

// Add global spec helpers in this file
    var getDateStr = function () {
        var d = (new Date() + '').replace(new RegExp(':', 'g'), '-').split(' ');
        // "2013-Sep-03-21:58:03"
        return [d[3], d[1], d[2], d[4]].join('-');
    };

    var errorCallback = function (err) {
        console.log(err);
    };

// create a new javascript Date object based on the timestamp
    var timestampToDate = function (unix_timestamp) {
        var date = new Date(unix_timestamp);
        // hours part from the timestamp
        var hours = date.getHours();
        // minutes part from the timestamp
        var minutes = date.getMinutes();
        // seconds part from the timestamp
        var seconds = date.getSeconds();

        var timeValues = [hours, minutes, seconds];
        timeValues.forEach(function (val) {
            if (val.length < 2) {
                // padding
                val = '0' + val;
            }
        });
        // will display time in 10:30:23 format
        return hours + ':' + minutes + ':' + seconds;
    };

// Take a screenshot automatically after each failing test.
    afterEach(function () {
        var passed = jasmine.getEnv().currentSpec.results().passed();
        // Replace all space characters in spec name with dashes
        var specName = jasmine.getEnv().currentSpec.description.replace(new RegExp(' ', 'g'), '-'),
            baseFileName = specName + '-' + getDateStr(),
            reportDir = path.resolve(__dirname + '/../report/'),
            consoleLogsDir = path.resolve(reportDir + '/logs/'),
            screenshotsDir = path.resolve(reportDir + '/screenshots/');

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir);
        }

        if (!passed) {
            // Create screenshots dir if doesn't exist
            console.log('screenshotsDir = [' + screenshotsDir + ']');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir);
            }

            var pngFileName = path.resolve(screenshotsDir + '/' + baseFileName + '.png');
            browser.takeScreenshot().then(function (png) {
                // Do something with the png...
                console.log('Writing file ' + pngFileName);
                fs.writeFileSync(pngFileName, png, {encoding: 'base64'}, function (err) {
                    console.log(err);
                });
            }, errorCallback);
        }

        // Flush browser console to file
        var logs = browser.driver.manage().logs(),
            logType = 'browser'; // browser
        logs.getAvailableLogTypes().then(function (logTypes) {
            if (logTypes.indexOf(logType) > -1) {
                var logFileName = path.resolve(consoleLogsDir + '/' + baseFileName + '.txt');
                browser.driver.manage().logs().get(logType).then(function (logsEntries) {
                    if (!fs.existsSync(consoleLogsDir)) {
                        fs.mkdirSync(consoleLogsDir);
                    }
                    // Write the browser logs to file
                    console.log('Writing file ' + logFileName);
                    var len = logsEntries.length;
                    for (var i = 0; i < len; ++i) {

                        var logEntry = logsEntries[i];

                        console.log(logEntry.message);

                        var msg = timestampToDate(logEntry.timestamp) + ' ' + logEntry.type + ' ' + logEntry.message;
                        fs.appendFileSync(logFileName, msg + '\r\n', {encoding: 'utf8'}, errorCallback);
                    }
                }, errorCallback);
            }
        });

    });

    it('should contain 20 translations by default', function () {
        memoFilterPage.reset().then(function () {
            element.all(by.repeater('(i, translation) in memoCtrl.translations track by $index'))
                .then(function (elements) {
                    expect(elements.length).toBe(20); //2 pages
                });
        });
    });

    it('should contain filter button, filter page be accessible and with default values, and with a back button to return to memo page', function () {
        memoFilterPage.reset().then(function () {
            expect(memoPage.memoFilterMenu.isDisplayed()).toBeTruthy();

            memoPage.memoFilterMenu.waitAndClick();

            browser.sleep(2000);
            expect(browser.getTitle()).toBe('Order and Filter');

            expect(memoFilterPage.filterByStringCheck.isSelected()).toBeFalsy();
            expect(memoFilterPage.filterByDatesCheck.isSelected()).toBeFalsy();
            expect(memoFilterPage.filterByLanguagesCheck.isSelected()).toBeFalsy();

            expect(memoFilterPage.memoBackMenu.isDisplayed()).toBeTruthy();

            memoFilterPage.memoBackMenu.click();
            browser.sleep(1000);
            expect(browser.getTitle()).toBe('Memslate > Memo');
        });
    });

    it('should the cancel button of the filter page resets to previous values and done button saves changes', function () {
        memoFilterPage.reset().then(function () {
            memoPage.memoFilterMenu.waitAndClick();


            browser.sleep(2000);

            expect(memoFilterPage.filterByStringCheckInput.isSelected()).toBeFalsy();

            memoFilterPage.filterByStringCheck.waitAndClick();
            memoFilterPage.filterByDatesCheck.click();
            memoFilterPage.filterByLanguagesCheck.click();

            memoFilterPage.filterString.clear();
            memoFilterPage.filterString.sendKeys('and');

            memoFilterPage.filterMemoCancelButton.click();

            browser.sleep(1000);

            memoPage.memoFilterMenu.waitAndClick();

            browser.sleep(1000);

            expect(memoFilterPage.filterByStringCheckInput.isSelected()).toBeFalsy();
            expect(memoFilterPage.filterByDatesCheckInput.isSelected()).toBeFalsy();
            expect(memoFilterPage.filterByLanguagesCheckInput.isSelected()).toBeFalsy();

            memoFilterPage.filterByStringCheck.click();
            memoFilterPage.filterByDatesCheck.click();
            memoFilterPage.filterByLanguagesCheck.click();

            memoFilterPage.filterString.sendKeys('and');

            memoFilterPage.filterMemoDoneButton.click();

            browser.sleep(1000);

            memoPage.memoFilterMenu.waitAndClick();

            browser.sleep(1000);

            expect(memoFilterPage.filterByStringCheckInput.isSelected()).toBeTruthy();
            expect(memoFilterPage.filterByDatesCheckInput.isSelected()).toBeTruthy();
            expect(memoFilterPage.filterByLanguagesCheckInput.isSelected()).toBeTruthy();
        });
    });

    it('should be able to filter by string, order alphabetically and sort ascending and descending', function () {
        memoFilterPage.reset().then(function () {
            expect(memoPage.memoFilterMenu.isDisplayed()).toBeTruthy();
            memoPage.memoFilterMenu.waitAndClick();

            browser.sleep(1000);

            memoFilterPage.orderBySelect.selectItem('Translations.translate,Translations.mainResult'); //alphabetically
            memoFilterPage.filterByStringCheck.click();
            memoFilterPage.filterString.clear();
            memoFilterPage.filterString.sendKeys('and');

            memoFilterPage.filterMemoDoneButton.click();

            element.all(by.repeater('(i, translation) in memoCtrl.translations track by $index'))
                .then(function (elements) {
                    expect(elements.length).toBe(2);

                    expect(elements[0].getInnerHtml()).toContain('and &gt; et');
                    expect(elements[1].getInnerHtml()).toContain('and &gt; y');

                    memoPage.memoOrderWayMenu.click();
                    browser.sleep(2000);

                    element.all(by.repeater('(i, translation) in memoCtrl.translations track by $index'))
                        .then(function (elements) {
                            expect(elements.length).toBe(2);
                            expect(elements[0].getInnerHtml()).toContain('and &gt; y');
                            expect(elements[1].getInnerHtml()).toContain('and &gt; et');
                        });

                });
        });
    });

});
