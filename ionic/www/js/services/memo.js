(function () {
  "use strict";

  /**
   * Memo services
   */
  var servicesMod = angular.module('memslate.services');

  servicesMod.service("MemoSettingsService", function ($resource, BaseUrlService, SessionService) {
    this.reset = function () {
      this._settings = {};
      this._settings.orderBy = 'UserTranslations.userTranslationInsertTime';
      this._settings.orderWay = 'desc';
      this._settings.filterByString = false;
      this._settings.filterByDates = false;
      this._settings.filterByLanguages = false;
      this._settings.filterString = "";
      this._settings.filterDateFrom = new Date().adjustDate(-7);
      this._settings.filterDateTo = new Date();

      SessionService.putObject('memoFilterSettings', this.data);
    };

    this.get = function () {
      this._settings = SessionService.getObject('memoFilterSettings');
      if (!this._settings) {
        this.reset();
      }
      return this._settings;
    };

    this.set = function (settings) {
      this._settings = SessionService.putObject('memoFilterSettings', settings);
      return this._settings;
    }
  });
})();
