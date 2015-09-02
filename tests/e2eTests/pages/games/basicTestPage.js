/**
 * Created by gerard on 02/09/2015.
 */
/**
 * Created by gerard on 02/09/2015.
 */
var MemslateBasicTestPage = function() {
    this.basicTestLangsSelector = element(by.id('basic-test-languages'));
    this.basicTestStartGameButton = element(by.id('basic-test-start-game'));
    this.basicTestTestList = element(by.id('basic-page-test-list'));
    this.basicTestEvaluateButton = element(by.id('basic-test-evaluate'));
    this.basicTestModalTitle = element(by.css('div.modal-wrapper ion-header-bar .title'));

    this.basicTestModalPlayAgainButton = element(by.id('play-again'));

    this.get=function()
    {
        browser.get('http://localhost:5000/#/games/basic-test');
    };
};

module.exports = MemslateBasicTestPage;