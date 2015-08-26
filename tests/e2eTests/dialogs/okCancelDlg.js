require('../../lib/testUtils.js');

var okCancelDlg = function () {
    "use strict";

    this.cancelButton = element(by.css('div.popup-container.popup-showing.active > div > div.popup-buttons > button.button.ng-binding.button-default'));
    this.okButton = element(by.css('div.popup-container.popup-showing.active > div > div.popup-buttons > button.button.ng-binding.button-positive'));

    this.clickOk =  function()
    {
        this.okButton.waitAndClick();
    }

    this.clickCancel =  function()
    {
        this.cancelButton.waitAndClick();
    }
};

module.exports = okCancelDlg;