"use strict";

/* ElementFinder added functionality */
var ElementFinder = $('').constructor;

ElementFinder.prototype.waitAndClick = function()
{
    var EC = protractor.ExpectedConditions;
    browser.wait(EC.elementToBeClickable(this), 5000);
    this.click();
};

ElementFinder.prototype.waitVisible = function(timeout, waitPresent, waitNotEmpty)
{
    var self=this;
    timeout = timeout || 5000;
    waitPresent = waitPresent || false;
    waitNotEmpty = waitNotEmpty || false;

    if (waitPresent) browser.wait(function () {
        return self.isPresent().then(function(isPresent)
        {
            console.log('isPresent: ',isPresent);
            return isPresent;
        });
    },timeout);

    browser.wait(function () {
        return self.isDisplayed().then(function(isDisplayed)
        {
            console.log('isDisplayed: ',isDisplayed);
            return isDisplayed;
        });
    },timeout);

    if(waitNotEmpty) browser.wait(function () {
        return self.getText().then(function(text)
        {
            console.log('text: ',text);
            return text!="";
        });
    },timeout);
};

ElementFinder.prototype.expectText = function(text, waitPresent, waitNotEmpty)
{
    this.waitVisible(5000, waitPresent, waitNotEmpty);
    expect(this.getText()).toBe(text);
};

ElementFinder.prototype.expectToContain = function(text, waitPresent, waitNotEmpty)
{
    this.waitVisible(5000, waitPresent, waitNotEmpty);
    expect(this.getText()).toContain(text);
};

ElementFinder.prototype.sleepAndExpectToContain = function(text)
{
    browser.sleep(1000);
    expect(this.getText()).toContain(text);
};

by.cssClass = function(cssClass)
{
    return this.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' "+cssClass+" ') ]");
};

ElementFinder.prototype.selectItem = function(item)
{
    this.waitAndClick();

    var selectedItem=element(by.xpath("//div[contains(concat(' ',normalize-space(@class),' '),' active ')]//label[input[@value='"+item+"']]"));
    browser.executeScript(function () { arguments[0].scrollIntoView(); }, selectedItem.getWebElement());
    selectedItem.click();
};

/* Logging Utils */
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

// Log console output and Take a screenshot automatically after each failing test.
module.exports = {
    LogConsoleAndTakeSnapshots: function (browser, jasmine, outputConsole)
    {
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
                console.log('Writing file (' + pngFileName + ':0:0)');
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
                    console.log('Writing file (' + logFileName + ')');
                    var len = logsEntries.length;
                    for (var i = 0; i < len; ++i) {

                        var logEntry = logsEntries[i];

                        if (outputConsole) console.log(logEntry.message);

                        var msg = timestampToDate(logEntry.timestamp) + ' ' + logEntry.type + ' ' + logEntry.message;
                        fs.appendFileSync(logFileName, msg + '\r\n', {encoding: 'utf8'}, errorCallback);
                    }
                }, errorCallback);
            }
        });
    }
};