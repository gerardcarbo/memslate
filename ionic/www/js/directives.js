/**
 * Created by gerard on 18/03/2015.
 */
"use strict";

var app = angular.module('memslate.directives', ['ionic']);

/*
 * This directive allows us to pass a function in on an enter key to do what
 * we want.
 */
app.directive('msEnterPressed', function () {
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
});

/*
 * This directive allows us to pass a function in on an scroll event to do what we want.
 */
app.directive('msScrollTrigger', ['$parse', function ($parse) {
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
}]);

/*
 * modal dialog based select
 */
app.directive("msSelect", function ($ionicModal) {
    return {
        restrict: 'E',
        templateUrl: '../templates/widgets/ms-select.html',
        replace: true,
        scope: {
            items: '=',
            selectedItem: '=',
            name: '@',
            title: '@'
        },
        link: function ($scope, $elem, $attr) {
            $scope.onSelected = function (value) {
                $scope.selectedItem = value;
                $scope.modalSelect.hide();
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

            $scope.getSelected = function () {
                return objectFindByKey($scope.items, "value", $scope.selectedItem)['name'];
            };

        }
    };
});

app.directive('msTranslation', function () {
    return {
        restrict: 'E',
        templateUrl: '../templates/widgets/ms-translation.html',
        scope: {
            translation: '='
        },
        controller: ['$scope', 'TranslateService', 'ModalDialogService', function ($scope, TranslateService, ModalDialogService) {
            this.deleteTranslationSample = function (index, id) {
                if (id == undefined) {
                    alert("id undefined");
                }
                TranslateService.deleteTranslationSample(id);
                $scope.translation.samples.splice(index, 1);
            };

            this.saveTranslationSample = function () {
                if ($scope.translation.txt != undefined && this.translationSample.toUpperCase().indexOf($scope.translation.txt.toUpperCase()) == -1) {
                    if (this.translationSample != "") {
                        msNotify("The translation sample must contain the translated word '" + $scope.translation.txt + "'...");
                    }
                    return;
                }

                var translationCtrl = this;
                TranslateService.addTranslationSample($scope.translation.id, this.translationSample)
                    .success(function (data) {
                        if ($scope.translation.samples == undefined) {
                            $scope.translation.samples = [];
                        }
                        $scope.translation.samples.push({id: data, user_sample: translationCtrl.translationSample});
                        translationCtrl.translationSample = "";
                    });
            };

            this.deleteTranslation = function (id) {
                ModalDialogService.showYesNoModal("Delete Translation", "Do you really want to delete the translation '" + $scope.translation.txt + "' ?")
                    .then(function (res) {
                        if (res == 'yes') {
                            TranslateService.deleteTranslation($scope.translation.id);

                            $scope.$emit('ms:translationDeleted', $scope.translation.id);
                            $scope.translation = undefined;
                        }
                    });
            };
        }],
        controllerAs: 'msTranslationCtrl'
    };
});