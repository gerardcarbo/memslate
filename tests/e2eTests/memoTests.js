'use strict';

require('../lib/testUtils.js');
var MemslateMemoPage = require('./pages/memoPage.js');
var MemslateLoginPage = require('./pages/loginPage.js');
var MainPage = require('./pages/mainPage.js');

describe("Memslate Memo Page", function()
{
    var mainPage = new MainPage();
    var memoPage = new MemslateMemoPage();
    var loginPage = new MemslateLoginPage();


    beforeEach(function ()
    {
        memoPage.get();
        browser.waitForAngular();
    });

    it('should contain filter button and filter page be accesible', function()
    {
        expect(memoPage.memoFilterMenu.isDisplayed()).toBeTruthy();
        memoPage.memoFilterMenu.waitAndClick();

        browser.sleep(1000);
        expect(browser.getTitle()).toBe('Filter Memo');
    });
});
