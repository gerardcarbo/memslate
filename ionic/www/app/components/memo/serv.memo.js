(function () {
  "use strict";

  /**
   * Memo services
   */
  var servicesMod = angular.module('memslate.services');

  servicesMod.service("MemoGroupsSettingsService", function (SessionService) {
    this.get = function () {
      this._settings = {};
      this._settings.offset = 0;
      this._settings.limit = 1; //groups gotten

      return this._settings;
    };
  });

  servicesMod.service("MemoFilterSettingsService", function (SessionService,$rootScope) {
    var limit = 50; //translations gotten
    this.reset = function () {
      this._settings = {};
      this._settings.orderBy = 'Date';
      this._settings.orderWay = 'desc';
      this._settings.filterByString = false;
      this._settings.filterString = "";
      this._settings.filterByDates = false;
      this._settings.filterDateFrom = new Date().adjustDate(-7);
      this._settings.filterDateTo = new Date();
      this._settings.filterByLanguages = false;
      this._settings.filterFromLanguage = "";
      this._settings.filterToLanguage = "";
      this._settings.offset = 0;
      this._settings.limit = limit;

      SessionService.putObject('memoFilterSettings', this.data);
    };

    this.get = function () {
      this._settings = SessionService.getObject('memoFilterSettings');
      if (!this._settings) {
        this.reset();
      }
      if (!this._settings.offset) this._settings.offset = 0;
      if (!this._settings.limit) this._settings.limit = limit;

      if (this._settings.orderBy != 'Date' && this._settings.orderBy != 'Alpha' && this._settings.orderBy != 'Langs') {
        this._settings.orderBy = 'Date';
      }
      return this._settings;
    };

    this.getFiltered = function () {
      var settings = angular.copy(this.get());
      if (!settings.filterByString) {
        delete settings.filterByString;
        delete settings.filterString;
      }
      if (!settings.filterByDates) {
        delete settings.filterByDates;
        delete settings.filterDateFrom;
        delete settings.filterDateTo;
      }
      if (!settings.filterByLanguages) {
        delete settings.filterByLanguages;
        delete settings.filterFromLanguage;
        delete settings.filterToLanguage;
      }
      return settings;
    }

    this.getTranslationsFilter = function () {

      var settings = this.getFiltered();

      delete settings.offset;
      delete settings.limit;

      return settings;
    };

    this.getGroupsFilter = function () {

      var settings = this.getFiltered();

      delete settings.offset;
      delete settings.limit;
      delete settings.orderBy;
      delete settings.orderWay;

      return settings;
    };

    this.set = function (settings) {
      this._settings = SessionService.putObject('memoFilterSettings', settings);
      $rootScope.$broadcast('ms:memoFilterSettingsChanged')
    }
  });
})();
