(function() {
  "use strict";

  /**
   * Memo services
   */
  var servicesMod = angular.module('memslate.services');

  servicesMod.service("MemoSettingsService", function ($resource, BaseUrlService, SessionService){
    this.reset = function()
    {
      this.memoFilterSettings = {};
      this.memoFilterSettings.orderBy = 'Translations.translate,Translations.mainResult';
      this.memoFilterSettings.filterByString = false;
      this.memoFilterSettings.filterByDates = false;
      this.memoFilterSettings.filterByLanguages = false;
      this.memoFilterSettings.filterString = "";
      this.memoFilterSettings.filterDateFrom = new Date().adjustDate(-7);
      this.memoFilterSettings.filterDateTo = new Date();

      SessionService.putObject('memoFilterSettings',this.memoFilterSettings);
    };

    this.memoFilterSettings = SessionService.getObject('memoFilterSettings');
    if (this.memoFilterSettings === null)
    {
      this.reset();
    }
  });
})();
