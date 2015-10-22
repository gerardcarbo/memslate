"use strict";
var OkCancelDlg = require('../dialogs/okCancelDlg');

var MemslateLogin = function (mainMenu)
{
    this.okCancelDlg = new OkCancelDlg();

    this.mainMenu = mainMenu;

    this.formLogin = element(by.id('loginForm'));
    this.emailInput = element(by.name('email'));
    this.passwordInput = element(by.name('password'));
    this.loginButton = element(by.id('loginButton'));
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

    this.login = function (email, password)
    {
        var self = this;

        self.formLogin.isPresent().then(function(present){
            console.log('login present:',present);
            if(!present)
            {
                self.mainMenu.clickLogin();
            }
            else
            {
                self.formLogin.isDisplayed().then(function(displayed)
                {
                    console.log('login displayed:',displayed);

                    if(!displayed)
                    {
                        self.mainMenu.clickLogin();
                    }
                });
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
        this.mainMenu.clickLogout();
        this.okCancelDlg.clickOk();
    };
};


module.exports = MemslateLogin;