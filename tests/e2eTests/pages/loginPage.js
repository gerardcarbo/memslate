"use strict";
var OkCancelDlg = require('../dialogs/okCancelDlg');
var UserPage = require('./userPage');

var MemslateLogin = function (mainMenu)
{
    this.okCancelDlg = new OkCancelDlg();
    this.userPage = new UserPage();
    this.mainMenu = mainMenu;

    this.formLogin = element(by.id('loginForm'));
    this.emailInput = element(by.name('email'));
    this.passwordInput = element(by.name('password'));
    this.loginButton = element(by.id('loginButton'));
    this.loginMenu = element(by.id('loginMenu'));
    this.userMenu = element(by.id('userMenu'));
    this.registerButton = element(by.id('registerButton'));
    this.emailRequired = element(by.id('emailRequired'));
    this.emailInvalid = element(by.id('emailInvalid'));
    this.passwordRequired = element(by.id('passwordRequired'));
    this.loginFailedPopup = element(by.css('.loginFailedPopup'));
    this.loginFailedPopupOkButton = element(by.css('.loginFailedPopup button'));
    this.invalidDataAlert = element(by.css('.invalidDataAlert'));
    this.invalidDataAlertButton = element(by.css('.invalidDataAlert button'));
    this.closeButton = element(by.id('closeButton'));

    this.loginMsgs = {};
    this.loginMsgs.enterEmail = 'Please enter an email';
    this.loginMsgs.validEmail = 'Please enter a valid email';
    this.loginMsgs.invalidAccount = 'Invalid Account';

    var self=this;

    this.login = function (email, password)
    {
        var self = this;

        self.loginMenu.isPresent().then(function(present){
            console.log('login present:', present);
            if(present) {
                self.loginMenu.isDisplayed().then(function (displayed) {
                    console.log('login displayed:', displayed);
                    if (!displayed) {
                        self.mainMenu.clickLogin();
                    }
                    else {
                        self.loginMenu.waitAndClick();
                    }
                });
            } else {
                // !present
                self.mainMenu.clickLogin();
            }
        });

        this.emailInput.waitVisible();
        this.emailInput.clear();
        this.passwordInput.clear();
        this.emailInput.sendKeys(email);
        this.passwordInput.sendKeys(password);
        this.loginButton.getAttribute('disabled').
            then(function (val) {
                if (val != 'true') {
                    self.loginButton.click(); //send login data
                }
            });
    };

    this.logout = function()
    {
        self.userMenu.isPresent().then(function(present){
            if(!present) {
                self.mainMenu.openMenu();
            } else {
                self.userMenu.isDisplayed().then(function (displayed) {
                    if (!displayed) {
                        self.mainMenu.openMenu();
                    }
                });
            }
        });

        this.userMenu.click();
        this.userPage.logoutButton.waitAndClick();
        this.okCancelDlg.clickOk();
    };
};


module.exports = MemslateLogin;