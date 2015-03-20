"use strict";

angular.module('memslate.controllers', ['memslate.services','ionic'])
    
    .controller('AppCtrl', function ($scope, $timeout) {
        // Form data for the login modal
        $scope.loginData = {};

        // Triggered in the login modal to close it
        $scope.closeLogin = function () {
            $scope.modal.hide();
        };

        // Open the login modal
        $scope.login = function () {
            $scope.modal.show();
        };

        // Perform the login action when the user submits the login form
        $scope.doLogin = function () {
            console.log('Doing login', $scope.loginData);

            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function () {
                $scope.closeLogin();
            }, 1000);
        };
    })

    .controller('TranslateCtrl', function ($scope) {
        var translateCtrl=this;
        this.options={};
        this.languages={};
        this.languages.items=[{"value":"ca*","name":"Catalan"},{"value":"es*","name":"Spanish"},{"value":"en*","name":"English"}];
        this.languages.selectedFrom='ca*';
        this.languages.selectedTo='en*';

        this.getFromLanguage=function()
        {
            return objectFindByKey(this.languages.items,"value", this.languages.selectedFrom)['name'];
        }
        this.getToLanguage=function()
        {
            return objectFindByKey(this.languages.items,"value", this.languages.selectedTo)['name'];
        }
        this.swapLanguages=function()
        {
            var aux=this.languages.selectedFrom;
            this.languages.selectedFrom=this.languages.selectedTo;
            this.languages.selectedTo=aux;

            angular.element(document.getElementById("btnSwap")).toggleClass("image_rotator");
        };

    })

    .controller('TranslationsCtrl', function ($scope, Translations) {
        this.translations = Translations.query();
    })

    .controller('TranslationCtrl', function ($scope, $stateParams, Translations) {
        this.translation = Translations.get({translationId: $stateParams.translationId});
    });
