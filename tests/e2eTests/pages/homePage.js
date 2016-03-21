"use strict";

var MemslateHomePage = function ()
{
    this.titles = {};
    this.titles.home = 'Memslate';
    this.titles.translate = 'Translate';
    this.titles.memo = 'Memo';
    this.titles.play = 'Play';
    this.titles.user = 'User';

    this.translateButton = element(by.id('translateButton'));
    this.memoButton = element(by.id('memoButton'));
    this.playButton = element(by.id('playButton'));

    this.get = function () {
        browser.get('http://localhost:5000/#/app/home');
    };

    this.getTitle = function () {
        return browser.getTitle();
    };
};

module.exports = MemslateHomePage;