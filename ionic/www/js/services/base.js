(function() {
  "use strict";

  /**
   * Base services
   */
  var servicesMod = angular.module('memslate.services', ['ngCookies', 'ngResource']);

  servicesMod.config(function ($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
    //Remove the header used to identify ajax call  that would prevent CORS from working
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  });

  servicesMod.service('SessionService', function ($log, $cookies) {
    this._useLocalStorage = false;
    if (typeof(Storage) !== "undefined") {
      // localStorage defined.
      this._useLocalStorage = true;
      $log.log('SessionService: using local storage');
    }

    this.get = function (key) {
      var value;
      if (this._useLocalStorage) {
        value = localStorage.getItem(key);
      }
      else
      {
        value = $cookies[key];
      }
      if(value === null || value === 'undefined')
      {
        value = undefined;
      }
      return value;
    };

    this._buildObject = function(data)
    {
      if(data == "null" || data == "undefined" || data == null || data == undefined)
      {
        return undefined;
      }
      return angular.fromJson(data);
    };

    this.getObject = function (key) {
      var value = "";
      if (this._useLocalStorage) {
        value = localStorage.getItem(key);
      }
      else {
        value = $cookies[key];
      }
      //console.log('getObject('+key+'): '+value);
      var obj = this._buildObject(value);
      return msUtils.convertDateStringsToDates(obj);
    };

    this.put = function (key, value) {
      if (this._useLocalStorage) {
        localStorage.setItem(key, value);
        return;
      }
      $cookies[key] = value;
    };

    this.putObject = function (key, value) {
      if (this._useLocalStorage) {
        localStorage.setItem(key, angular.toJson(value));
        return value;
      }
      $cookies[key] = angular.toJson(value);
      return value;
    };

    this.remove = function (key) {
      if (this._useLocalStorage) {
        localStorage.removeItem(key);
        return;
      }
      $cookies[key] = null;
    };
  });

  servicesMod.service('BaseUrlService', function ($log, $http, $q, $rootScope, SessionService) {
    var self = this;
    this.connected = false;

    this.alternatives = ["http://www.memslate.com/", "http://localhost:5000/"];
    this.current = SessionService.get('currentBaseUrlIndex') || 0;

    this._connect = function (url) {
      return $http.get(url + 'connect');
    };

    this.connect = function () {
      var deferred = $q.defer();

      angular.forEach(this.alternatives, function (alternative, index) {
        self._connect(alternative).success(function () {
          if (!self.connected) {
            self.current = index;
            self.connected = true;
            SessionService.put('currentBaseUrlIndex', self.current);
            $log.log("BaseUrlService: connected to base url '" + alternative + "'");
            deferred.resolve(alternative);
            $rootScope.$broadcast('ms:connected');
          }
        });
      });

      return deferred.promise;
    };

    this.get = function () {
      return msConfig.baseUrl; //currently returning fixed url
    }
  });

})();
