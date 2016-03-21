/**
 * Created by gerard on 07/05/2015.
 */
"use strict";

var MainPage = function()
{
    this.mainMenu = element(by.xpath('//*[@nav-bar="active"]//button[contains(concat(" ",normalize-space(@class)," ")," ion-navicon ")]'));
    this.homeMenu = element(by.id('homeMenu'));
    this.translateMenu = element(by.id('translateMenu'));
    this.memoMenu = element(by.id('memoMenu'));
    this.playMenu = element(by.id('playMenu'));
    this.loginMenu = element(by.id('loginMenu'));
    this.logoutMenu = element(by.id('logoutMenu'));
    this.userMenu = element(by.xpath('//*[@id="userMenu"]'));
    this.backMenu = element(by.xpath('//*[@nav-bar="active"]//button[contains(concat(" ",normalize-space(@class)," ")," back-button ")]'));
    this.toast = element(by.id('toasts'));

    var self = this;

    this.openMenu = function()
    {
        this.mainMenu.waitAndClick();
    };

    this.clickLogin = function()
    {
        this.openMenu();
        browser.sleep(1000);
        this.loginMenu.waitAndClick();
    };

};

module.exports = MainPage;