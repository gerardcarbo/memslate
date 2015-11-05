(function () {
  "use strict";

  var controllersMod = angular.module('memslate.controllers', ['ionic', 'ngCordova', 'formly', 'oc.lazyLoad',
    'memslate.services', 'memslate.services.translate', 'memslate.services.authenticate', 'memslate.services.ui']);

  controllersMod.controller('AppCtrl', function ($scope, $rootScope, $timeout, $state, $ionicModal, $ionicPopup,
                                                 $cordovaSplashscreen,
                                                 RegistrationService, UserService, SessionService, UI, MemoSettingsService) {
    // Form data for the login modal
    this.init = function () {
      $scope.loginData = {};
      $scope.registerData = {};
      $scope.recoverData = {};
      $scope.inAction = false;
    };

    this.init();

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.loginModal = modal;
    });

    // Create the register modal
    $ionicModal.fromTemplateUrl('templates/register.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.registerModal = modal;
    });

    // Create the register modal
    $ionicModal.fromTemplateUrl('templates/recoverPwd.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.recoverModal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
      $scope.loginModal.hide();
    };

    $scope.closeRegisterLogin = function () {
      $scope.registerModal.hide();
    };

    $scope.closeRecover = function () {
      $scope.recoverModal.hide();
    };

    // Open the login modal
    $scope.login = function () {
      $scope.loginModal.show();
    };

    $scope.register = function () {
      $scope.registerModal.show();
    };

    $scope.recover = function () {
      $scope.recoverModal.show();
    };

    $scope.openRegister = function () {
      $scope.loginModal.hide().then(function () {
        $scope.register();
      });
    };

    $scope.openRegisterFromRecover = function () {
      $scope.recoverModal.hide().then(function () {
        $scope.register();
      });
    };

    $scope.openLogin = function () {
      $scope.registerModal.hide().then(function () {
        $scope.login();
      });
    };

    $scope.openRecover = function () {
      $scope.loginModal.hide().then(function () {
        $scope.recover();
      });
    };

    $scope.userLoggedin = function () {
      return UserService.isAuthenticated();
    };

    $scope.stateIs = function (state) {
      return $state.is(state);
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function (loginForm) {
      if ($scope.inAction) return;
      if (!loginForm.$valid) {
        UI.toast("Some data is not correct. Please, check it.");
        return false;
      }
      $scope.inAction = true;
      console.log('Doing login: ', $scope.loginData.email);
      RegistrationService.login($scope.loginData.email, $scope.loginData.password).then(function (login) {
        if (login.done) {
          $scope.loginModal.hide();
          $scope.loginData.email = $scope.loginData.password = "";
          console.log('Login done!');
        }
        else {
          UI.toast("Login Failed: " + login.err.data);
        }
      }).finally(function () {
        $scope.inAction = false;
      });
    };

    $scope.doLogout = function () {
      UI.showOkCancelModal("Close Session", "Do you really want to logout?'")
        .then(function (res) {
          if (res === true) {
            RegistrationService.logout();
          }
        });
    };

    $scope.isAuthenticated = function () {
      return UserService.isAuthenticated();
    };

    $scope.userName = function () {
      return UserService.name();
    };

    $scope.doRegister = function (registerForm) {
      if (!registerForm.$valid) {
        UI.toast("Some data is not correct. Please, check it.");
        return false;
      }
      console.log('Doing register: ', $scope.registerData.email);
      if ($scope.registerData.password !== $scope.registerData.password2) {
        $ionicPopup.alert({
          title: 'Registration Failed',
          content: 'Passwords does not match.',
          cssClass: 'registrationFailedPopup'
        });
        return null;
      }
      RegistrationService.register($scope.registerData).then(function (register) {
        if (register.done) {
          $scope.registerModal.hide();
          console.log('register done!');
        }
        else {
          $ionicPopup.alert({
            title: 'Registration Failed',
            content: register.err.data,
            cssClass: 'registrationFailedPopup'
          });
        }
      });
    };

    $scope.doRecover = function(recoverForm)
    {
      if (!recoverForm.$valid) {
        UI.toast("Some data is not correct. Please, check it.");
        return false;
      }
      console.log('Doing recover: ', $scope.recoverData.email);

      RegistrationService.recoverPwd($scope.recoverData).then(function (error) {
        if (!error) {
          $scope.registerModal.hide();
          UI.toast('Password recovery mail send! please check your email... and change it, please',4000);
          //$state.go('app.user', { param: 'changePwd' });
          console.log('recoverPwd done!');
          $scope.closeRecover();
        }
        else {
            console.log('recover failed',error)
          var content = error.data && error.data.errors ?  error.data.errors[0].response : JSON.stringify(error.data);
          $ionicPopup.alert({
            title: 'Password Recovery Failed',
            content: content,
            cssClass: 'registrationFailedPopup'
          });
        }
      });
    };

    $scope.getOrderClass = function () {
      var memoSettings = MemoSettingsService.get();
      if (!memoSettings) {
        memoSettings.orderWay = 'desc';
      }
      return (memoSettings.orderWay === 'desc' ? 'ion-arrow-up-b' : 'ion-arrow-down-b');
    };


    $scope.changeOrderWay = function ($event) {
      var memoSettings = MemoSettingsService.get();
      if (memoSettings.orderWay == 'asc') {
        memoSettings.orderWay = 'desc';
        angular.element($event.target).removeClass('ion-arrow-down-b');
        angular.element($event.target).addClass('ion-arrow-up-b');
      }
      else {
        memoSettings.orderWay = 'asc';
        angular.element($event.target).addClass('ion-arrow-down-b');
        angular.element($event.target).removeClass('ion-arrow-up-b');
      }

      MemoSettingsService.set(memoSettings);

      $rootScope.$broadcast('ms:changeOrderWay');
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
      $scope.loginModal.remove();
      $scope.registerModal.remove();
    });

    // Execute action on hide modal
    $scope.$on('loginModal.hidden', function () {
    });
    $scope.$on('registerModal.hidden', function () {
    });

    var splashscreenHidden = false;
    $scope.$on('$stateChangeSuccess', function () {
      $timeout(function () {
        if (!splashscreenHidden) {
          splashscreenHidden = true;
          $cordovaSplashscreen.hide();
        }
      }, 500);
    });
  });

  controllersMod.controller('TranslateCtrl', function ($scope, $animate, $document, $timeout, UI, TranslateService, LanguagesService) {
    var translateCtrl = this;
    this.options = {};
    this.swappingFrom = false;
    this.swappingTo = false;
    this.translating = false;

    this.init = function () {
      LanguagesService.getLanguages().then(function (languages) {
        console.log(languages);
        translateCtrl.languages = languages;
      });
    };

    this.swapLanguages = function () {
      translateCtrl.swappingFrom = translateCtrl.swappingTo = true;

      var fromLang = LanguagesService.languages.user.fromLang;
      var toLang = LanguagesService.languages.user.toLang;

      angular.element(document.getElementById('btnSwap')).toggleClass('ms-rotate-180');

      var bFrom = angular.element(document.getElementById('fromLang')).children()[0];
      $animate.addClass(bFrom, 'ms-hide').then(function () {
        translateCtrl.languages.user.fromLang = toLang;
        $animate.removeClass(bFrom, 'ms-hide');
        translateCtrl.swappingFrom = false;
      });

      var bTo = angular.element(document.getElementById('toLang')).children()[0];
      $animate.addClass(bTo, 'ms-hide').then(function () {
        translateCtrl.languages.user.toLang = fromLang;
        $animate.removeClass(bTo, 'ms-hide');
        translateCtrl.swappingTo = false;
      });


      delete translateCtrl.translation;
    };

    this.translate = function () {
      if (!this.textToTranslate || this.textToTranslate === "") {
        UI.toast("Please, specify a text to translate.");
        return;
      }

      this.translation = {};
      this.translation.error = null;
      this.translating = true;

      TranslateService.translate(LanguagesService.languages.user.fromLang,
        LanguagesService.languages.user.toLang,
        this.textToTranslate)
        .then(function (data) //success
        {
          //$timeout(function(){ //simulate long search
          translateCtrl.translation = data;
          //},3000)
        },
        function (error) //error
        {
          translateCtrl.translation.error = error ? (error.data && error.data.message ? error.data.message : error) : "Unknown Error";

          UI.toast(translateCtrl.translation.error);

          // log the error to the console
          console.error("Translate: The following error happened: " + error);
        })
        .finally(function ()	//finally
        {
          //$timeout(function(){
          translateCtrl.translating = false;
          //},3000)
        });
    };

    this.reset = function () {
      translateCtrl.textToTranslate = undefined;
      translateCtrl.translation = undefined;

      LanguagesService.clearUserLanguages();
      LanguagesService.getUserLanguages().then(function (userLangs) {
        translateCtrl.languages.user = userLangs;
      });
    };

    $scope.$watch('translateCtrl.languages.user.fromLang', function (newValue, oldValue) {
      if (!translateCtrl.swappingFrom && newValue !== oldValue && newValue === translateCtrl.languages.user.toLang) {
        UI.toast("From and to languages must be distinct");
        translateCtrl.languages.user.fromLang = oldValue;
      }
    });

    $scope.$watch('translateCtrl.languages.user.toLang', function (newValue, oldValue) {
      if (!translateCtrl.swappingTo && newValue !== oldValue && newValue === translateCtrl.languages.user.fromLang) {
        UI.toast("From and to languages must be distinct");
        translateCtrl.languages.user.toLang = oldValue;
      }
    });

    $scope.$on('ms:translationDeleted', function () {
      translateCtrl.textToTranslate = undefined;
    });

    $scope.$on('ms:login', function () {
      translateCtrl.reset();
    });

    $scope.$on('ms:logout', function () {
      translateCtrl.reset();
    });

    this.init();
  });

  controllersMod.controller('MemoFilterCtrl', function ($scope, $rootScope, $state, $timeout, LanguagesService, MemoSettingsService) {
    var self = this;

    this.formData = MemoSettingsService.get();
    this.formFields = [
      {
        key: 'orderBy',
        type: 'memslateSelect',
        templateOptions: {
          id: 'orderBySelect',
          name: 'Order',
          label: 'Order Memo',
          selectorClass: 'margin-vertical-5 col',
          options: [
            {value: 'Translations.translate,Translations.mainResult', name: 'Alphabetically'},
            {value: 'UserTranslations.userTranslationInsertTime', name: 'by Date'},
            {value: 'Translations.fromLang,Translations.toLang', name: 'by Language'}
          ]
        }
      },
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
          selectorClass: 'col',
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
          selectorClass: 'col',
          options: []
        }
      }
    ];

    LanguagesService.getLanguages().then(function (languages) {
      var items = angular.copy(languages.items);
      items.unshift({name: '(any language)', value: ''});
      self.formFields[7].templateOptions.options = items;
      self.formFields[8].templateOptions.options = items;
      self.formFields[7].templateOptions.prefered = languages.user.prefered;
      self.formFields[8].templateOptions.prefered = languages.user.prefered;
    });

    self.onSubmit = function () {
      self.formData.filterDateFrom.setHours(0);
      self.formData.filterDateFrom.setMinutes(0);
      self.formData.filterDateFrom.setSeconds(0);

      self.formData.filterDateTo.setHours(23);
      self.formData.filterDateTo.setMinutes(59);
      self.formData.filterDateTo.setSeconds(59);

      MemoSettingsService.set(self.formData);
      $state.go('app.memo', null, {location: 'replace'});
    };

    self.onCancel = function () {
      $state.go('app.memo', null, {location: 'replace'});
      self.formData = MemoSettingsService.get();
    };
  });

  controllersMod.controller('MemoCtrl', function ($scope, UI, SessionService, TranslateService, MemoSettingsService) {
    var self = this;

    self.defOffset = 10;
    self.defLimit = 20;

    self.init = function () {
      self.settings = SessionService.getObject('memoSettings');
      if (!self.settings) {
        self.settings = {};
        self.settings.limit = self.defLimit;
        self.settings.offset = 0;
        self.settings.orderWay = 'asc';

        SessionService.putObject('memoSettings', self.settings);
      }

      self.settings.columns = "Translations.id, fromLang, toLang, userTranslationInsertTime as insertTime, translate, mainResult";

      self.filterSettings = MemoSettingsService.get();

      self.translations = [];
      self.moreDataAvailable = true;
      self.adding = false;
    };

    self.init();

    self.moreDataCanBeLoaded = function () {
      return self.moreDataAvailable;
    };

    self.doRefresh = function ()
    {
      self.settings.offset += self.defOffset;
      self.addItems();
    };

    self.addItems = function () {
      if (self.adding) {
        console.log('addItems: already adding');
        return;
      }

      self.adding = true;

      var options = angular.extend({}, self.settings, self.filterSettings)

      console.log('addItems: getting items ', options);

      TranslateService.getTranslations(
        options).then(function (translations) {
          var newTranslations = translations.map(function (item) {
            item.insertTime = new Date(item.insertTime);
            return item;
          });
          self.translations.push.apply(self.translations, newTranslations);
          console.log("Translations: ", self.translations);

          if (translations.length === 0) {
            self.moreDataAvailable = false;
          }

          $scope.$broadcast('scroll.infiniteScrollComplete');
          $scope.$broadcast('scroll.refreshComplete');

          self.settings.offset += self.defOffset;
          self.adding = false;

          console.log('addItems: adding items done');
        },
        function (err) {
          UI.toast("error while getting translations: " + JSON.toString(err))
        });
    };

    self.reset = function () {
      console.log('reset');
      self.init();
      self.addItems();
    };

    /*
     * if given group is the selected group, deselect it
     * else, select the given group
     */
    self.isTranslationComplete = function (translation) {
      if(!translation) return false;
      return translation.rawResult === undefined ? false : true;
    };

    self.toggleTranslation = function (i, translation) {
      if (self.isTranslationComplete(translation)) {
        self.toggleTranslation_(translation);
      }
      else {
        TranslateService.getTranslation(translation.id).then(function (result) {
          translation = result;
          self.translations[i] = translation;
          self.toggleTranslation_(translation);
        });
      }
    };

    self.toggleTranslation_ = function (translation) {
      if (self.isTranslationShown(translation)) {
        self.shownTranslation = null;
      } else {
        self.shownTranslation = translation;
      }
    };

    self.isTranslationShown = function (translation) {
      if(!translation) return false;
      return self.shownTranslation && self.shownTranslation.id === translation.id;
    };

    self.isFiltered = function() {
      return self.filterSettings.filterByString ||
              self.filterSettings.filterByDates ||
              self.filterSettings.filterByLanguages;
    };

    self.unfilter = function() {
      self.filterSettings.filterByString=false;
      self.filterSettings.filterByDates=false;
      self.filterSettings.filterByLanguages=false;

      MemoSettingsService.set(self.filterSettings);

      self.reset();
    };

    $scope.$on('ms:translationDeleted', function (event, data) {
      console.log('translationDeleted:' + data);
      msUtils.objectDeleteByKey(self.translations, 'id', data);
      console.log(self.translations);
    });

    $scope.$on('ms:login', function () {
      self.reset();
    });

    $scope.$on('ms:logout', function () {
      self.reset();
    });

    $scope.$on('ms:changeOrderWay', function () {
      self.reset();
    });

    $scope.$on('$ionicView.beforeEnter', function () {
      self.reset();
    });
  });

  controllersMod.controller('UserCtrl', function ($scope, $rootScope, $state, $animate, $ionicHistory, $ionicPopup, UserService, RegistrationService, UI) {
    var self = this;

    this.User = UserService;
    this.showingChangePwd = false;

    console.log('UserCtrl: enter: ', $state);
    if($state.params.param === 'changePwd')
    {
      this.showingChangePwd=true;
    };

    this.deleteAccount = function () {
      $ionicPopup.confirm({
        title: 'Delete Account',
        content: 'Sure you want to delete your account?',
        cssClass: 'deleteAccountPopup'
      }).then(function (res) {
        if (res) {
          RegistrationService.unregister().then(function (res) {
            if (res.done) {
              UI.toast("Account Deleted");
              $state.go('app.home', null, {location: 'replace'});
            }
            else {
              UI.toast("Failed do delete account: " + res.err.data);
            }
          });
        }
      });
    };

    this.changePassword = function (changePwdForm) {
      if (!changePwdForm.$valid) {
        UI.toast("Some data is not correct. Please, check it.");
        return false;
      }
      if (this.newPwd !== this.newPwd2) {
        UI.toast("Passwords does not match. Please, check it.");
        return false;
      }

      RegistrationService.changePassword(this.oldPwd, this.newPwd).then(function (res) {
        if (res.done) {
          UI.toast("Password Changed");
          self.oldPwd = self.newPwd = self.newPwd2 = "";
          self.showingChangePwd = false;
        }
        else {
          UI.toast("Failed to change password: " + res.err.data);
        }
      });
    }
  });

  controllersMod.controller('PlayCtrl', function ($scope, $http, $compile, $timeout, $ocLazyLoad, $state, $ionicHistory, UI, GamesService) {

    var self = this;

    self.games = undefined;

    GamesService.getGames().success(function (games) {
      //$timeout(function(){self.games = games;},4000);
      self.games = games;
    });

    self.playGame = function (gameIndex) {
      console.log("playGame:", self.games[gameIndex]);

      $state.go('app.games', {gameName: self.games[gameIndex].name_id}).then(function () {
        console.log('playGame ' + self.games[gameIndex].name_id + ' loaded')
      });
    };
  });

})();
