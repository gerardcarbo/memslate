/**
 * Created by gerard on 07/05/2015.
 */
"use strict";

var MainPage = function()
{
    this.mainMenu = element(by.xpath("//*[@nav-bar='active']//ion-header-bar//div[1]//span//button"));
    this.homeMenu = element(by.id('homeMenu'));
    this.translateMenu = element(by.id('translateMenu'));
    this.memoMenu = element(by.id('memoMenu'));
    this.playMenu = element(by.id('playMenu'));
    this.loginMenu = element(by.id('loginMenu'));
    this.logoutMenu = element(by.id('logoutMenu'));
    this.userMenu = element(by.xpath('//*[@nav-bar="active"]//*[@id="userMenu"]'));
    this.backMenu = element(by.xpath('//*[@nav-bar="active"]//button[contains(concat(" ",normalize-space(@class)," ")," back-button ")]'));
    this.toast = element(by.id('toasts'));

    var self = this;

    this.click = function()
    {
        this.mainMenu.click();
    };

    this.waitAndClick = function()
    {
        this.mainMenu.waitAndClick();
    };

    this.clickLogin = function()
    {
        this.waitAndClick();
        browser.sleep(1000);
        this.loginMenu.waitAndClick();
    };

    this.clickLogout = function()
    {
        this.mainMenu.waitAndClick();
        return this.logoutMenu.isDisplayed().then(function(isLoggedIn) {
            console.log('MainPage: clickLogout: logoutMenu.isDisplayed:'+isLoggedIn);
            if(isLoggedIn)
                self.logoutMenu.waitAndClick();
            else
                self.mainMenu.waitAndClick();

            return isLoggedIn;
        });
    };

};

module.exports = MainPage;