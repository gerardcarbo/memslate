'use strict';

var utils = require('../lib/testUtils.js');
var MemslateLogin = require('./pages/loginPage.js');
var MemslateHomePage = require('./pages/homePage.js');
var MemslateUserPage = require('./pages/userPage.js');
var MemslateRegisterPage = require('./pages/registerPage.js');
var MainPage = require('./pages/mainPage.js');

console.log('user tests....');

describe("Memslate User Tests", function ()
{
    var mainPage = new MainPage();
    var loginPage = new MemslateLogin(mainPage);
    var userPage = new MemslateUserPage();
    var homePage = new MemslateHomePage();
    var registerPage = new MemslateRegisterPage();

    beforeEach(function () {
        homePage.get();
    });

    beforeEach(function (done) {
        //check if test@test.com exists and delete account
        browser.waitForAngular();
        loginPage.login('test@test.com', 'testtest');
        mainPage.userMenu.isPresent().then(function (present) {
            console.log('present: ', present)
            if (present == true) {
                mainPage.userMenu.click();
                userPage.deleteAccountButton.click();
                userPage.deleteAccountPopupOkButton.waitAndClick();

                done();
            }
            else {
                //loginPage.loginFailedPopupOkButton.click();  -> changed to Toast
                loginPage.closeButton.waitAndClick();
                loginPage.login('test@test.com', 'testtest2');
                mainPage.userMenu.isPresent().then(function (present) {
                    console.log('present: ', present)
                    if (present == true) {
                        mainPage.userMenu.click();
                        userPage.deleteAccountButton.click();
                        userPage.deleteAccountPopupOkButton.waitAndClick();
                    }
                    else {
                        //loginPage.loginFailedPopupOkButton.waitAndClick();
                        loginPage.closeButton.waitAndClick();
                    }
                    done();
                });
            }
        });
    });

    afterEach(function () {
        utils.LogConsoleAndTakeSnapshots(browser, jasmine);
    });

    it('register new user, check user page, change password and delete it', function () {
        browser.waitForAngular();

        //create new user
        mainPage.clickLogin();
        loginPage.registerButton.waitAndClick();

        registerPage.registerButton.waitAndClick();
        mainPage.toast.expectToContain('Some data is not correct');
        expect(registerPage.nameRequired.isDisplayed).toBeTruthy();

        registerPage.name.sendKeys('tester');
        registerPage.registerButton.waitAndClick();
        mainPage.toast.expectToContain('Some data is not correct');
        expect(registerPage.emailRequired.isDisplayed).toBeTruthy();

        registerPage.email.sendKeys('anonymous@memslate.com');
        registerPage.registerButton.waitAndClick();
        mainPage.toast.expectToContain('Some data is not correct');
        expect(registerPage.pwdRequired.isDisplayed).toBeTruthy();

        registerPage.pwd.sendKeys('testtest');
        registerPage.registerButton.waitAndClick();
        mainPage.toast.expectToContain('Some data is not correct');
        expect(registerPage.pwd2Required.isDisplayed).toBeTruthy();

        registerPage.pwd2.sendKeys('testtest2');
        registerPage.registerButton.waitAndClick();
        browser.sleep(500);
        expect(registerPage.registrationFailedPopupOkButton.isDisplayed()).toBeTruthy();
        expect(registerPage.registrationFailedPopup.getText()).toContain('Passwords does not match');
        registerPage.registrationFailedPopupOkButton.waitAndClick();
        expect(registerPage.pwdMismatch.isDisplayed).toBeTruthy();

        registerPage.pwd.clear().sendKeys('testtest');
        registerPage.pwd2.clear().sendKeys('testtest');
        registerPage.registerButton.click();
        browser.sleep(500);
        expect(registerPage.registrationFailedPopup.isDisplayed()).toBeTruthy();
        expect(registerPage.registrationFailedPopup.getText()).toContain('already registered');
        registerPage.registrationFailedPopupOkButton.click();

        registerPage.email.clear().sendKeys('test@test.com');
        registerPage.pwd.clear().sendKeys('testtest');
        registerPage.pwd2.clear().sendKeys('testtest');
        registerPage.registerButton.click();

        expect(mainPage.userMenu.isPresent()).toBeTruthy();

        //logout
        loginPage.logout();
        expect(mainPage.userMenu.isPresent()).not.toBeTruthy();

        //login
        loginPage.login('test@test.com', 'testtest');

        mainPage.userMenu.waitVisible();
        expect(mainPage.userMenu.isPresent()).toBeTruthy();

        //load user page
        mainPage.userMenu.click();

        //change user password
        expect(homePage.getTitle()).toEqual(homePage.titles.user);

        //check user page data
        expect(userPage.userName.getText()).toEqual('tester');
        expect(userPage.userEmail.getText()).toEqual('test@test.com');
        /*userPage.userTranslations.getAttribute('value')
            .then(function (value){
                expect(Number(value)).toBeGreaterThan(10);
            });*/

        //change password
        //invalid pwd
        userPage.showChangePwdButton.click();
        browser.sleep(200);
        userPage.oldPwd.sendKeys('');
        userPage.newPwd.sendKeys('');
        userPage.changePwdButton.click();
        expect(userPage.oldPwdRequired.isDisplayed()).toBeTruthy();
        expect(userPage.newPwdRequired.isDisplayed()).toBeTruthy();

        userPage.oldPwd.sendKeys('m');
        userPage.newPwd.sendKeys('m');
        userPage.newPwd2.sendKeys('m');
        userPage.changePwdButton.click();
        mainPage.toast.expectToContain('Password must be at least');

        userPage.newPwd2.sendKeys('mm');
        userPage.changePwdButton.click();
        mainPage.toast.expectToContain('Passwords does not match');

        //valid pwd
        userPage.oldPwd.clear().sendKeys('testtest');
        userPage.newPwd.clear().sendKeys('testtest');
        userPage.newPwd2.clear().sendKeys('testtest');
        userPage.changePwdButton.click();
        mainPage.toast.expectText('Password Changed');

        //invalid pwd
        userPage.showChangePwdButton.click();
        browser.sleep(200);

        userPage.oldPwd.clear().sendKeys('testtest2');
        userPage.newPwd.clear().sendKeys('testtest');
        userPage.newPwd2.clear().sendKeys('testtest');
        userPage.changePwdButton.click();
        mainPage.toast.expectToContain('Invalid Credentials');

        //valid pwd again
        userPage.oldPwd.clear().sendKeys('testtest');
        userPage.newPwd.clear().sendKeys('testtest');
        userPage.newPwd2.clear().sendKeys('testtest');
        userPage.changePwdButton.click();
        mainPage.toast.expectText('Password Changed');

        //logout and login again
        mainPage.backMenu.click();
        loginPage.logout();
        expect(mainPage.userMenu.isPresent()).not.toBeTruthy();

        loginPage.login('test@test.com', 'testtest');
        mainPage.userMenu.waitVisible(1000);
        expect(mainPage.userMenu.isDisplayed()).toBeTruthy();

        //delete account
        mainPage.userMenu.click();
        userPage.deleteAccountButton.waitAndClick();
        userPage.deleteAccountPopupCancelButton.waitAndClick();
        expect(userPage.deleteAccountPopup.isPresent()).not.toBeTruthy();

        userPage.deleteAccountButton.click();
        userPage.deleteAccountPopupOkButton.waitAndClick();
        expect(userPage.deleteAccountPopup.isPresent()).not.toBeTruthy();

        mainPage.loginMenu.waitVisible(1000);

        expect(mainPage.logoutMenu.isDisplayed()).toBe(false);
        expect(mainPage.loginMenu.isDisplayed()).toBe(true);

        //try to login again, should fail
        loginPage.login('test@test.com', 'testtest');
        mainPage.toast.expectToContain('Login Failed:');
        //loginPage.loginFailedPopupOkButton.click();
    },70000);
});