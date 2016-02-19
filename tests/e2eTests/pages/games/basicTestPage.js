"use strict";

var MsSelect = require('../../widgets/ms-select');

var MemslateBasicTestPage = function() {
    this.basicTestLangsSelector = element(by.id('basic-test-languages'));
    this.basicTestLangsSelector = element(by.id('basic-test-languages'));
    this.basicTestStartGameButton = element(by.id('basic-test-start-game'));
    this.basicTestTestList = element(by.id('basic-page-test-list'));
    this.basicTestEvaluateButton = element(by.id('basic-test-evaluate'));
    this.basicTestModalTitle = element(by.css('div.modal-wrapper ion-header-bar .title'));

    this.playAgainButton = element(by.id('play-again'));

    this.basicTestLanguages = new MsSelect(element(by.id('basic-test-languages')));
    this.basicTestLevels = new MsSelect(element(by.id('basic-test-level')));

    this.registrationFailedPopup = element(by.css('.registrationFailedPopup'));
    this.registrationFailedPopupOkButton = element(by.css('.registrationFailedPopup button'));

    this.get=function()
    {
        browser.get('http://localhost:5000/#/games/basic-test');
    };

    this.selectLanguage = function(langs)
    {
        this.basicTestLanguages.selectItem(langs);
    };

    this.selectLevel = function(level)
    {
        this.basicTestLevels.selectItemName(level);
    };

    this.playAndEvaluate = function(mainPage, langs, level)
    {
        var correctAnswers=[];
        var givenAnswers=[];

        if(langs) this.selectLanguage(langs);
        if(level) this.selectLevel(level);

        this.basicTestStartGameButton.waitAndClick();

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

            browser.sleep(200);
        }

        //basicTestPage.basicTestEvaluateButton.waitAndClick(); -> opened automatically once all answers given.

        $('.progress-bar').getText().then(function (text) {
            console.log('Test: ' + langs+ ' - '+ level);
            console.log('Text: ' + text);
            console.log('correctAnswers: ',correctAnswers);
            console.log('givenAnswers: ',givenAnswers);

            //shown result
            var results = text.split('of');
            console.log(results);
            var result = parseInt(results[0].trim());

            //compute result
            var computedResult = 0;
            correctAnswers.forEach(function (correct, i) {
                if (correct == givenAnswers[i]) {
                    computedResult++;
                }
            });

            expect(computedResult).toBe(result);
        });
    }
};

module.exports = MemslateBasicTestPage;