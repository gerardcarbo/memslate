"use strict";
var MsSelect = function(elem) {
    this.element = elem;
    this.selectItem = function(value)
    {
        this.element.click();

        var item=element(by.xpath("//div[contains(concat(' ',normalize-space(@class),' '),' active ')]//label[input[@value='"+value+"']]"));
        browser.executeScript(function () { arguments[0].scrollIntoView(); }, item.getWebElement());
        item.click();
    };

    this.selectItemName = function(name)
    {
        this.element.click();
        var item=element(by.xpath("//div[contains(concat(' ',normalize-space(@class),' '),' active ')]//label[div/div/span[contains(.,'"+name+"')]]"));
        browser.executeScript(function () { arguments[0].scrollIntoView(); }, item.getWebElement());
        item.click();
    };

    this.getSelected = function()
    {
        return this.element.getAttribute('selected-value');
    }
}

module.exports = MsSelect;