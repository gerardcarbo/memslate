(function() {
  "use strict";

  /**
   * Graphical User Interface services
   */
  var servicesMod = angular.module('memslate.services.ui',['ionic']);

  servicesMod.service('UI', function ($rootScope, $window, $timeout, $animate, $ionicLoading, $ionicBody, $ionicPopup) {
    this.toast = function (msg, duration, position) {
      if (!duration) {
        duration = msConfig.toastShowTime;
      }
      if (!position) {
        position = 'top';
      }

      // PhoneGap? Use native:
      if ($window.plugins) {
        if ($window.plugins.toast) {
          $window.plugins.toast.show(msg, duration, position);
        }
        return;
      }

      // customized
      this._toast(msg, duration);
    };

    this._toast = function (message, timeout, cssClass) {
      timeout = timeout || 2000;
      cssClass = cssClass || 'notification_error';

      var toasts = document.getElementById('toasts');
      if (!toasts) {
        $ionicBody.append(angular.element('<div id="toasts-wrapper" class="flexbox-container"><div id="toasts"></div></div>'));
      }

      var $message = angular.element('<p class="toast animate-hide ms-hide" style="margin:5px auto">' + message + '</p>');

      var windowWait=300;
      angular.element(document.getElementById('toasts')).append($message);
      $message.addClass(cssClass);
      $animate.removeClass($message, 'ms-hide').then(function () {
        window.setTimeout(function () {   // if only $timeout is used ESE tests not working due to waitForAngular
                                          // does not allow to continue test and check toast
                                          // contents until all angular actions finishes (when the toast not exists).
          $timeout(function () {
            window.setTimeout(function () {
              $timeout(function () {
                $animate.addClass($message, 'ms-hide').then(function () {
                  $message.remove();
                });
              },0);
            },windowWait);
          }, timeout-(2*windowWait));
        }, windowWait);
      });
    };

    this.showOkCancelModal = function (title, msg) {
      return $ionicPopup.confirm({
        title: title,
        template: msg
      });
    };

    this.showAlert = function (title, msg) {
      return $ionicPopup.alert({
        title: title,
        template: msg
      });
    };
  });

})();
