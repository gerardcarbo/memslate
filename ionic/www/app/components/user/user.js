(function () {
  "use strict";

  angular.module('memslate')

    .component('msUser', {
      require: {
        user: '^msUserOperations'
      },
      templateUrl: "app/components/user/user.html",
      controllerAs: 'userCtrl',
      controller: function ($scope, $rootScope, $state, $animate,
                            $ionicHistory, $ionicPopup, $timeout,
                            UserStatusService, UserService, UI) {
        var self = this;

        this.UserStatistics = {};
        this.showingChangePwd = false;

        this.RefreshStatistics = function () {
          UserService.getStatistics().success(function (stats) {
            self.UserStatistics = stats;
          });
        };

        this.RefreshStatistics();

        console.log('UserCtrl: enter: ', $state);
        if ($state.params.param === 'changePwd') {
          this.showingChangePwd = true;
        }

        this.deleteAccount = function () {
          $ionicPopup.confirm({
            title: 'Delete Account',
            content: 'Sure you want to delete your account?',
            cssClass: 'deleteAccountPopup'
          }).then(function (res) {
            if (res) {
              UserService.unregister().then(function (res) {
                if (res.done) {
                  UI.toast("Account Deleted");
                  $ionicHistory.nextViewOptions({
                    disableBack: true
                  });
                  $state.go('app.home');
                }
                else {
                  UI.toast("Failed do delete account: " + res.err.data);
                }
              });
            }
          });
        };

        this.changePassword = function (changePwdForm) {
          if (!changePwdForm.$valid) {
            UI.toast("Some data is not correct. Please, check it.");
            return false;
          }
          if (this.newPwd !== this.newPwd2) {
            UI.toast("Passwords does not match. Please, check it.");
            return false;
          }

          UserService.changePassword(this.oldPwd, this.newPwd).then(function (res) {
            if (res.done) {
              self.showingChangePwd = false;
              self.oldPwd = self.newPwd = self.newPwd2 = "";
              changePwdForm.$setUntouched();
              changePwdForm.$setPristine();
              $timeout(function() {
                UI.toast("Password Changed");
              },1000);
            }
            else {
              UI.toast("Failed to change password: " + res.err.data);
            }
          });
        };

        $scope.$on('ms:login', self.RefreshStatistics);
        $scope.$on('ms:logout', self.RefreshStatistics);
      }
    })
})();
