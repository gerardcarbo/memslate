/**
 * Created by gerard on 02/09/2015.
 */
var MemslatePlayPage = function() {
    this.basicTestButton = element(by.id('basic-test-button'));

    this.get=function()
    {
        browser.get('http://localhost:5000/#/app/play');
    };
};

module.exports = MemslatePlayPage;
