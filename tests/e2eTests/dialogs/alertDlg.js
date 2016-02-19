"use strict";

var Alert = function()
{
    this.text = function()
    {
        var popup =  element(by.css('.popup'));
        return popup.getText();
    }

    this.close = function()
    {
        var button =  element(by.css('.popup button'));
        button.click();
    }
};

module.exports = Alert;