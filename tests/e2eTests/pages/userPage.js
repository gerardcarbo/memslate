var MemslateUserPage = function()
{
    this.userName = element(by.id('userName'));
	this.userEmail = element(by.id('userEmail'));
	this.deleteAccountPopupOkButton = element(by.css('.deleteAccountPopup .button-positive'));
	this.deleteAccountPopupCancelButton = element(by.css('.deleteAccountPopup .button-default'));
	this.deleteAccountPopup = element(by.css('.deleteAccountPopup'));
	this.invalidDataAlert = element(by.css('.invalidDataAlert'));
	this.invalidDataAlertButton = element(by.css('.invalidDataAlert button'));

	this.userTranslations = element(by.id('userTranslations'));
	this.showChangePwdButton = element(by.id('showChangePwdButton'));
	this.oldPwd = element(by.name('oldPwd'));
	this.newPwd = element(by.name('newPwd'));
	this.newPwd2 = element(by.name('newPwd2'));
    this.oldPwdRequired = element(by.id('oldPwdRequired'));
    this.newPwdRequired = element(by.id('newPwdRequired'));
	this.newPwd2Required = element(by.id('newPwd2Required'));
	this.pwdMismatch = element(by.id('pwdMismatch'));
    this.viewPwd = element(by.id('viewPwd'));
	this.changePwdButton = element(by.id('changePwdButton'));
    this.deleteAccountButton = element(by.id('deleteAccountButton'));
};

module.exports = MemslateUserPage;