"use strict";

var controllersMod = angular.module('memslate.controllers', ['memslate.services', 'ionic']);

controllersMod.controller('AppCtrl', function ($scope, $timeout, $ionicModal, $ionicPopup, RegistrationService, UserService)
{
    // Form data for the login modal
    $scope.loginData = {};
    $scope.registerData = {};

      // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.loginModal = modal;
    });

    // Create the register modal
    $ionicModal.fromTemplateUrl('templates/register.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.registerModal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
        $scope.loginModal.hide();
    };

    $scope.closeRegisterLogin = function() {
        $scope.registerModal.hide();
    };

    // Open the login modal
    $scope.login = function() {
        $scope.loginModal.show();
    };

    $scope.register = function() {
        $scope.registerModal.show();
    };

    $scope.openRegister = function() {
        $scope.loginModal.hide().then(function(){
            $scope.register();
        });
    };

    $scope.openLogin = function() {
        $scope.registerModal.hide().then(function(){
            $scope.login();
        });
    };

    $scope.userLoggedin = function()
    {
        return UserService.isAuthenticated();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function(loginForm) {
        if (!loginForm.$valid) { return false; }
        console.log('Doing login', $scope.loginData);
        RegistrationService.login($scope.loginData.email, $scope.loginData.password).then(function(login){
            if(login.done) {
                $scope.loginModal.hide();
                console.log('Login done!');
            }
            else
            {
                $ionicPopup.alert({
                    title: 'Login Failed',
                    content: login.err.data
                });
            }
        });
    };

    $scope.doLogout = function() {
        RegistrationService.logout();
    };

    $scope.isAuthenticated = function() {
        return UserService.isAuthenticated();
    };

    $scope.userName = function(){
        return UserService.name();
    };

    $scope.doRegister =  function(registerForm) {
        if (!registerForm.$valid) { return false; }
        console.log('Doing register', $scope.registerData);
        if($scope.registerData.password !== $scope.registerData.password2)
        {
            $ionicPopup.alert({
                title: 'Registration Failed',
                content: 'Passwords does not match.'
            });
            return null;
        }
        RegistrationService.register($scope.registerData).then(function(register) {
            if(register.done)
            {
                $scope.registerModal.hide();
                console.log('register done!');
            }
            else
            {
                $ionicPopup.alert({
                    title: 'Registration Failed',
                    content: register.err.data
                });
            }
        });
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.loginModal.remove();
        $scope.registerModal.remove();
    });

    // Execute action on hide modal
    $scope.$on('loginModal.hidden', function() {
    });
    $scope.$on('registerModal.hidden', function() {
    });
});

controllersMod.controller('TranslateCtrl', function ($scope, UI, TranslateService, LanguagesService)
{
    var translateCtrl = this;
    this.options = {};
    this.swappingFrom = false;
    this.swappingTo = false;

    LanguagesService.getLanguages().then(function(languages){
        console.log(languages);
        translateCtrl.languages = languages;
    });

    this.swapLanguages = function () {
        this.swappingFrom = this.swappingTo = true;

        var selectedFrom = LanguagesService.languages.selectedFrom;
        var selectedTo = LanguagesService.languages.selectedTo;

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
        if (!this.textToTranslate || this.textToTranslate === "") {
            UI.toast("Please, specify a text to translate.");
            return;
        }
        var $inputs = $("#translateForm").find("input, select, button, textarea");
        $inputs.prop("disabled", true);

        this.translation = {};
        this.translation.error = null;
        this.translation.translating = true;



        TranslateService.translate(LanguagesService.languages.selectedFrom,
                                    LanguagesService.languages.selectedTo,
                                    this.textToTranslate)
            .then(function (data) //success
            {
                LanguagesService.addPrefered(LanguagesService.languages.selectedFrom);
                LanguagesService.addPrefered(LanguagesService.languages.selectedTo);
                translateCtrl.translation = data;
            },
            function (data, status) //error
            {
                translateCtrl.translation.translating = false;
                translateCtrl.translation.error = data || "Unknown Error";

                // log the error to the console
                console.log("The following error occured: " + status);
            })
            .finally(function ()	//finally
            {
                $inputs.prop("disabled", false);
            });
    };

    this.reset = function(){
        translateCtrl.textToTranslate = undefined;
        translateCtrl.translation = undefined;

        LanguagesService.getUserLanguages().then(function(userLangs){
            translateCtrl.languages.selectedFrom = userLangs.fromLang;
            translateCtrl.languages.selectedTo = userLangs.toLang;
            translateCtrl.languages.prefered = userLangs.prefered;
        });
    };

    $scope.$watch('translateCtrl.languages.selectedFrom', function (newValue, oldValue) {
        if (!translateCtrl.swappingFrom && newValue !== oldValue && newValue === translateCtrl.languages.selectedTo) {
            UI.toast("From and to languages must be distinct", 2000);
            translateCtrl.languages.selectedFrom = oldValue;
        }
    });
    $scope.$watch('translateCtrl.languages.selectedTo', function (newValue, oldValue) {
        if (!translateCtrl.swappingTo && newValue !== oldValue && newValue === translateCtrl.languages.selectedFrom) {
            UI.toast("From and to languages must be distinct", 2000);
            translateCtrl.languages.selectedTo = oldValue;
        }
    });

    $scope.$on('ms:translationDeleted',function()
    {
        translateCtrl.reset();
    });

    $scope.$on('ms:login', function()
    {
        translateCtrl.reset();

    });

    $scope.$on('ms:logout', function()
    {
        translateCtrl.reset();
    });
});

controllersMod.controller('MemoCtrl', function ($scope, TranslateService) {
    var self = this;

    self.init = function(){
        self.translations = [];
        self.limit = 10;
        self.offset = 0;
        self.moreDataAvailable = true;
    };

    self.init();

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
                    try
                    {
                        item.rawResult = JSON.parse(item.rawResult);
                    }
                    catch(e){
                        console.log('exc parsing rawResult:' + item.rawResult);
                    }
                    item.insertTime = new Date(item.insertTime);
                    return item;
                });
                self.translations.push.apply(self.translations, newTranslations);
                console.log(self.translations);

                if (translations.length === 0)
                {
                    self.moreDataAvailable = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');

                self.offset += 10;

                console.log('adding items done');
            });
    };

    self.reset = function()
    {
        self.init();
        self.addItems();
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

    $scope.$on('ms:translationDeleted',function(event, data)
    {
        console.log('translationDeleted:' + data);
        angular.element("#memo_translation_div_" + data).remove();
        event.stopPropagation();
    });

    $scope.$on('ms:login',function(){
        self.reset();
    });

    $scope.$on('ms:logout',function(){
        self.reset();
    });

});

controllersMod.controller('UserCtrl', function ($scope, UserService) {
    this.User = UserService;
});
