(function () {
  "use strict";

  var servicesMod = angular.module('memslate.services');

  servicesMod.config(function ($httpProvider) {
    // Register middleware to ensure our auth token is passed to the server
    console.log("Config TokenInterceptor");
    $httpProvider.interceptors.push('TokenInterceptor');
  });

  /**
   * Authentication services
   */
  servicesMod.factory('TokenInterceptor', function ($q, $window, $location, UserStatusService) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        var withCredentials = (config.withCredentials != undefined ? config.withCredentials : true);
        if (UserStatusService.token() && withCredentials) {
          config.headers.Authorization = 'Bearer ' + UserStatusService.token();
        }
        return config;
      },

      requestError: function (rejection) {
        return $q.reject(rejection);
      },

      /* Set Authentication.isAuthenticated to true if 200 received */
      response: function (response) {
        if (response != null && response.status === 200 && UserStatusService.token() && !UserStatusService.isAuthenticated()) {
          UserStatusService.isAuthenticated(true);
        }
        var updated_token;
        if(updated_token = response.headers().updated_token)
        {
          console.log('response: update_token: ' + updated_token);
          UserStatusService.token(updated_token);
        }
        return response || $q.when(response);
      },

      /* Revoke client authentication if 401 is received */
      responseError: function (rejection) {
        if (rejection != null && rejection.status === 401 && (UserStatusService.token() || UserStatusService.isAuthenticated())) {
          UserStatusService.logout();
        }

        return $q.reject(rejection);
      }
    };
  });

  servicesMod.factory('UserStatusService', function ($window, $rootScope, SessionService) {
    var anonymousEmail = 'anonymous@memslate.com';
    var anonymousUser = 'Anonymous';

    if (!SessionService.get('name')) //user not already defined
    {
      SessionService.put('name', anonymousUser);
      SessionService.put('email', anonymousEmail);
      SessionService.put('isAuthenticated', false);
      SessionService.put('isAdmin', false);
      SessionService.put('tokenDisabled', false);
    }

    var UserStatusService = {
      isAuthenticated: function (val) {
        if (val !== undefined) {
          SessionService.put('isAuthenticated', val);
        }
        else {
          var autenticated=SessionService.get('isAuthenticated')
          return JSON.parse(autenticated);
        }
      },
      isAdmin: function (val) {
        if (val !== undefined) {
          SessionService.put('isAdmin', val);
        }
        else {
          return JSON.parse(SessionService.get('isAdmin'));
        }
      },
      name: function (val) {
        if (val !== undefined) {
          SessionService.put('name', val);
        }
        else {
          return SessionService.get('name');
        }
      },
      email: function (val) {
        if (val !== undefined) {
          SessionService.put('email', val);
        }
        else {
          return SessionService.get('email');
        }
      },
      token: function (val) {
        if (val !== undefined) {
          SessionService.put('token', val);
        }
        else {
          return SessionService.get('token');
        }
      },
      logout: function () {
        console.log('logout');
        SessionService.remove('token');
        SessionService.put('name', anonymousUser);
        SessionService.put('email', anonymousEmail);
        SessionService.put('isAdmin', false);
        SessionService.put('isAuthenticated', false);
        $rootScope.$broadcast('ms:logout')
      },
      login: function (usr) {
        console.log('login');
        SessionService.put('token', usr.token);
        SessionService.put('name', usr.name);
        SessionService.put('email', usr.email);
        SessionService.put('isAdmin', usr.isAdmin);
        SessionService.put('isAuthenticated', true);
        $rootScope.$broadcast('ms:login')
      }
    };

    return UserStatusService;
  });


  servicesMod.factory('UserService', function ($http, $rootScope, UserStatusService, BaseUrlService) {
    return {
      login: function (email, password) {
        return $http.post(BaseUrlService.get() + 'user/login', {
          email: email,
          password: password
        }).then(function (result) {
          UserStatusService.login(result.data);
          return {done: true};
        }).catch(function (err) {
          return {done: false, err: err};
        });
      },

      logout: function () {
        return $http.post(BaseUrlService.get() + 'user/logout').then(function (result) {
          return {done: true};
        }).catch(function (err) {
          return {done: false, err: err};
        }).finally(function () {
          UserStatusService.logout();
        });
      },

      register: function (user) {
        return $http.post(BaseUrlService.get() + 'user/register', user).then(function (result) {
          $rootScope.$broadcast('ms:register');
          UserStatusService.login(result.data);
          return {done: true};
        }).catch(function (err) {
          return {done: false, err: err};
        });
      },

      unregister: function () {
        return $http.post(BaseUrlService.get() + 'user/unregister')
          .then(function (result) {
            $rootScope.$broadcast('ms:unregister');
            UserStatusService.logout();
            return {done: true};
          })
          .catch(function (err) {
            return {done: false, err: err};
          });
      },

      changePassword: function (oldPwd, newPwd) {
        var data = {oldPwd: oldPwd, newPwd: newPwd};
        return $http.post(BaseUrlService.get() + 'user/changePwd', data)
          .then(function (result) {
            return {done: true};
          })
          .catch(function (err) {
            return {done: false, err: err};
          });
      },

      recoverPwd: function(email)
      {
        return $http.post(BaseUrlService.get() + 'user/recoverPwd', email)
          .then(function (result) {
            return;
          })
          .catch(function (err) {
            return err;
          });
      },

      getStatistics: function() {
        return $http.get(BaseUrlService.get() + 'user/statistics');
      }
    };
  });


})();
