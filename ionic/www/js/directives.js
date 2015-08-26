/**
 * Created by gerard on 18/03/2015.
 */
"use strict";

var app = angular.module('memslate.directives', ['memslate.services', 'ionic']);

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
 * modal dialog based select
 */
app.directive("msProgressbar", function ($ionicModal) {
    return {
        restrict: 'E',
        template: '<div id="progressbar"></div>',
        replace: true,
        scope: {
            max: '=',
            value: '=',
            type: '='
        },
        link: function ($scope) {
            $("#progressbar").progressbar({
                max:$scope.max,
                value: $scope.value,
                type: $scope.type
            });
        }
    };
});

/*
 * modal dialog based select
 */
app.directive("msSelect", function ($ionicModal) {
    return {
        restrict: 'E',
        templateUrl: 'templates/widgets/ms-select.html',
        replace: true,
        scope: {
            items: '=',
            selectedItem: '=?',
            preferedItems: '=',
            name: '@',
            selectorClass: '@selectorClass',
            title: '@'
        },
        link: function ($scope) {

            $scope.onSelected = function (value) {
                $scope.selectedItem = value;
                $scope.modalSelect.hide();
            };

            $scope.notPrefered = function (item) {
                if(!this.preferedItems) return true;
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
                var item = msUtils.objectFindByKey($scope.items, "value", value);
                return item && item.name;
            };

            $scope.getSelected = function () {
                return $scope.getName($scope.selectedItem);
            };
        }
    };
});

app.directive('msTranslation', ['TranslateService', function (TranslateService) {
    return {
        restrict: 'E',
        templateUrl: 'templates/widgets/ms-translation.html',
        replace: true,
        scope: {
            translation: '='
        },
        controller: function ($scope, TranslationSampleRes, ModalDialogService, UI, UserService) {
                this.isAuthenticated = function () {
                    console.log('isAuthenticated',UserService.isAuthenticated())
                    return UserService.isAuthenticated();
                }

            this.saveTranslationSample = function () {
                if ($scope.translation.translate !== undefined &&
                        this.translationSample.toUpperCase().indexOf($scope.translation.translate.toUpperCase()) === -1) {
                    if (this.translationSample !== "") {
                        UI.toast("The translation sample must contain the translated word '" + $scope.translation.translate + "'...");
                    }
                    return;
                }

                var translationCtrl = this;
                var tsPr = TranslateService.addTranslationSample($scope.translation.id, this.translationSample);
                tsPr.then(function (data) {
                        if ($scope.translation.samples === undefined) {
                            $scope.translation.samples = [];
                        }
                        $scope.translation.samples.push(new TranslationSampleRes({
                            id: data.id,
                            translationId: $scope.translation.id,
                            sample: translationCtrl.translationSample
                        }));
                        translationCtrl.translationSample = "";
                    });
            };

            this.deleteTranslationSample = function (index, translationSample) {
                translationSample.$delete(function(){
                    $scope.translation.samples.splice(index, 1);
                });
            };

            this.deleteTranslation = function (id) {
                    ModalDialogService.showOkCancelModal("Delete Translation", "Do you really want to delete the translation '" + $scope.translation.translate + "' ?")
                    .then(function (res) {
                            if (res === true) {
                                console.log('deleteTranslation', id);
                            TranslateService.deleteTranslation(id).then(function(){
                                    console.log('deleteTranslation: done for ', id);
                                $scope.$emit('ms:translationDeleted', id);
                                $scope.translation = undefined;
                            });
                        }
                    });
            };
            },
        controllerAs: 'msTranslationCtrl',
        link: function ($scope, element, attrs) {
            var scope = $scope;
            $scope.$watch('translation', function (translation) {
                if (translation && translation.rawResult) //full translation gotten
                {
                    /*
                    //to be used if template changes depending on the translation type
                    var data = $templateCache.get('templates/widgets/ms-translation.html');
                    element.html(data[1]);
                    $compile(element.contents())(scope);*/
                    TranslateService.getTranslationSamples(translation.id,function(samples){
                        scope.translation.samples = samples;
                    });
                }
            });
        }
    };
}]);


