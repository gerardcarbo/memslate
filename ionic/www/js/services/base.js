(function() {
  "use strict";

  /**
   * Base services
   */
  var servicesMod = angular.module('memslate.services', ['ngCookies']);

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
      if (this._useLocalStorage) {
        return localStorage.getItem(key);
      }
      return $cookies[key];
    }

    this.getObject = function (key) {
      var obj = {};
      if (this._useLocalStorage) {
        obj = angular.fromJson(localStorage.getItem(key));
      }
      else {
        obj = angular.fromJson($cookies[key])
      }
      return msUtils.convertDateStringsToDates(obj);
    }

    this.put = function (key, value) {
      if (this._useLocalStorage) {
        localStorage.setItem(key, value);
        return;
      }
      $cookies[key] = value;
    }

    this.putObject = function (key, value) {
      if (this._useLocalStorage) {
        localStorage.setItem(key, angular.toJson(value));
        return;
      }
      $cookies[key] = angular.toJson(value);
    }

    this.remove = function (key) {
      if (this._useLocalStorage) {
        localStorage.removeItem(key);
        return;
      }
      $cookies[key] = null;
    }
  });

  servicesMod.service('BaseUrlService', function ($log, $http, $q, $rootScope, SessionService) {
    var self = this;
    this.connected = false;

    this.alternatives = ["https://memslate.herokuapp.com/", "http://localhost:5000/"];
    this.current = SessionService.get('currentBaseUrlIndex') || 0;

    this.test = function (url) {
      return $http.get(url + 'testConnection');
    };

    this.connect = function () {
      var deferred = $q.defer();

      angular.forEach(this.alternatives, function (alternative, index) {
        self.test(alternative).success(function () {
          if (!self.connected) {
            self.current = index;
            self.connected = true;
            SessionService.put('currentBaseUrlIndex', self.current);
            $log.log("BaseUrlService: connected to base url '" + alternative + "'");
            deferred.resolve(alternative);
          }
        });
      });

      return deferred.promise;
    };

    this.get = function () {
      return this.alternatives[this.current];
    }

    /* moved to app.js state 'app' resolve.
     this.connect().then(function(baseUrl){
     $log.log('then: connected to '+baseUrl);
     })*/
  });



})();
