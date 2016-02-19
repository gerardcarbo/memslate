var MsSelect = require('../widgets/ms-select');

var MemslateTranslatePage = function()
{
	this.fromLangElement = element(by.id('fromLang'));
	this.toLangElement = element(by.id('toLang'));
	this.swapLangs = element(by.id('swapLangsButton'));
	this.textToTranslate = element(by.id('textToTranslate'));
	this.errorTranslationDiv = element(by.cssClass('error_translation_div'));
	this.translationDiv = element(by.cssClass('translation_div'));
	this.translationYt = element(by.cssClass('translation_yt'));
	this.translationYd = element(by.cssClass('translation_yd'));
	this.translationSamples = element(by.cssClass('translation_samples'));
	this.btnTranslate = element(by.id('btnTranslate'));
	this.btnAddSample = element(by.id('btnAddSample'));
	this.sampleValue = element(by.id('sampleValue'));
    this.deleteTranslationButton = element(by.id('btnDelTranslation'));

    this.fromLangSelect = new MsSelect(this.fromLangElement);
    this.toLangSelect = new MsSelect(this.toLangElement);

	this.get=function()
	{
		browser.get('http://localhost:5000/#/app/translate');
	};
	
	this.translate = function(text)
	{
        var self=this;
		this.textToTranslate.clear();
		this.textToTranslate.sendKeys(text);
		this.btnTranslate.click();
		browser.wait(function() {
		       return self.translationDiv.isPresent();
		}, 5000);
		expect(this.translationDiv.isPresent()).toBeTruthy();
	};
	
	this.addSample = function(sample)
	{
		this.sampleValue.sendKeys(sample);
		this.btnAddSample.click();
		browser.waitForAngular();
	};

    this.swapLanguages=function()
    {
        this.swapLangs.click();
		browser.sleep(1200);
    };

    this.setLanguages=function(fromLang, toLang)
    {
		this.toLangSelect.selectItem('bs');  //make sure toLang does not colides with fromLang

		this.fromLangSelect.selectItem(fromLang);
		this.toLangSelect.selectItem(toLang);
    };
};

module.exports = MemslateTranslatePage;