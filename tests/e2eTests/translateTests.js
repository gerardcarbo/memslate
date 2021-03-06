'use strict';

var utils = require('../lib/testUtils.js');
var MemslateTranslatePage = require('./pages/translatePage.js');
var MainPage = require('./pages/mainPage.js');
var MemslateLoginPage = require('./pages/loginPage.js');
var OkCancelDlg = require('./dialogs/okCancelDlg');
var UserService = require('./services/user');

describe("Memslate Translate Page", function () {
    var mainPage = new MainPage();
    var translatePage = new MemslateTranslatePage();
    var loginPage = new MemslateLoginPage(mainPage);
    var okCancelDlg = new OkCancelDlg();
    var userService = new UserService();

    beforeEach(function () {
        translatePage.get();
        browser.waitForAngular();
    });

    afterEach(function () {
        utils.LogConsoleAndTakeSnapshots(browser, jasmine);
    });

    it('should allow language selection and swap', function () {
        browser.waitForAngular();
        translatePage.fromLangSelect.selectItem('fr');
        expect(translatePage.fromLangSelect.getSelected()).toBe('fr');
        translatePage.toLangSelect.selectItem('en');
        expect(translatePage.toLangSelect.getSelected()).toBe('en');
        translatePage.fromLangSelect.selectItem('en');
        mainPage.toast.expectText('From and to languages must be distinct');
        translatePage.toLangSelect.selectItem('fr');
        mainPage.toast.expectText('From and to languages must be distinct');

        translatePage.swapLanguages();
        expect(translatePage.fromLangSelect.getSelected()).toBe('en');
        expect(translatePage.toLangSelect.getSelected()).toBe('fr');
        translatePage.swapLanguages();
        expect(translatePage.fromLangSelect.getSelected()).toBe('fr');
        expect(translatePage.toLangSelect.getSelected()).toBe('en');

        translatePage.fromLangSelect.selectItem('es');
        expect(translatePage.fromLangSelect.getSelected()).toBe('es');
    });

    it('should be able to translate', function () {

        translatePage.btnTranslate.click();
        mainPage.toast.expectText('Please, specify a text to translate.');

        translatePage.fromLangSelect.selectItem('es');
        expect(translatePage.fromLangSelect.getSelected()).toBe('es');

        translatePage.toLangSelect.selectItem('en');
        expect(translatePage.toLangSelect.getSelected()).toBe('en');

        //spanish to english with provider yt (yandex translate)
        translatePage.translate('catarsis');
        expect(translatePage.translationYt.getText()).toBe('catarsis  >  catharsis');

        //english to spanish with provider yd (yandex dictionary)
        translatePage.swapLanguages();
        translatePage.translate('make');
        expect(translatePage.translationYd.getText()).toMatch(/make[\s\S]*hacer[\s\S]*realizar/); //[\s\S] means any character including breaklines * zero or more times

        //translation not found
        translatePage.translate('dsfsdf');

        expect(translatePage.translationYt.isPresent()).toBeFalsy();
        expect(translatePage.translationYd.isPresent()).toBeFalsy();
        mainPage.toast.expectText('Translation not found');

        browser.sleep(1000);

        console.log("after check");

        //add translation sample
        translatePage.setLanguages('en', 'es');
        translatePage.translate('make');
        var samplesCount = 0;
        element.all(by.repeater('sample in translation.samples')).count()
            .then(function (count) {
                console.log("samplesCount=" + count);
                samplesCount = count; //get previous samples count
            });

        translatePage.addSample('make more');
        element.all(by.repeater('sample in translation.samples'))
            .then(function (elements) {
                expect(elements.length).toBe(samplesCount + 1);
                expect(elements[elements.length - 1].getText()).toContain('make more');

                //retry translation to see if sample saved
                translatePage.translate('make');
                element.all(by.repeater('sample in translation.samples'))
                    .then(function (elements) {
                        expect(elements.length).toBe(samplesCount + 1);
                        expect(elements[elements.length - 1].getText()).toContain('make more');

                    });

                //delete sample
                element.all(by.repeater('sample in translation.samples')).last().element(by.css('.btnDelSample')).click();
                browser.sleep(1000);
                expect(element.all(by.repeater('sample in translation.samples')).count()).toBe(samplesCount);
            });
    });

    it('should be able to login and translate', function () {
        userService.logout().then(function () {
            loginPage.login('gcarbo@grupfe.com', 'gcarbo');
            translatePage.setLanguages('es', 'en');
            translatePage.translate('transportador');
            translatePage.translationYd.waitVisible();
            expect(translatePage.translationYd.getText()).toContain('transporter');
            loginPage.logout();
        });
    });

    it('should be able to delete translation, if logged in and if not', function () {
        userService.logout().then(function () {
            //can not delete if not logged in

            translatePage.setLanguages('es', 'en');
            translatePage.translate('transportador');
            expect(translatePage.deleteTranslationButton.isPresent()).toBe(true);

            //log in and delete
            loginPage.login('gcarbo@grupfe.com', 'gcarbo');
            translatePage.setLanguages('es', 'en');
            translatePage.translate('transportador');
            expect(translatePage.translationYd.getText()).toContain('transporter');
            expect(translatePage.deleteTranslationButton.isPresent()).toBe(true);
            translatePage.deleteTranslationButton.click();

            okCancelDlg.clickOk();

            expect(translatePage.textToTranslate.getText()).toBe('');
            loginPage.logout();
        });
    });
});