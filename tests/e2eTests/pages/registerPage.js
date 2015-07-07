var MemslateRegiserPage = function()
{
	this.name = element(by.name('nameRegister'));
	this.email = element(by.name('emailRegister'));
	this.pwd = element(by.name('passwordRegister'));
	this.pwd2 = element(by.name('password2Register'));
	this.registerButton = element(by.id('registerButtonRegister'));
    this.loginButton = element(by.id('loginButtonRegister'));
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
};

module.exports = MemslateRegiserPage;