(function () {
  "use strict";

  var app = angular.module('memslate.directives');

  /*
   * modal dialog based select
   */
  app.directive("msSelect", function ($ionicModal) {
    return {
      restrict: 'E',
      templateUrl: 'app/components/widgets/ms-select.html',
      replace: true,
      scope: {
        items: '=',
        selectedItem: '=?',
        preferedItems: '=',
        name: '@',
        selectorClass: '@selectorClass',
        title: '@',
        unselectedText: '@'
      },
      link: function ($scope) {

        $scope.onSelected = function (value) {
          $scope.selectedItem = value;
          $scope.modalSelect.hide();
        };

        $scope.notPrefered = function (item) {
          if (!this.preferedItems) return true;
          return this.preferedItems.indexOf(item.value) === -1;
        };

        $ionicModal.fromTemplateUrl('select-modal.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function (modal) {
          $scope.modalSelect = modal;
        });

        $scope.openSelectModal = function () {
          $scope.modalSelect.show();
        };

        $scope.$on('$destroy', function () {
          $scope.modalSelect.remove();
        });

        $scope.getName = function (value) {
          if (!value) return $scope.unselectedText || null;
          var item = msUtils.objectFindByKey($scope.items, "value", value);
          if (item) return item.name;
          return undefined;
        };

        $scope.getSelected = function () {
          return $scope.getName($scope.selectedItem);
        };
      }
    };
  });
})();
