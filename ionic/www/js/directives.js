/**
 * Created by gerard on 18/03/2015.
 */
"use strict";

angular.module('memslate.directives', ['ionic'])
    /*
     * This directive allows us to pass a function in on an enter key to do what
     * we want.
     */
    .directive('msEnterPressed', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.msEnterPressed);
                    });

                    event.preventDefault();
                }
            });
        };
    })

    /*
     * This directive allows us to pass a function in on an scroll event to do what we want.
     */
    .directive('msScrollTrigger', ['$parse', function ($parse) {
        return {
            scope: {
                onScrolled: '&'
            },
            link: function (scope, element, attrs) {
                var elem = element[0];
                var currPos = 0;
                var start = 0;

                element.bind('scroll', function (e) {
                    var pos = (elem.scrollTop + elem.offsetHeight) / elem.scrollHeight;
                    var dir = 'up';
                    if (elem.scrollTop >= start) {
                        dir = 'down';
                    }
                    start = elem.scrollTop;

                    if (pos != currPos) {
                        console.log('onscroll pos:' + pos);
                        scope.$apply(scope.onScrolled({pos: pos, dir: dir}));
                        currPos = pos;
                    }
                });
            }
        };
    }])

    /*
     * modal dialog based select
     */
    .directive("msSelect", function ($ionicModal) {
        return {
            restrict: 'E',
            templateUrl: '../templates/controls/ms-select.html',
            replace: true,
            scope: {
                items: '=',
                selectedItem: '=',
                id: '@',
                name: '@',
                title: '@'
            },
            controller: ['$scope', '$timeout', function ($scope, $timeout)
            {
                this.updateSelected = function (value) {
                    $scope.selectedValue = value;
                };
            }],
            controllerAs: 'selectCtrl',
            link: function ($scope, $elem, $attr,selectCtrl)
            {
                var selectScope=$scope.$new();
                selectScope.items=$scope.items;
                selectScope.selectedItem=$scope.selectedItem;
                selectScope.onSelected=function(value)
                {
                    $scope.selectedItem=value;
                    selectCtrl.modalSelect.hide();
                };

                $ionicModal.fromTemplateUrl('select-modal.html', {
                    scope: selectScope,
                    animation: 'slide-in-up'
                }).then(function(modal) {
                    selectCtrl.modalSelect = modal;
                });

                selectCtrl.getSelected=function()
                {
                    return objectFindByKey($scope.items,"value", $scope.selectedItem)['name'];
                };
                selectCtrl.openSelectModal=function() {
                    selectCtrl.modalSelect.show();
                };

                selectScope.$on('$destroy', function() {
                    selectCtrl.modalSelect.remove();
                });
            }
        };
    });
