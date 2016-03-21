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
		browser.waitForAngular();
	});

	afterEach(function () {
		utils.LogConsoleAndTakeSnapshots(browser, jasmine);
	});
	
	it('should navigate on this way', function()
    {
		expect(homePage.getTitle()).toEqual(homePage.titles.home);
		
		//main menu
		console.log('translateMenu.click...');
        mainPage.openMenu();
        mainPage.translateMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.translate);

		console.log('memoMenu.click...');
        mainPage.openMenu();
        mainPage.memoMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.memo);

		console.log('playMenu.click...');
        mainPage.openMenu();
        mainPage.playMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.play);

		console.log('homeMenu.click...');
		mainPage.openMenu();
        mainPage.homeMenu.waitAndClick();
		expect(homePage.getTitle()).toEqual(homePage.titles.home);

		//marketing area
		homePage.translateButton.click();
		expect(homePage.getTitle()).toEqual(homePage.titles.translate);
        mainPage.openMenu();
        mainPage.homeMenu.waitAndClick();
		
		homePage.memoButton.getLocation()
		.then(function (memoButtonLocation) 
		{
			browser.driver.executeScript("window.scrollTo(0, "+memoButtonLocation.y+");");

			homePage.memoButton.click();
			expect(homePage.getTitle()).toEqual(homePage.titles.memo);
			browser.sleep(1000)
			mainPage.openMenu();
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

	it("should keep last opened page", function(){
		console.log('translateMenu.click...');
		mainPage.openMenu();
		mainPage.translateMenu.waitAndClick();
		browser.refresh();
		expect(homePage.getTitle()).toEqual(homePage.titles.translate);

		console.log('memoMenu.click...');
		mainPage.openMenu();
		mainPage.memoMenu.waitAndClick();
		browser.refresh();
		expect(homePage.getTitle()).toEqual(homePage.titles.memo);

		console.log('playMenu.click...');
		mainPage.openMenu();
		mainPage.playMenu.waitAndClick();
		browser.refresh();
		expect(homePage.getTitle()).toEqual(homePage.titles.play);
	});
});