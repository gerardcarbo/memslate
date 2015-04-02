"use strict";

var module = angular.module('memslate.controllers', ['memslate.services', 'ionic']);

module.controller('AppCtrl', function ($scope, $timeout) {
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
});

module.controller('TranslateCtrl', function ($scope, UI, TranslateService) {
    var translateCtrl = this;
    this.options = {};
    this.languages = {};
    this.languages.items = [{"value": "ca", "name": "Catalan"}, {"value": "es", "name": "Spanish"}, {
        "value": "en",
        "name": "English"
    }];
    this.languages.selectedFrom = 'es';
    this.languages.selectedTo = 'en';
    this.swappingFrom = false;
    this.swappingTo = false;

    this.swapLanguages = function () {
        this.swappingFrom = this.swappingTo = true;

        var selectedFrom = this.languages.selectedFrom;
        var selectedTo = this.languages.selectedTo;

        $("#btnSwap").transition({rotate: '+=180deg'}, 1000, 'in');

        $('#fromLang').children('b').fadeOut(500, function () {
            translateCtrl.languages.selectedFrom = selectedTo;
            $scope.$apply();
            $('#fromLang').children('b').fadeIn(500);
            translateCtrl.swappingFrom = false;
        });
        $('#toLang').children('b').fadeOut(500, function () {
            translateCtrl.languages.selectedTo = selectedFrom;
            $scope.$apply();
            $('#toLang').children('b').fadeIn(500);
            translateCtrl.swappingTo = false;
        });

        delete translateCtrl.translation;
        delete translateCtrl.textToTranslate;

    };

    this.translate = function () {
        if (this.textToTranslate == "") {
            UI.toast("Specify a text to translate.");
            return;
        }
        var $inputs = $("#translateForm").find("input, select, button, textarea");
        $inputs.prop("disabled", true);

        translateCtrl.translation = {};
        translateCtrl.translation.error = null;
        translateCtrl.translation.translating = true;

        TranslateService.translate(this.languages.selectedFrom, this.languages.selectedTo, this.textToTranslate)
            .then(
            function (data) //success
            {
                $("#translatedSamples").html("");
                $("#translatedSamples").hide();

                translateCtrl.translation = data;
                if (data.def && data.def.length > 0) //no error
                {
                    //return TranslateService.getTranslationSamples(translateCtrl.def.id);
                }
            },
            function (data, status, header, config) //error
            {
                translateCtrl.translation.translating = false;
                translateCtrl.translation.error = status || "Unknown Error";

                // log the error to the console
                console.log("The following error occured: " + status);
            })
            .then(function (data) //translations samples success
            {
                if (data) {
                    translateCtrl.def.samples = data.data;
                    $("#translatedSamples").show();
                }
            }
        )
            .finally(function ()	//finally
            {
                $inputs.prop("disabled", false);
            });
    };

    $scope.$watch('translateCtrl.languages.selectedFrom', function (newValue, oldValue) {
        if (!translateCtrl.swappingFrom && newValue != oldValue && newValue == translateCtrl.languages.selectedTo) {
            UI.toast("From and to languages must be distinct", 2000);
            translateCtrl.languages.selectedFrom = oldValue;
        }
    });
    $scope.$watch('translateCtrl.languages.selectedTo', function (newValue, oldValue) {
        if (!translateCtrl.swappingTo && newValue != oldValue && newValue == translateCtrl.languages.selectedFrom) {
            UI.toast("From and to languages must be distinct", 2000);
            translateCtrl.languages.selectedTo = oldValue;
        }
    });
});

module.controller('MemoCtrl', function ($scope, TranslateService) {
    var self = this;
    self.translations = [];
    self.limit = 10;
    self.offset = 0;
    self.moreDataAvailable = true;

    self.moreDataCanBeLoaded = function()
    {
        return self.moreDataAvailable;
    };

    self.addItems = function () {
        console.log('adding items ' + self.limit + ' ' + self.offset);
        TranslateService.getTranslations(
            {limit: self.limit, offset: self.offset},
            function (translations) {
                var newTranslations = translations.map(function (item) {
                    item.rawResult = JSON.parse(item.rawResult);
                    item.insertTime = new Date(item.insertTime);
                    return item;
                });
                self.translations.push.apply(self.translations, newTranslations);
                console.log(self.translations);

                if (translations.length == 0)
                {
                    self.moreDataAvailable=false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');

                self.offset += 10;

                console.log('adding items done');
            });
    };

    /*
     * if given group is the selected group, deselect it
     * else, select the given group
     */
    self.toggleTranslation = function (translation) {
        if (self.isTranslationShown(translation)) {
            self.shownTranslation = null;
        } else {
            self.shownTranslation = translation;
        }
    };
    self.isTranslationShown = function (translation) {
        return self.shownTranslation === translation;
    };

});

module.controller('TranslationCtrl', function ($scope, $stateParams, Translations) {
    this.translation = Translations.get({translationId: $stateParams.translationId});
});
