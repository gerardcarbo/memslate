(function () {
  "use strict";

  var servicesMod = angular.module('memslate.services.authenticate', ['memslate.services']);
  /**
   * Authentication services
   */
  servicesMod.factory('UserService', function ($window, $log) {
    var anonymousEmail = 'anonymous@memslate.com';
    var anonymousUser = 'Anonymous';

    if (!$window.sessionStorage.name) //user not already defined
    {
      $window.sessionStorage.name = anonymousUser;
      $window.sessionStorage.email = anonymousEmail;
      $window.sessionStorage.isAuthenticated = "false";
      $window.sessionStorage.isAdmin = "false";
      $window.sessionStorage.tokenDisabled = "false";
    }

    var userService = {
      isAuthenticated: function (val) {
        if (val !== undefined) {
          $window.sessionStorage.isAuthenticated = val;
        }
        else {
          return JSON.parse($window.sessionStorage.isAuthenticated);
        }
      },
      isAdmin: function (val) {
        if (val !== undefined) {
          $window.sessionStorage.isAdmin = val;
        }
        else {
          return JSON.parse($window.sessionStorage.isAdmin);
        }
      },
      name: function (val) {
        if (val !== undefined) {
          $window.sessionStorage.name = val;
        }
        else {
          return $window.sessionStorage.name;
        }
      },
      email: function (val) {
        if (val !== undefined) {
          $window.sessionStorage.email = val;
        }
        else {
          return $window.sessionStorage.email;
        }
      },
      token: function (val) {
        if (val !== undefined) {
          $window.sessionStorage.token = val;
        }
        else {
          return $window.sessionStorage.token;
        }
      },
      logout: function () {
        $log.log('logout');
        delete $window.sessionStorage.token;
        $window.sessionStorage.name = anonymousUser;
        $window.sessionStorage.email = anonymousEmail;
        $window.sessionStorage.isAdmin = false;
        $window.sessionStorage.isAuthenticated = false;
      },
      login: function (usr) {
        $log.log('login');
        $window.sessionStorage.token = usr.token;
        $window.sessionStorage.name = usr.name;
        $window.sessionStorage.email = usr.email;
        $window.sessionStorage.isAdmin = usr.isAdmin;
        $window.sessionStorage.isAuthenticated = true;
      }
    };

    return userService;
  });

  servicesMod.factory('TokenInterceptor', function ($q, $window, $location, UserService) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        var withCredentials = (config.withCredentials != undefined ? config.withCredentials : true);
        if (UserService.token() && withCredentials) {
          config.headers.Authorization = 'Bearer ' + UserService.token();
        }
        return config;
      },

      requestError: function (rejection) {
        return $q.reject(rejection);
      },

      /* Set Authentication.isAuthenticated to true if 200 received */
      response: function (response) {
        if (response != null && response.status === 200 && UserService.token() && !UserService.isAuthenticated()) {
          UserService.isAuthenticated(true);
        }
        return response || $q.when(response);
      },

      /* Revoke client authentication if 401 is received */
      responseError: function (rejection) {
        if (rejection != null && rejection.status === 401 && (UserService.token() || UserService.isAuthenticated())) {
          UserService.logout();
        }

        return $q.reject(rejection);
      }
    };
  });

  servicesMod.factory('RegistrationService', function ($http, $rootScope, UserService, BaseUrlService) {
    return {
      login: function (email, password) {
        return $http.post(BaseUrlService.get() + 'login', {
          email: email,
          password: password
        }).then(function (result) {
          UserService.login(result.data);

          $rootScope.$broadcast('ms:login');

          return {done: true};
        }).catch(function (err) {
          return {done: false, err: err};
        });
      },

      logout: function () {
        ;
        return $http.post(BaseUrlService.get() + 'logout').then(function (result) {
          return {done: true};
        }).catch(function (err) {
          return {done: false, err: err};
        }).finally(function () {
          UserService.logout();
          $rootScope.$broadcast('ms:logout')
        });
      },

      register: function (user) {
        return $http.post(BaseUrlService.get() + 'register', user).then(function (result) {
          UserService.login(result.data);

          $rootScope.$broadcast('ms:register');
          $rootScope.$broadcast('ms:login');

          return {done: true};
        }).catch(function (err) {
          return {done: false, err: err};
        });
      },

      unregister: function () {
        return $http.post(BaseUrlService.get() + 'unregister')
          .then(function (result) {
            $rootScope.$broadcast('ms:unregister');
            UserService.logout();

            return {done: true};
          })
          .catch(function (err) {
            return {done: false, err: err};
          });
      },

      changePassword: function (oldPwd, newPwd) {
        var data = {oldPwd: oldPwd, newPwd: newPwd};
        return $http.post(BaseUrlService.get() + 'changePwd', data)
          .then(function (result) {
            return {done: true};
          })
          .catch(function (err) {
            return {done: false, err: err};
          });
      }
    };
  });
})();
