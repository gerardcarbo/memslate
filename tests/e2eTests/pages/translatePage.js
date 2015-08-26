var MemslateTranslatePage = function()
{
	this.fromLangSelect = element(by.id('fromLang'));
	this.toLangSelect = element(by.id('toLang'));
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

	this.selectLanguage = function(lang)
	{
		var langItem=element(by.xpath("//div[contains(concat(' ',normalize-space(@class),' '),' active ')]//label[input[@value='"+lang+"']]"));
		browser.executeScript(function () { arguments[0].scrollIntoView(); }, langItem.getWebElement());
		langItem.click();
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
		this.fromLangSelect.click();
		this.selectLanguage(fromLang);
		this.toLangSelect.click();
		this.selectLanguage(toLang);
    };
};

module.exports = MemslateTranslatePage;