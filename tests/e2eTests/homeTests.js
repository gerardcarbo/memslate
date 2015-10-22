'use strict';

var utils = require('../lib/testUtils.js');
var MainPage = require('./pages/mainPage.js');
var MemslateHomePage = require('./pages/homePage.js');

console.log('home tests....');

describe("Memslate Home Page and Basic navigation", function() 
{
	var homePage=new MemslateHomePage();
	var mainPage=new MainPage();

	beforeEach(function(){
		//var ptor = protractor.getInstance();
	    //ptor.ignoreSynchronization = true;   //<- for non angularjs sites
		homePage.get();
	});

	afterEach(function () {
		utils.LogConsoleAndTakeSnapshots(browser, jasmine);
	});
	
	it('Testing navigation', function()
    {
		browser.waitForAngular();

		expect(homePage.getTitle()).toEqual(homePage.titles.home);
		
		//main menu
		console.log('translateMenu.click...');
        mainPage.click();
        mainPage.translateMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.translate);

		console.log('memoMenu.click...');
        mainPage.click();
        mainPage.memoMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.memo);

		console.log('playMenu.click...');
        mainPage.click();
        mainPage.playMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.play);

		console.log('homeMenu.click...');
		browser.sleep(1000)
		mainPage.waitAndClick();
        mainPage.homeMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.home);

		//marketing area
		homePage.translateButton.click();
		browser.sleep(1000)
		expect(homePage.getTitle()).toEqual(homePage.titles.translate);
        mainPage.waitAndClick();
        mainPage.homeMenu.waitAndClick();
		
		homePage.memoButton.getLocation()
		.then(function (memoButtonLocation) 
		{
			browser.driver.executeScript("window.scrollTo(0, "+memoButtonLocation.y+");");

			homePage.memoButton.click();
			expect(homePage.getTitle()).toEqual(homePage.titles.memo);
			browser.sleep(1000)
			mainPage.waitAndClick();
            mainPage.homeMenu.waitAndClick();
			
			return homePage.playButton.getLocation();
		})
		.then(function (playButtonLocation)
		{
			browser.driver.executeScript("window.scrollTo(0, "+playButtonLocation.y+");");
			
			homePage.playButton.click();
			expect(homePage.getTitle()).toEqual(homePage.titles.play);		
		});
	});
});