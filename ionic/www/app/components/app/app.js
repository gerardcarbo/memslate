(function () {
  "use strict";

  angular.module('memslate')

    .component('msApp',
      {
        templateUrl: "app/components/app/app.html",
        controllerAs: "msAppCtrl",
        controller: function ($scope, $rootScope, $timeout, $state,
                              $ionicModal, $ionicPopup, $cordovaSplashscreen,$ionicHistory,$ionicPopover,
                              UserService, UserStatusService, SessionService, UI, MemoFilterSettingsService) {
          var self = this;

          // Form data for the login modal
          self.init = function () {
            self.loginData = {};
            self.registerData = {};
            self.recoverData = {};
            self.inAction = false;
          };

          self.init();

          self.goBack = function() {
            $rootScope.$ionicGoBack();
          };

          $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope,
            //hideDelay: 1000,
          }).then(function(popover) {
            self.popover = popover;
          });

          // Create the login modal that we will use later
          $ionicModal.fromTemplateUrl('app/components/app/dialogs/login.html', {
            scope: $scope
          }).then(function (modal) {
            self.loginModal = modal;
          });

          // Create the register modal
          $ionicModal.fromTemplateUrl('app/components/app/dialogs/register.html', {
            scope: $scope
          }).then(function (modal) {
            self.registerModal = modal;
          });

          // Create the recover modal
          $ionicModal.fromTemplateUrl('app/components/app/dialogs/recoverPwd.html', {
            scope: $scope
          }).then(function (modal) {
            self.recoverModal = modal;
          });

          // Triggered in the login modal to close it
          self.closeLogin = function () {
            self.loginModal.hide();
          };

          self.closeRegisterLogin = function () {
            self.registerModal.hide();
          };

          self.closeRecover = function () {
            self.recoverModal.hide();
          };

          // Open the login modal
          self.login = function () {
            self.loginModal.show();
          };

          self.register = function () {
            self.registerModal.show();
          };

          self.recover = function () {
            self.recoverModal.show();
          };

          self.openRegister = function () {
            self.loginModal.hide().then(function () {
              self.register();
            });
          };

          self.openRegisterFromRecover = function () {
            self.recoverModal.hide().then(function () {
              self.register();
            });
          };

          self.openLogin = function () {
            self.registerModal.hide().then(function () {
              self.login();
            });
          };

          self.openRecover = function () {
            self.loginModal.hide().then(function () {
              self.recover();
            });
          };

          self.userLoggedin = function () {
            return UserStatusService.isAuthenticated();
          };

          self.stateIs = function (state) {
            return $state.is(state);
          };

          // Perform the login action when the user submits the login form
          self.doLogin = function (loginForm) {
            if (self.inAction) return;
            if (!loginForm.$valid) {
              UI.toast("Some data is not correct. Please, check it.");
              return false;
            }
            self.inAction = true;
            console.log('Doing login: ', self.loginData.email);
            UserService.login(self.loginData.email, self.loginData.password).then(function (login) {
              if (login.done) {
                self.loginModal.hide();
                loginForm.$setUntouched();
                loginForm.$setPristine();
                console.log('Login done!');
              }
              else {
                UI.toast("Login Failed: " + login.err.data);
              }
            }).finally(function () {
              self.loginData = {};
              self.inAction = false;
            });
          };

          self.doLogout = function () {
            UI.showOkCancelModal("Close Session", "Do you really want to sign out?'")
              .then(function (res) {
                if (res === true) {
                  UserService.logout();
                  $state.go('app.home', null, {location: 'replace'});
                }
              });
          };


          self.goHome = function()
          {
            $ionicHistory.nextViewOptions({disableBack: true});
            $state.go('app.home', null, {location: 'replace'});
          };

          self.isAuthenticated = function () {
            return UserStatusService.isAuthenticated();
          };

          self.userName = function () {
            return UserStatusService.name();
          };

          self.userEmail = function () {
            return UserStatusService.email();
          };

          self.doRegister = function (registerForm) {
            if (!registerForm.$valid) {
              UI.toast("Some data is not correct. Please, check it.");
              return false;
            }
            console.log('Doing register: ', self.registerData.email);
            if (self.registerData.password !== self.registerData.password2) {
              $ionicPopup.alert({
                title: 'Registration Failed',
                content: 'Passwords does not match.',
                cssClass: 'registrationFailedPopup'
              });
              return null;
            }
            UserService.register(self.registerData).then(function (register) {
              if (register.done) {
                self.registerModal.hide();
                self.registerData = {};
                registerForm.$setUntouched();
                registerForm.$setPristine();

                console.log('register done!');
              }
              else {
                $ionicPopup.alert({
                  title: 'Registration Failed',
                  content: register.err.data,
                  cssClass: 'registrationFailedPopup'
                });
              }
            });
          };

          self.doRecover = function (recoverForm) {
            if (!recoverForm.$valid) {
              UI.toast("Some data is not correct. Please, check it.");
              return false;
            }
            console.log('Doing recover: ', self.recoverData.email);

            UserService.recoverPwd(self.recoverData).then(function (error) {
              if (!error) {
                self.registerModal.hide();
                self.recoverData = {};
                recoverForm.$setUntouched();
                recoverForm.$setPristine();
                UI.toast('Password recovery mail send! please check your email... and change it, please', 4000);
                //$state.go('app.user', { param: 'changePwd' });
                console.log('recoverPwd done!');
                self.closeRecover();
              }
              else {
                console.log('recover failed', error)
                var content = error.data && error.data.errors ? error.data.errors[0].response : JSON.stringify(error.data);
                $ionicPopup.alert({
                  title: 'Password Recovery Failed',
                  content: content,
                  cssClass: 'registrationFailedPopup'
                });
              }
            });
          };

          self.getAlignTitle = function () {
            if (window.innerWidth > 360) return "center";
            return "left";
          };

          self.getOrderClass = function () {
            var memoSettings = MemoFilterSettingsService.get();
            if (!memoSettings || !memoSettings.orderWay) {
              memoSettings.orderWay = 'asc';
            }
            return (memoSettings.orderWay === 'asc' ? 'ion-arrow-down-b' : 'ion-arrow-up-b');
          };

          self.changeOrderWay = function ($event) {
            var memoSettings = MemoFilterSettingsService.get();
            if (memoSettings.orderWay == 'asc') {
              memoSettings.orderWay = 'desc';
              angular.element($event.target).removeClass('ion-arrow-down-b');
              angular.element($event.target).addClass('ion-arrow-up-b');
            }
            else {
              memoSettings.orderWay = 'asc';
              angular.element($event.target).addClass('ion-arrow-down-b');
              angular.element($event.target).removeClass('ion-arrow-up-b');
            }

            MemoFilterSettingsService.set(memoSettings);

            $rootScope.$broadcast('ms:changeOrderWay');
          };

          //Cleanup the modal when we're done with it!
          $scope.$on('$destroy', function () {
            self.loginModal.remove();
            self.registerModal.remove();
          });

          // Execute action on hide modal
          $scope.$on('loginModal.hidden', function () {
          });
          $scope.$on('registerModal.hidden', function () {
          });

          var splashscreenHidden = false;
          $scope.$on('$stateChangeSuccess', function () {
            if (!splashscreenHidden) {
              splashscreenHidden = true;
              $cordovaSplashscreen.hide();
            }
          });
        }
      })

})();
