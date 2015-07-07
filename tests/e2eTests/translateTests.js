'use strict';

require('../lib/testUtils.js');
var MemslateTranslatePage = require('./pages/translatePage.js');
var MemslateLoginPage = require('./pages/loginPage.js');
var MainPage = require('./pages/mainPage.js');

describe("Memslate Translate Page", function()
{
    var mainPage = new MainPage();
	var translatePage=new MemslateTranslatePage();
	var loginPage = new MemslateLoginPage();

	beforeEach(function(){
	    translatePage.get();
        browser.waitForAngular();
	});
	
	it('language selection and swap', function()
    {
        translatePage.fromLangSelect.click();
        browser.sleep(2000);
        translatePage.selectLanguage('fr');
        expect(translatePage.fromLangSelect.getAttribute('selected-value')).toBe('fr');
        translatePage.toLangSelect.waitAndClick();
        translatePage.selectLanguage('en');
        expect(translatePage.toLangSelect.getAttribute('selected-value')).toBe('en');

        translatePage.swapLanguages();
        expect(translatePage.fromLangSelect.getAttribute('selected-value')).toBe('en');
        expect(translatePage.toLangSelect.getAttribute('selected-value')).toBe('fr');
        translatePage.swapLanguages();
        expect(translatePage.fromLangSelect.getAttribute('selected-value')).toBe('fr');
        expect(translatePage.toLangSelect.getAttribute('selected-value')).toBe('en');

        translatePage.fromLangSelect.click();
        translatePage.selectLanguage('es');
        expect(translatePage.fromLangSelect.getAttribute('selected-value')).toBe('es');
    });

    it('translate', function()
    {
        browser.waitForAngular();

        translatePage.btnTranslate.click();
        mainPage.toast.expectText('Please, specify a text to translate.');

        translatePage.fromLangSelect.click();
        translatePage.selectLanguage('es');
        expect(translatePage.fromLangSelect.getAttribute('selected-value')).toBe('es');

        translatePage.toLangSelect.click();
        translatePage.selectLanguage('en');
        expect(translatePage.toLangSelect.getAttribute('selected-value')).toBe('en');

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

        /* browser.sleep(1000);

         console.log("after check");

         //add translation sample
         translatePage.setLanguages('en','es');
         translatePage.translate('make');
         var samplesCount=0;
         element.all(by.repeater('sample in translation.samples')).count()
         .then(function(count)
         {
             console.log("samplesCount="+count);
             samplesCount=count; //get previous samples count
         });

         translatePage.addSample('make more');
         element.all(by.repeater('sample in translation.samples'))
         .then(function (elements)
         {
             expect(elements.length).toBe(samplesCount+1);
             expect(elements[elements.length-1].getText()).toContain('make more');

             //retry translation to see if sample saved
             translatePage.translate('make');
             element.all(by.repeater('sample in translation.samples'))
             .then(function(elements)
             {
                 expect(elements.length).toBe(samplesCount+1);
                 expect(elements[elements.length-1].getText()).toContain('make more');

             });

             //delete sample
             element.all(by.repeater('sample in translation.samples')).last().element(by.tagName('button')).click();
             browser.sleep(1000);
             expect(element.all(by.repeater('sample in translation.samples')).count()).toBe(samplesCount);
         });

         //delete translation
         loginPage.login('gcarbo@miraiblau.com','memslate');
         translatePage.setLanguages('es','en');
         translatePage.translate('transportador');
         expect(translatePage.translationYd.getText()).toContain('transporter');
         expect(translatePage.deleteTranslationButton.isPresent()).toBe(true);
         translatePage.deleteTranslationButton.click();
         browser.waitForAngular().then(function(){okCancelDlg.clickOk();});

         //translate again, now from internet provider
         translatePage.translate('transportador');
         expect(translatePage.translationYd.getText()).toContain('transporter');
         console.log("end test");*/
	});
});