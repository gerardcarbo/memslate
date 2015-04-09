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

app.directive('msTranslation', ['TranslateService',function (TranslateService) {
    return {
        restrict: 'E',
        templateUrl: '../templates/widgets/ms-translation.html',
        scope: {
            translation: '='
        },
        controller: ['$scope', 'TranslationSampleRes', 'ModalDialogService','UI',
            function ($scope, TranslationSampleRes, ModalDialogService, UI) {

            this.saveTranslationSample = function () {
                if ($scope.translation.translate != undefined &&
                        this.translationSample.toUpperCase().indexOf($scope.translation.translate.toUpperCase()) == -1) {
                    if (this.translationSample != "") {
                        UI.toast("The translation sample must contain the translated word '" + $scope.translation.translate + "'...");
                    }
                    return;
                }

                var translationCtrl = this;
                var tsPr=TranslateService.addTranslationSample($scope.translation.id, this.translationSample)
                tsPr.then(function (data) {
                        if ($scope.translation.samples == undefined) {
                            $scope.translation.samples = [];
                        }
                        $scope.translation.samples.push(new TranslationSampleRes({id: data.id, translationId:$scope.translation.id, sample: translationCtrl.translationSample}));
                        translationCtrl.translationSample = "";
                    });
            };

            this.deleteTranslationSample = function (index, translationSample) {
                translationSample.$delete(function(){
                    $scope.translation.samples.splice(index, 1);
                });
            };

            this.deleteTranslation = function (id) {
                ModalDialogService.showYesNoModal("Delete Translation", "Do you really want to delete the translation '" + $scope.translation.translate + "' ?")
                    .then(function (res) {
                        if (res == 'yes') {
                            TranslateService.deleteTranslation(id).then(function(){
                                $scope.$emit('ms:translationDeleted', id);
                                $scope.translation = undefined;
                            });
                        }
                    });
            };
        }],
        controllerAs: 'msTranslationCtrl',
        link: function ($scope) {
            var scope=$scope;
            $scope.$watch('translation', function(translation)
            {
                if(translation && translation.id)
                {
                    TranslateService.getTranslationSamples(translation.id,function(samples){
                        scope.translation.samples=samples;
                    });
                }
            });
        }
    };
}]);