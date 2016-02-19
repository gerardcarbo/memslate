/**
 * Created by gerard on 02/09/2015.
 */
"use strict";

var utils = require('../lib/testUtils.js');
var MemslatePlayPage = require('./pages/playPage.js');
var MemslateBasicTestPage = require('./pages/games/basicTestPage');
var MainPage = require('./pages/mainPage.js');
var MemslateLoginPage = require('./pages/loginPage.js');
var Alert = require('./dialogs/alertDlg');

describe("Memslate Play Page and Basic Test Game", function () {
    var mainPage = new MainPage();
    var playPage = new MemslatePlayPage();
    var basicTestPage = new MemslateBasicTestPage();
    var loginPage = new MemslateLoginPage(mainPage);
    var alert = new Alert();

    beforeEach(function () {
        playPage.get();
        browser.waitForAngular();
        loginPage.logout();
    });

    afterEach(function () {
        utils.LogConsoleAndTakeSnapshots(browser, jasmine);
    });

    it('should contain basic test button game', function () {
        expect(playPage.basicTestButton.isDisplayed()).toBeTruthy();
    });

    it('when clicked the game is opened and contains 10 questions and an evaluation button', function () {
        playPage.basicTestButton.waitAndClick();

        expect(basicTestPage.basicTestLangsSelector.isDisplayed()).toBeTruthy();
        expect(basicTestPage.basicTestStartGameButton.isDisplayed()).toBeTruthy();

        basicTestPage.basicTestStartGameButton.waitAndClick();

        expect(basicTestPage.basicTestTestList.isDisplayed()).toBeTruthy();

        expect($$('.list .item-stable').count()).toBe(10);

        //same as before
        element.all(by.repeater('(i, question) in basicTestCtrl.gameQuestions track by $index'))
            .then(function (elements) {
                expect(elements.length).toBe(10);
            });

        expect(basicTestPage.basicTestEvaluateButton.isDisplayed()).toBeTruthy();
    });



    it('should, once started the game, only to be able to be evaluated when all the questions are fulfilled', function () {
        playPage.basicTestButton.waitAndClick();

        basicTestPage.selectLanguage('es-en');
        basicTestPage.selectLevel('High');

        basicTestPage.basicTestStartGameButton.waitAndClick();

        basicTestPage.basicTestEvaluateButton.waitAndClick();

        console.log("mainPage.toast.expectText 'Not all responses given...'");
        mainPage.toast.expectText('Not all responses given...');
        browser.sleep(2500); //wait toast hidden to avoid to be clicked on next test

        for (var quest = 0; quest < 9; quest++) {
            var answer = Math.floor(Math.random() * 5);
            element(by.id('answer_' + quest + '_' + answer)).click();
            browser.sleep(250);
        }

        basicTestPage.basicTestEvaluateButton.waitAndClick();

        mainPage.toast.expectText('Not all responses given...');

        browser.sleep(3000);

        answer = Math.floor(Math.random() * 5);
        console.log('cllicking \'answer_9_' + answer)
        element(by.id('answer_9_' + answer)).click();

        //basicTestPage.basicTestEvaluateButton.waitAndClick(); -> opened automatically once all answers given.

        browser.sleep(1000);

        expect(basicTestPage.basicTestModalTitle.isDisplayed()).toBeTruthy();

    });


    it('should evaluate properly', function () {

        playPage.basicTestButton.waitAndClick();

        var options = [
            {langs: 'en-es', level: 'Easy'},
            {langs: 'es-en', level: 'Easy'},
            {langs: 'en-fr', level: 'Easy'},
            {langs: 'en-es', level: 'Medium'},
            {langs: 'en-es', level: 'High'},
            {langs: 'en-es', level: 'Any'},
        ]

        var numGames = 6;
        for(var i=0; i < numGames; i++)
        {
            basicTestPage.playAndEvaluate(mainPage,options[i].langs, options[i].level);

            basicTestPage.playAgainButton.click();

            browser.sleep(1000);
        }
    },180000);

    it('should be able to play a user without translations', function () {

        loginPage.login('test@test.com', 'testte');

        playPage.basicTestButton.waitAndClick();

        expect(alert.text()).toContain('You do not have enough translations to play the game (20)');
        alert.close();

        basicTestPage.playAndEvaluate(mainPage, 'en-es', 'Medium');
    });


    it('should be able to play a user with some translations', function () {

        loginPage.login('gcarbo@grupfe.com', 'gcarbo');

        playPage.basicTestButton.waitAndClick();

        basicTestPage.basicTestStartGameButton.waitAndClick();

        mainPage.toast.expectToContain("You don't have enough translations");
        browser.sleep(1000);

        basicTestPage.playAndEvaluate(mainPage, 'en-es', 'Medium');
    });
});
