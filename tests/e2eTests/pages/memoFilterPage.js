/**
 * Created by gerard on 25/05/2015.
 */
/**
 * Created by gerard on 25/05/2015.
 */
var MemslateFilterMemoPage = function()
{
    this.memoBackMenu = element(by.xpath('//*[@nav-bar="active"]//*[@id="memoFilterMenu"]'));

    this.get = function()
    {
        browser.get('http://localhost:5000/#/app/memoFilter');
    };
};

module.exports = MemslateFilterMemoPage;