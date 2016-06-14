(function () {
  "use strict";

  angular.module('memslate')

    .component('msUserOperations', {
      controllerAs: 'msUserCtrl',
      template: '',
      controller: function ($scope, $state, $ionicModal, $ionicPopover, $ionicPopup,
                            UI, UserService, UserStatusService) {
        var self = this;

        // Form data for the login modal
        this.init = function () {
          this.loginData = {};
          this.registerData = {};
          this.recoverData = {};
          this.inAction = false;
        };

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
        this.closeLogin = function () {
          this.loginModal.hide();
        };

        this.closeRegisterLogin = function () {
          this.registerModal.hide();
        };

        this.closeRecover = function () {
          this.recoverModal.hide();
        };

        // Open the login modal
        this.login = function () {
          this.loginModal.show();
        };

        this.register = function () {
          this.registerModal.show();
        };

        this.recover = function () {
          this.recoverModal.show();
        };

        this.openRegister = function () {
          this.loginModal.hide().then(function () {
            self.register();
          });
        };

        this.openRegisterFromRecover = function () {
          this.recoverModal.hide().then(function () {
            self.register();
          });
        };

        this.openLogin = function () {
          this.registerModal.hide().then(function () {
            self.login();
          });
        };

        this.openRecover = function () {
          this.loginModal.hide().then(function () {
            self.recover();
          });
        };

        this.doRegister = function (registerForm) {
          if (!registerForm.$valid) {
            UI.toast("Some data is not correct. Please, check it.");
            return false;
          }
          console.log('Doing register: ', this.registerData.email);
          if (this.registerData.password !== this.registerData.password2) {
            $ionicPopup.alert({
              title: 'Registration Failed',
              content: 'Passwords does not match.',
              cssClass: 'registrationFailedPopup'
            });
            return null;
          }
          UserService.register(this.registerData).then(function (register) {
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

        this.doRecover = function (recoverForm) {
          if (!recoverForm.$valid) {
            UI.toast("Some data is not correct. Please, check it.");
            return false;
          }
          console.log('Doing recover: ', this.recoverData.email);

          UserService.recoverPwd(this.recoverData).then(function (error) {
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

        // Perform the login action when the user submits the login form
        this.doLogin = function (loginForm) {
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
              self.loginData = {};
              console.log('Login done!');
            }
            else {
              UI.toast("Login Failed: " + login.err.data);
              self.loginData.password = "";
              loginForm.$setUntouched();
              loginForm.$setPristine();
            }
          }).finally(function () {
            self.inAction = false;
          });
        };

        this.doLogout = function () {
          UI.showOkCancelModal("Close Session", "Do you really want to sign out?'")
            .then(function (res) {
              if (res === true) {
                UserService.logout();
                $state.go('app.home', null, {location: 'replace'});
              }
            });
        };

        this.isAuthenticated = function () {
          return UserStatusService.isAuthenticated();
        };

        this.isAdmin = function () {
          return UserStatusService.isAdmin();
        };

        this.userName = function () {
          return UserStatusService.name();
        };

        this.userEmail = function () {
          return UserStatusService.email();
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

        this.init();
      }
    })


    .component('msApp',
      {
        templateUrl: "app/components/app/app.html",
        controllerAs: "msAppCtrl",
        require: {
          user: '^msUserOperations'
        },
        controller: function ($scope, $rootScope, $timeout, $state,
                              $ionicModal, $ionicPopup, $cordovaSplashscreen, $ionicHistory, $ionicPopover,
                              UserService, UI, MemoFilterSettingsService) {
          var self = this;

          $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope,
            //hideDelay: 1000,
          }).then(function (popover) {
            self.popover = popover;
          });

          self.goBack = function () {
            $rootScope.$ionicGoBack();
          };

          self.stateIs = function (state) {
            return $state.is(state);
          };

          self.goHome = function () {
            $ionicHistory.nextViewOptions({disableBack: true});
            $state.go('app.home', null, {location: 'replace'});
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
        }
      })

})();
