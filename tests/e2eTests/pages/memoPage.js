/**
 * Created by gerard on 25/05/2015.
 */
var MemslateMemoPage = function()
{
    this.memoFilterMenu = element(by.xpath('//*[@nav-bar="active"]//*[@id="memoFilterMenu"]'));
    this.memoOrderWayMenu = element(by.xpath('//*[@nav-bar="active"]//*[@id="memoOrderWayMenu"]'));
    this.memoList = element(by.id('memoList'));
    this.registerButton = element(by.id('registerButton'));
    
    this.get=function()
    {
        browser.get('http://localhost:5000/#/app/memo');
    };
};

module.exports = MemslateMemoPage;
