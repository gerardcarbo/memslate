/**
 * Created by gerard on 07/05/2015.
 */
"use strict";

var ElementFinder = $('').constructor;

ElementFinder.prototype.waitAndClick = function()
{
    var EC = protractor.ExpectedConditions;
    browser.wait(EC.elementToBeClickable(this), 5000);
    this.click();
};

ElementFinder.prototype.waitVisible = function(timeout)
{
    var self=this;
    timeout = timeout || 5000;

    browser.wait(function () {
        return self.isPresent().then(function(isPresent)
        {
            console.log('isPresent: ',isPresent);return isPresent;
        });
    },timeout);
    browser.wait(function () {
        return self.isDisplayed().then(function(isDisplayed)
        {
            console.log('isDisplayed: ',isDisplayed);return isDisplayed;
        });
    },timeout);
};

ElementFinder.prototype.expectText = function(text)
{
    this.waitVisible();
    expect(this.getText()).toBe(text);
};

ElementFinder.prototype.expectToContain = function(text)
{
    this.waitVisible();
    expect(this.getText()).toContain(text);
};

by.cssClass = function(cssClass)
{
    return this.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' "+cssClass+" ') ]");
};

ElementFinder.prototype.selectItem = function(item)
{
    this.waitAndClick();

    var selectedItem=element(by.xpath("//div[contains(concat(' ',normalize-space(@class),' '),' active ')]//label[input[@value='"+item+"']]"));
    browser.executeScript(function () { arguments[0].scrollIntoView(); }, selectedItem.getWebElement());
    selectedItem.click();
};