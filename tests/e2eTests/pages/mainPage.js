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
        this.waitAndClick();
        browser.sleep(1000);
        this.logoutMenu.waitAndClick();
    };

    this.toastExpect = function(text)
    {
        //browser.sleep(1000);
        this.toast.waitVisible();
        expect(this.toast.getText()).toContain(text);
    };
};

module.exports = MainPage;