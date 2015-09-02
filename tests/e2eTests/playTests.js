/**
 * Created by gerard on 02/09/2015.
 */
"use strict";

require('../lib/testUtils.js');
var MemslatePlayPage = require('./pages/playPage.js');
var MemslateBasicTestPage = require('./pages/games/basicTestPage');
var MainPage = require('./pages/mainPage.js');

describe("Memslate Play Page and Basic Test Game", function () {
    var mainPage = new MainPage();
    var playPage = new MemslatePlayPage();
    var basicTestPage = new MemslateBasicTestPage();

    beforeEach(function () {
        playPage.get();
        browser.waitForAngular();

    });

    it('should contain basic test button game', function () {
        "use strict";
        expect(playPage.basicTestButton.isDisplayed()).toBeTruthy();
    });

    it('when clicked the game is opened and contains 10 questions and an evaluation button', function () {
        "use strict";
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
        "use strict";
        playPage.basicTestButton.waitAndClick();

        basicTestPage.basicTestStartGameButton.waitAndClick();

        basicTestPage.basicTestEvaluateButton.waitAndClick();

        mainPage.toast.expectText('Not all responses given...');

        for (var quest = 0; quest < 9; quest++) {
            var answer = Math.floor(Math.random() * 5);
            element(by.id('answer_' + quest + '_' + answer)).click();
            browser.sleep(100);
        }

        basicTestPage.basicTestEvaluateButton.waitAndClick();

        mainPage.toast.expectText('Not all responses given...');

        browser.sleep(3000);

        answer = Math.floor(Math.random() * 5);
        console.log('cllicking \'answer_9_' + answer)
        element(by.id('answer_9_' + answer)).click();

        basicTestPage.basicTestEvaluateButton.waitAndClick();

        browser.sleep(1000);

        expect(basicTestPage.basicTestModalTitle.isDisplayed()).toBeTruthy();

    });

    it('should evaluate properly', function () {
        "use strict";
        var correctAnswers=[];
        var givenAnswers=[];

        playPage.basicTestButton.waitAndClick();

        var numGames = 3;
        for(var i=0; i < numGames; i++)
        {
            basicTestPage.basicTestStartGameButton.waitAndClick();

            for (var quest = 0; quest < 10; quest++)
            {
                //get correct answer
                element(by.id('question_' + quest)).getAttribute('data-answer').then(function (answer) {
                    correctAnswers.push(answer)
                });

                //select answer
                var answer = Math.floor(Math.random() * 5);
                element(by.id('answer_' + quest + '_' + answer)).click();

                //get given answer
                element(by.id('answer_' + quest + '_' + answer)).getAttribute('value').then(function (answer) {
                    givenAnswers.push(answer)
                });

                browser.sleep(100);
            }

            basicTestPage.basicTestEvaluateButton.waitAndClick();

            $('.progress-bar').getText().then(function (text) {
                console.log('Test: '+i);
                console.log(text);
                console.log(correctAnswers);
                console.log(givenAnswers);

                //shown result
                var results = text.split('of');
                console.log(result);
                var result = parseInt(results[0].trim());

                //compute result
                var computedResult = 0;
                correctAnswers.forEach(function (correct, i) {
                    if (correct == givenAnswers[i]) {
                        computedResult++;
                    }
                });

                expect(computedResult).toBe(result);

                basicTestPage.basicTestModalPlayAgainButton.click();

                //empty arrays
                correctAnswers.length = 0;
                givenAnswers.length = 0;
            });

            browser.sleep(1000);
        }
    });
});
