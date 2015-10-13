/**
 * Created by gerard on 25/05/2015.
 */
/**
 * Created by gerard on 25/05/2015.
 */
var MemslateFilterMemoPage = function()
{
    this.memoBackMenu = element(by.xpath('          //*[@nav-bar="active"]//button[contains(concat(" ",normalize-space(@class)," ")," back-button ")]'));;
    this.filterByStringCheck = element(by.xpath(        '//*[contains(@id,"checkbox_filterByString")]'));
    this.filterByStringCheckInput = element(by.xpath(   '//*[contains(@id,"checkbox_filterByString")]/div[1]/input'));
    this.filterByDatesCheck = element(by.xpath(         '//*[contains(@id,"checkbox_filterByDates")]'));
    this.filterByDatesCheckInput = element(by.xpath(    '//*[contains(@id,"checkbox_filterByDates")]/div[1]/input'));
    this.filterByLanguagesCheck = element(by.xpath(     '//*[contains(@id,"checkbox_filterByLanguages")]'));
    this.filterByLanguagesCheckInput = element(by.xpath('//*[contains(@id,"checkbox_filterByLanguages")]/div[1]/input'));
    this.filterString = element(by.xpath(               '//*[contains(@id,"input_filterString")]'));
    this.filterDateFrom = element(by.xpath(             '//*[contains(@id,"memslateDate_filterDateFrom")]'));
    this.filterDateTo = element(by.xpath(               '//*[contains(@id,"memslateDate_filterDateTo"])'));
    this.filterMemoDoneButton = element(by.id('filterMemoDone'));
    this.filterMemoCancelButton = element(by.id('filterMemoCancel'));
    this.orderBySelect = element(by.id('orderBySelect'));

    this.get = function()
    {
        browser.get('http://localhost:5000/#/app/memoFilter');
    };

    this.reset = function() {
        return browser.executeAsyncScript(function(callback) {
            var MemoSettingsService = angular.element(document.body).injector().get('MemoSettingsService');
            MemoSettingsService.reset();
            callback();
        });
    };
};

module.exports = MemslateFilterMemoPage;