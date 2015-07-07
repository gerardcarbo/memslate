"use strict";

var controllersMod = angular.module('memslate.controllers', ['memslate.services', 'ionic', 'formly']);

controllersMod.controller('AppCtrl', function ($scope, $timeout, $state, $ionicModal, $ionicPopup,
                                               RegistrationService, UserService, SessionService, UI)
{
    // Form data for the login modal
    this.init = function ()
    {
        $scope.loginData = {};
        $scope.registerData = {};

        $scope.memoSettings = SessionService.getObject('memoSettings');
        //$('#memoOrderWayMenu').addClass(memoSettings.orderWay == 'asc' ? 'ion-arrow-up-b':'ion-arrow-down-b')
    };

    this.init();

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

    $scope.stateIs = function(state)
    {
        return $state.is(state);
    }

    // Perform the login action when the user submits the login form
    $scope.doLogin = function(loginForm) {
        if (!loginForm.$valid)
        {
            UI.toast("Some data is not correct. Please, check it.");
            return false;
        }
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
                    content: login.err.data,
                    cssClass: 'loginFailedPopup'
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
        if (!registerForm.$valid)
        {
            UI.toast("Some data is not correct. Please, check it.");
            return false;
        }
        console.log('Doing register', $scope.registerData);
        if($scope.registerData.password !== $scope.registerData.password2)
        {
            $ionicPopup.alert({
                title: 'Registration Failed',
                content: 'Passwords does not match.',
                cssClass: 'registrationFailedPopup'
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
                    content: register.err.data,
                    cssClass: 'registrationFailedPopup'
                });
            }
        });
    };

    $scope.changeOrderWay = function($event)
    {
        var memoSettings = SessionService.getObject('memoSettings');
        if(memoSettings.orderWay == 'asc')
        {
            memoSettings.orderWay = 'desc';
            $($event.target).removeClass('ion-arrow-down-b');
            $($event.target).addClass('ion-arrow-up-b');
        }
        else
        {
            memoSettings.orderWay = 'asc';
            $($event.target).addClass('ion-arrow-down-b');
            $($event.target).removeClass('ion-arrow-up-b');
         }

        SessionService.putObject('memoSettings', memoSettings);
        MemoCtrl.reset();
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

controllersMod.controller('MemoSlideCtrl', function($scope)
{
    $scope.next = function() {
        $scope.$broadcast('memoSlideBox.nextSlide');
    };
    $scope.slideChanged = function(index) {
    };
});

controllersMod.controller('TranslateCtrl', function ($scope, UI, TranslateService, LanguagesService)
{
    var translateCtrl = this;
    this.options = {};
    this.swappingFrom = false;
    this.swappingTo = false;

    LanguagesService.getLanguages().then(function(languages)
    {
        console.log(languages);
        translateCtrl.languages = languages;
    });

    this.swapLanguages = function ()
    {
        translateCtrl.swappingFrom = translateCtrl.swappingTo = true;

        var fromLang = LanguagesService.languages.user.fromLang;
        var toLang = LanguagesService.languages.user.toLang;

        $("#btnSwap").transition({rotate: '+=180deg'}, 1000, 'in');

        $('#fromLang').children('b').fadeOut(500, function () {
            translateCtrl.languages.user.fromLang = toLang;
            $scope.$apply();
            $('#fromLang').children('b').fadeIn(500);
            translateCtrl.swappingFrom = false;
        });
        $('#toLang').children('b').fadeOut(500, function () {
            translateCtrl.languages.user.toLang = fromLang;
            $scope.$apply();
            $('#toLang').children('b').fadeIn(500);
            translateCtrl.swappingTo = false;
        });

        delete translateCtrl.translation;
    };

    this.translate = function ()
    {
        if (!this.textToTranslate || this.textToTranslate === "") {
            UI.toast("Please, specify a text to translate.");
            return;
        }
        var $inputs = $("#translateForm").find("input, select, button, textarea");
        $inputs.prop("disabled", true);

        this.translation = {};
        this.translation.error = null;
        this.translation.translating = true;

        TranslateService.translate(LanguagesService.languages.user.fromLang,
                                    LanguagesService.languages.user.toLang,
                                    this.textToTranslate)
            .then(function (data) //success
            {
                translateCtrl.translation = data;
            },
            function (data, status) //error
            {
                translateCtrl.translation.translating = false;
                translateCtrl.translation.error = data || "Unknown Error";

                UI.toast(translateCtrl.translation.error);

                // log the error to the console
                console.log("The following error occured: " + status);
            })
            .finally(function ()	//finally
            {
                $inputs.prop("disabled", false);
            });
    };

    this.reset = function()
    {
        translateCtrl.textToTranslate = undefined;
        translateCtrl.translation = undefined;

        LanguagesService.clearUserLanguages();
        LanguagesService.getUserLanguages().then(function(userLangs){
            translateCtrl.languages.user = userLangs;
        });
    };

    $scope.$watch('translateCtrl.languages.user.fromLang', function (newValue, oldValue)
    {
        if (!translateCtrl.swappingFrom && newValue !== oldValue && newValue === translateCtrl.languages.user.toLang) {
            UI.toast("From and to languages must be distinct");
            translateCtrl.languages.user.fromLang = oldValue;
        }
    });

    $scope.$watch('translateCtrl.languages.user.toLang', function (newValue, oldValue)
    {
        if (!translateCtrl.swappingTo && newValue !== oldValue && newValue === translateCtrl.languages.user.fromLang) {
            UI.toast("From and to languages must be distinct");
            translateCtrl.languages.user.toLang = oldValue;
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

controllersMod.controller('MemoFilterCtrl', function ($scope, $rootScope, $state, MemoFilterService, SessionService, LanguagesService)
{
    var self = this;

    this.formData = SessionService.getObject('memoFilterSettings');
    this.formFields = [
        {
            key: 'filterByString',
            type: 'checkbox',
            templateOptions: {label: 'Filter by String'}
        },
        {
            key: 'filterString',
            type: 'input',
            hideExpression: '!model.filterByString',
            templateOptions: {
                type: 'text',
                label: 'From Date',
                placeholder: 'enter a filter string ...',
                required: true
            }
        },
        {
            key: 'filterByDates',
            type: 'checkbox',
            templateOptions: {label: 'Filter by Dates'}
        },
        {
            key: 'filterDateFrom',
            type: 'memslateDate',
            hideExpression: '!model.filterByDates',
            templateOptions: {
                label: 'From Date',
                required: true
            }
        },
        {
            key: 'filterDateTo',
            type: 'memslateDate',
            hideExpression: '!model.filterByDates',
            templateOptions: {
                label: 'To Date',
                required: true
            }
        },
        {
            key: 'filterByLanguages',
            type: 'checkbox',
            templateOptions: {label: 'Filter by Languages'}
        },
        {
            key: 'filterFromLanguage',
            type: 'memslateSelect',
            hideExpression: '!model.filterByLanguages',
            templateOptions: {
                name: 'From',
                label: 'From Languate',
                options: []
            }
        },
        {
            key: 'filterToLanguage',
            type: 'memslateSelect',
            hideExpression: '!model.filterByLanguages',
            templateOptions: {
                name: 'To',
                label: 'To Language',
                options: []
            }
        },
    ];

    LanguagesService.getLanguages().then(function(languages)
    {
        console.log(languages);
        self.formFields[6].templateOptions.options = languages.items;
        self.formFields[7].templateOptions.options = languages.items;
        self.formFields[6].templateOptions.prefered = languages.user.prefered;
        self.formFields[7].templateOptions.prefered = languages.user.prefered;
    });

    self.onSubmit = function()
    {
        SessionService.putObject('memoFilterSettings', self.formData);
        $rootScope.$broadcast('ms:memoFilterSettingsUpdated');
        $state.go('app.memo', null, {location: 'replace'});
    };

    self.onCancel = function()
    {
        $state.go('app.memo', null, {location: 'replace'});
        self.formData = SessionService.getObject('memoFilterSettings');
    };
});

var MemoCtrl;

controllersMod.controller('MemoCtrl', function ($scope, SessionService, TranslateService)
{
    var self = this;
    MemoCtrl = this;

    self.init = function()
    {
        self.settings = SessionService.getObject('memoSettings');
        if(!self.settings)
        {
            self.settings = {};
            self.settings.limit = 10;
            self.settings.offset = 0;
            self.settings.orderWay = 'asc';

            SessionService.putObject('memoSettings', self.settings);
        }

        self.filterSettings = SessionService.getObject('memoFilterSettings');

        self.translations = [];
        self.moreDataAvailable = true;
        self.adding = false;
    };

    self.init();

    self.moreDataCanBeLoaded = function()
    {
        return self.moreDataAvailable;
    };

    self.addItems = function ()
    {
        if(self.adding)
        {
            console.log('addItems: already adding');
            return;
        }

        self.adding = true;

        var options = angular.extend({}, self.settings, self.filterSettings)

        console.log('addItems: getting items ', options);

        TranslateService.getTranslations(
            options,
            function (translations)
            {
                var newTranslations = translations.map(function (item)
                {
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

                self.settings.offset += 10;
                self.adding = false;

                console.log('addItems: adding items done');
            });
    };

    self.reset = function()
    {
        console.log('reset');
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

    $scope.$on('ms:memoFilterSettingsUpdated',function(){
        self.reset();
    });

});

controllersMod.controller('UserCtrl', function ($scope, $state, $ionicHistory, $ionicPopup, UserService, RegistrationService, UI) {
    this.User = UserService;

    this.deleteAccount = function()
    {
        $ionicPopup.confirm({
            title: 'Delete Account',
            content: 'Sure you want to delete your account?',
            cssClass: 'deleteAccountPopup'
        }).then(function (res)
        {
            if(res)
            {
                RegistrationService.unregister().then(function(res){
                    if(res.done)
                    {
                        UI.toast("Account Deleted");
                        $state.go('app.home', null, {location: 'replace'});
                    }
                    else
                    {
                        UI.toast("Failed do delete account: "+res.err.data);
                    }
                });
            }
        });
    }

    this.showChangePwd = function()
    {
        $('#showChangePwdButton').hide();
        $('#changePwdForm').show();
    };

    this.changePassword = function(changePwdForm)
    {
        if (!changePwdForm.$valid)
        {
            UI.toast("Some data is not correct. Please, check it.");
            return false;
        }
        if(this.newPwd !== this.newPwd2)
        {
            UI.toast("Passwords does not match. Please, check it.");
            return false;
        }

        RegistrationService.changePassword(this.oldPwd, this.newPwd).then(function(res) {
            if (res.done) {
                UI.toast("Password Changed");
            }
            else
            {
                UI.toast("Failed to change password: " + res.err.data);
            }
        });
    }
});

controllersMod.controller('PlayCtrl', function ($scope, UI, TranslateService, LanguagesService)
{

});

