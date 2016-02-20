"use strict";
var MainPage = require('./mainPage.js');
var MemslateLogin = require('./loginPage.js');
var MemslateUserPage = require('./userPage.js');

var MemslateRegiserPage = function()
{
	var self=this;
	var mainPage = new MainPage();
	var loginPage = new MemslateLogin(mainPage);
	var userPage = new MemslateUserPage();

	this.name = element(by.name('nameRegister'));
	this.email = element(by.name('emailRegister'));
	this.pwd = element(by.name('passwordRegister'));
	this.pwd2 = element(by.name('password2Register'));
	this.registerButton = element(by.id('registerButtonRegister'));
    this.loginButton = element(by.id('loginButtonRegister'));
	this.closeButton = element(by.id('closeButton'));
	this.nameRequired = element(by.id('nameRequired'));
	this.emailRequired = element(by.id('emailRequired'));
	this.emailInvalid = element(by.id('emailInvalid'));
	this.pwdRequired = element(by.id('pwdRequired'));
	this.pwd2Required = element(by.id('pwd2Required'));
	this.pwdMismatch = element(by.id('pwdMismatch'));
	this.registrationFailedPopup = element(by.css('.registrationFailedPopup'));
	this.registrationFailedPopupOkButton = element(by.css('.registrationFailedPopup button'));
	this.invalidDataAlert  = element(by.css('.invalidDataAlert'));
	this.invalidDataAlertOkButton  = element(by.css('.invalidDataAlert button'));

	this.registerUser =  function(name, pwd) {
		//create new user
		mainPage.clickLogin();
		loginPage.registerButton.waitAndClick();

		this.name.clear().sendKeys(name);
		this.email.clear().sendKeys(name);
		this.pwd.clear().sendKeys(pwd);
		this.pwd2.clear().sendKeys(pwd);
		this.registerButton.click();
	};

	this.unregisterUser = function(name, pwd) {
		loginPage.login(name,pwd);
		mainPage.userMenu.isPresent().then(function (present) {
			if (present == true) {
				mainPage.userMenu.click();
				userPage.deleteAccountButton.click();
				userPage.deleteAccountPopupOkButton.waitAndClick();
			}
			else {
				//user not found: close register page
				self.closeButton.click();
			}
		});
	};

};

module.exports = MemslateRegiserPage;