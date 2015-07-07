/**
 * Created by gerard on 25/05/2015.
 */
var MemslateMemoPage = function()
{
    this.memoFilterMenu = element(by.xpath('//*[@nav-bar="active"]//*[@id="memoFilterMenu"]'));

    this.get=function()
    {
        browser.get('http://localhost:5000/#/app/memo');
    };
};

module.exports = MemslateMemoPage;
