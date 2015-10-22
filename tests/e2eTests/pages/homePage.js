"use strict";

var MemslateHomePage = function ()
{
    this.titles = {};
    this.titles.home = 'Memslate';
    this.titles.translate = 'Memslate > Translate';
    this.titles.memo = 'Memslate > Memo';
    this.titles.play = 'Memslate > Play';
    this.titles.user = 'Memslate > User';

    this.translateButton = element(by.id('translateButton'));
    this.memoButton = element(by.id('memoButton'));
    this.playButton = element(by.id('playButton'));

    this.get = function () {
        browser.get('http://localhost:5000');
    };

    this.getTitle = function () {
        return browser.getTitle();
    };
};

module.exports = MemslateHomePage;