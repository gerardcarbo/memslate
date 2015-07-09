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

            browser.sleep(1000);
            expect(browser.getTitle()).toBe('Filter Memo');

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
