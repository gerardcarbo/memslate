(function () {
  "use strict";

  var controllersMod = angular.module('memslate.controllers',
    ['ionic', 'ngCordova', 'formly', 'oc.lazyLoad',
      'memslate.services', 'memslate.services.ui']);

  controllersMod.controller('AppCtrl', function ($scope, $rootScope, $timeout, $state, $ionicModal, $ionicPopup,
                                                 $cordovaSplashscreen,
                                                 UserService, UserStatusService, SessionService, UI, MemoFilterSettingsService) {
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
      return UserStatusService.isAuthenticated();
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
      UserService.login($scope.loginData.email, $scope.loginData.password).then(function (login) {
        if (login.done) {
          $scope.loginModal.hide();
          loginForm.$setUntouched();
          loginForm.$setPristine();
          console.log('Login done!');
        }
        else {
          UI.toast("Login Failed: " + login.err.data);
        }
      }).finally(function () {
        $scope.loginData = {};
        $scope.inAction = false;
      });
    };

    $scope.doLogout = function () {
      UI.showOkCancelModal("Close Session", "Do you really want to logout?'")
        .then(function (res) {
          if (res === true) {
            UserService.logout();
          }
        });
    };

    $scope.isAuthenticated = function () {
      return UserStatusService.isAuthenticated();
    };

    $scope.userName = function () {
      return UserStatusService.name();
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
      UserService.register($scope.registerData).then(function (register) {
        if (register.done) {
          $scope.registerModal.hide();
          $scope.registerData = {};
          registerForm.$setUntouched();
          registerForm.$setPristine();

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

    $scope.doRecover = function (recoverForm) {
      if (!recoverForm.$valid) {
        UI.toast("Some data is not correct. Please, check it.");
        return false;
      }
      console.log('Doing recover: ', $scope.recoverData.email);

      UserService.recoverPwd($scope.recoverData).then(function (error) {
        if (!error) {
          $scope.registerModal.hide();
          $scope.recoverData = {};
          recoverForm.$setUntouched();
          recoverForm.$setPristine();
          UI.toast('Password recovery mail send! please check your email... and change it, please', 4000);
          //$state.go('app.user', { param: 'changePwd' });
          console.log('recoverPwd done!');
          $scope.closeRecover();
        }
        else {
          console.log('recover failed', error)
          var content = error.data && error.data.errors ? error.data.errors[0].response : JSON.stringify(error.data);
          $ionicPopup.alert({
            title: 'Password Recovery Failed',
            content: content,
            cssClass: 'registrationFailedPopup'
          });
        }
      });
    };

    $scope.getAlignTitle = function() {
      if(window.innerWidth>360) return "center";
      return "left";
    };

    $scope.getOrderClass = function () {
      var memoSettings = MemoFilterSettingsService.get();
      if (!memoSettings || !memoSettings.orderWay) {
        memoSettings.orderWay = 'asc';
      }
      return (memoSettings.orderWay === 'asc' ? 'ion-arrow-down-b' : 'ion-arrow-up-b');
    };

    $scope.changeOrderWay = function ($event) {
      var memoSettings = MemoFilterSettingsService.get();
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

      MemoFilterSettingsService.set(memoSettings);

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
        if (!splashscreenHidden) {
          splashscreenHidden = true;
          $cordovaSplashscreen.hide();
        }
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
        console.log("TranslateCtrl: languages gotten...")
        translateCtrl.languages = languages;
      });
    };

    this.swapLanguages = function () {
      translateCtrl.swappingFrom = translateCtrl.swappingTo = true;

      var fromLang = LanguagesService.languages.user.fromLang;
      var toLang = LanguagesService.languages.user.toLang;

      angular.element(document.getElementById('btnSwap')).toggleClass('ms-rotate-180');

      var bFrom = angular.element(document.getElementById('fromLang')).children()[1];
      $animate.addClass(bFrom, 'ms-hide').then(function () {
        translateCtrl.languages.user.fromLang = toLang;
        $animate.removeClass(bFrom, 'ms-hide').then(function () {
          translateCtrl.swappingFrom = false;
        });
      });

      var bTo = angular.element(document.getElementById('toLang')).children()[1];
      $animate.addClass(bTo, 'ms-hide').then(function () {
        translateCtrl.languages.user.toLang = fromLang;
        $animate.removeClass(bTo, 'ms-hide').then(function () {
          translateCtrl.swappingTo = false;
        });
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

    this.reload = function () {
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

  controllersMod.controller('MemoFilterCtrl', function ($scope, $rootScope, $state, $timeout, LanguagesService,
                                                        MemoFilterSettingsService, memoFilterSettings) {
    var self = this;

    console.log('MemoFilterCtrl: setting: ', memoFilterSettings);
    this.formData = memoFilterSettings;
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
            {value: 'Alpha', name: 'Alphabetically'},
            {value: 'Date', name: 'by Date'},
            {value: 'Langs', name: 'by Languages'}
          ]
        }
      },
      {
        key: 'orderWay',
        type: 'memslateSelect',
        templateOptions: {
          id: 'orderWaySelect',
          name: 'Direction',
          label: 'Direction Memo',
          selectorClass: 'margin-vertical-5 col',
          options: [
            {value: 'asc', name: 'Normal'},
            {value: 'desc', name: 'Inverse'},
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
          options: [],
          unselectedText: '(select)'
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
          options: [],
          unselectedText: '(select)'
        }
      }
    ];

    LanguagesService.getLanguages().then(function (languages) {
      var items = angular.copy(languages.items);
      items.unshift({name: '(any language)', value: ''});
      self.formFields[8].templateOptions.options = items;
      self.formFields[9].templateOptions.options = items;
      self.formFields[8].templateOptions.prefered = languages.user.prefered;
      self.formFields[9].templateOptions.prefered = languages.user.prefered;
    });

    self.onSubmit = function () {
      self.formData.filterDateFrom.setHours(0);
      self.formData.filterDateFrom.setMinutes(0);
      self.formData.filterDateFrom.setSeconds(0);

      self.formData.filterDateTo.setHours(23);
      self.formData.filterDateTo.setMinutes(59);
      self.formData.filterDateTo.setSeconds(59);

      MemoFilterSettingsService.set(self.formData);
      $state.go('app.memo', null, {location: 'replace'});
    };

    self.onCancel = function () {
      $state.go('app.memo', null, {location: 'replace'});
      self.formData = MemoFilterSettingsService.get();
    };
  });

  controllersMod.controller('MemoCtrl', function ($scope, $timeout, $filter, $window, $document,
                                                  $location, $ionicScrollDelegate, $q,
                                                  UI, UserStatusService, TranslateService, MemoGroupsSettingsService,
                                                  MemoFilterSettingsService) {
    var self = this;

    self.init = function () {
      self.groupsSettings = MemoGroupsSettingsService.get();
      self.filterSettings = MemoFilterSettingsService.get();

      self.translationsGroups = {};
      self.moreDataAvailable = true;
      self.adding = false;
    };

    //self.init(); //called in $ionicView.beforeEnter

    self.reload = function () {
      console.log('MemoControler: reload');
      self.init();
      self.unstickTabs();
      $ionicScrollDelegate.scrollTop(false);
      self.addGroups().then($timeout(self.checkToLoadGroups,500));
    };

    self.translationGroup = function (groupName, groupData) {
      return {
        name: groupName,
        shown: true,
        translations: [],
        moreDataAvailable: true,
        groupData: groupData,
        loading: false,
        settings: {
          columns: "Translations.id, fromLang, toLang, userTranslationInsertTime as insertTime, translate, mainResult",
          offset: self.filterSettings.offset,
          limit: self.filterSettings.limit
        },
        filterOptions: function () {
          switch (self.filterSettings.orderBy) {
            case 'Alpha':
              return {
                groupData: self.filterSettings.orderBy,
                groupFilter: groupData.Alpha,
                groupOrderBy: 'translate, mainResult, insertTime'
              };
            case 'Date':
              return {
                groupData: self.filterSettings.orderBy,
                groupFilter: new Date(groupData.Date),
                groupOrderBy: 'translate, mainResult'
              };
            case 'Langs':
              return {
                groupData: self.filterSettings.orderBy,
                groupFilter: groupData.Langs,
                groupOrderBy: 'translate, mainResult'
              };
          }
        }
      };
    };

    self.getTranslationGroupName = function (translation) {
      switch (self.filterSettings.orderBy) {
        case 'Alpha':
          return translation.translate[0];
        case 'Date':
          return $filter('date')(translation.insertTime);
        case 'Langs':
          return '(' + translation.fromLang + ',' + translation.toLang + ')';
      }
    };

    self.insertTranslationsInGroups = function (translations) {
      angular.forEach(translations, function (translation) {
        var group = self.translationsGroups[self.getTranslationGroupName(translation)];
        if (!group) {
          console.log('insertTranslationsInGroups: group not found for: ', self.getTranslationGroupName(translation));
          return;
        }
        group.translations.push(translation);
      });
    };

    self.getGroupName = function (data) {
      switch (self.filterSettings.orderBy) {
        case 'Alpha':
          return data.Alpha;
        case 'Date':
          return $filter('date')(new Date(data.Date));
        case 'Langs':
          var langs = data.Langs.trimChars('()').split(',');
          return langs[0] + '&nbsp&nbsp<i class="icon ion-arrow-right-b smaller-font"></i>&nbsp&nbsp' + langs[1];
      }
    };

    self.getGroupKey = function (data) {
      switch (self.filterSettings.orderBy) {
        case 'Alpha':
          return data.Alpha;
        case 'Date':
          return $filter('date')(new Date(data.Date));
        case 'Langs':
          return data.Langs;
      }
    };

    self.checkToLoadGroups = function () {
      var elem = document.getElementById('tab-ending-group-container');
      var tab_ending_top = elem.getTop();
      console.log('checkToLoadGroups:  tab_ending_group_top: ' + tab_ending_top + " windowHeight: " + window.innerHeight);
      if (tab_ending_top < window.innerHeight) {
        return self.addGroups()
          .then(function(){
            $timeout(self.checkToLoadGroups,500); //if add groups succeeded, check to load groups again after a timeout to give time to rendering
          },function(err){
            console.log('checkToLoadGroups: error while addGroups: ',err);
          });
      }
      return $q.resolve('adding groups done');
    };

    self.addGroups = function () {
      if (!self.moreDataAvailable){
          console.log('addGroups: moreDataAvailable:'+self.moreDataAvailable);
          return $q.reject('already adding or no data available');
      }

      var options = angular.extend({
          columns: self.filterSettings.orderBy,
          orderWay: self.filterSettings.orderWay,
          offset: self.groupsSettings.offset,
          limit: self.groupsSettings.limit
        },
        MemoFilterSettingsService.getFilters());

      console.log('addGroups: getting items ', options);

      return TranslateService.getTranslationsGroups(options).then(function (groups) {
        if (groups && groups.length) {
          var addTranslationsPr=[];
          console.log('addGroups: '+groups.length+ ' gotten');

          angular.forEach(groups, function (group) {
            var groupName = self.getGroupName(group);
            if (self.translationsGroups[groupName] === undefined) {
              var newGroup = new self.translationGroup(groupName, group);
              self.translationsGroups[self.getGroupKey(group)] = newGroup;
              addTranslationsPr.push(self.addTranslations(newGroup));
            }
          });

          self.groupsSettings.offset += self.groupsSettings.limit;
          self.loading = false;

          return addTranslationsPr;
        }

        self.loading = false;
        self.moreDataAvailable = false;
        return $q.reject('no more groups available');
      }, function(err){
         return $q.reject(err);
      });
    };

    self.checkToLoadTranslations = function () {
      for (var groupKey in self.translationsGroups) {
        //check tab-ending's visibility
        var elem = document.getElementById('tab-ending-' + groupKey);
        if (elem.isHidden()) continue;
        if (self.translationsGroups[groupKey].loading) continue;
        if (!self.translationsGroups[groupKey].moreDataAvailable) continue;
        var tab_ending_top = elem.getTop();
        //console.log('checkToLoadTranslations: ' + groupKey + ' tab_ending_top: ' + tab_ending_top + " windowHeight: " + window.innerHeight);
        if (tab_ending_top < window.innerHeight) {
          return self.addTranslations(self.translationsGroups[groupKey]);
        }
      }
      return $q.resolve('adding translations done');
    };

    self.addTranslations = function (group) {
      if (!group || group.loading) return $q.reject('already translations adding');
      if (!group.moreDataAvailable) return $q.resolve('no more data available');
      group.loading = true;

      var options = angular.extend({}, group.filterOptions(), group.settings, MemoFilterSettingsService.getFiltered());

      console.log('addTranslations: getting items ', options);

      return TranslateService.getTranslations(options)
        .then(function (translations) {
            translations.forEach(function (item) {
              item.insertTime = new Date(item.insertTime);
            });

            self.insertTranslationsInGroups(translations);
            group.settings.offset += group.settings.limit;
            group.loading = false;

            console.log('addTranslations: adding items done group: ' + group.name + ' length: ' + translations.length);

            if (translations.length < group.settings.limit) {
              group.moreDataAvailable = false;
              console.log('addTranslations: no more data available');
              return $q.resolve('no more data available');
            }
            else {
              $timeout(self.checkToLoadTranslations,500);
              console.log('addTranslations: more data available');
              return $q.reject('more data available');
            }
          },
          function (err) {
            group.loading = false;
            UI.toast("error while getting translations: " + JSON.toString(err));
            return $q.reject('error while getting translations');
          });
    };

    self.isTranslationComplete = function (translation) {
      if (!translation) return false;
      return translation.rawResult === undefined ? false : true;
    };

    self.onScroll = function () {
      self.stickTabs();
      self.checkToLoadTranslations()
        .then(self.checkToLoadGroups);
    };

    self.unstickTabs = function() {
      var memoFixed = document.getElementById("memoFixed");
      while (memoFixed.firstChild) {
        memoFixed.removeChild(memoFixed.firstChild);
      }
    };

    self.stickTabs = function () {
      if (self.disableStick) return;
      var scrollTop_top = angular.element(document.getElementById('memoScroll')).prop('scrollTop') -
          angular.element(document.getElementById('memoFilterNotification'))[0].offsetHeight -
          angular.element(document.getElementById('memoRegisterNotification'))[0].offsetHeight
        ;
      //console.log('onScroll: scrollTop_top: ', scrollTop_top);
      for (var groupKey in self.translationsGroups) {
        var div_fixed = document.getElementById("memoFixed");
        var div_elem = document.getElementById('tab-' + groupKey);
        var div_top = angular.element(document.getElementById('sticky-anchor-' + groupKey)).prop('offsetTop');
        //console.log('onScroll: groupKey: ' + groupKey + ' div_top : ', div_top);
        if (scrollTop_top > div_top - 2) {
          var group = self.translationsGroups[groupKey];
          //stick tab to the top
          if (div_elem.parentElement == div_fixed) continue; //already sticked
          if (div_top == 0) continue;//tab div not shown
          //unstick old elements
          angular.forEach(div_fixed.children, function (elem) {
            var groupKey = elem.id.split('tab-')[1];
            self.restoreParent(groupKey, elem);
          });
          if (!group.shown) continue;//do not stick hidden groups
          //stick new one
          //console.log('onScroll: groupKey: ********* sticking '+ groupKey);
          group.oldParent = div_elem.parentElement;
          div_fixed.appendChild(div_elem);
          angular.element(document.getElementById('tab-' + groupKey)).addClass('stick-tab');
        } else {
          self.unstickTab(groupKey, div_elem);
        }
      }
    };

    self.unstickTab = function (groupKey, div_elem) {
      self.restoreParent(groupKey, div_elem);
      angular.element(document.getElementById('tab-' + groupKey)).removeClass('stick-tab');
    };

    self.restoreParent = function (groupKey, div_elem) {
      var group = self.translationsGroups[groupKey];
      if (!group || !group.oldParent) return;
      group.oldParent.appendChild(div_elem);
      group.oldParent = null;
    };

    self.toggleGroup = function (key, group) {
      console.log('toggleGroup: enter '+key+' to '+!group.shown);
      group.shown = !group.shown;
      if (!group.shown) {
        //check if groups needed (last tab)
        $timeout(self.checkToLoadGroups,500);
        //unstick tab and scroll to the top of the tab
        var div_elem = document.getElementById('tab-' + key);
        if (!angular.element(div_elem).hasClass('stick-tab')) return; //do not scroll not sticked tabs
        self.disableStick = true;
        self.unstickTab(key, div_elem);
        $location.hash('group-' + key);
        $ionicScrollDelegate.anchorScroll(false);
        $timeout(function () {
          self.disableStick = false;
          console.log('toggleGroup: done');
        }, 1000);
      }
    };

    self.toggleTranslation = function (group, i, translation) {
      if (self.isTranslationComplete(translation)) {
        self.toggleTranslation_(translation);
      }
      else {
        TranslateService.getTranslation(translation.id).then(function (result) {
          group.translations[i] = result;
          $timeout(function () {  //otherwise animation not triggered
            self.toggleTranslation_(translation);
          }, 0)
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
      if (!translation) return false;
      return self.shownTranslation && self.shownTranslation.id === translation.id;
    };

    self.isFiltered = function () {
      return self.filterSettings.filterByString ||
        self.filterSettings.filterByDates ||
        self.filterSettings.filterByLanguages;
    };

    self.isAuthenticated = function () {
      return UserStatusService.isAuthenticated();
    };

    self.unfilter = function () {
      self.filterSettings.filterByString = false;
      self.filterSettings.filterByDates = false;
      self.filterSettings.filterByLanguages = false;

      MemoFilterSettingsService.set(self.filterSettings);

      self.reload();
    };

    self.getTabMargin = function (index) {
      var tabPadding = 40;
      var tabSize = 150;
      if (self.filterSettings.orderBy == "Date") tabSize = 220;
      if (self.filterSettings.orderBy == "Langs") tabSize = 170;
      var numSlots = Math.floor((Math.min(1024, document.body.clientWidth) - tabSize) / tabPadding);
      var margin = 25 + ((index % numSlots) * tabPadding );
      return margin;
    };

    $scope.$on('ms:translationDeleted', function (event, data) {
      console.log('translationDeleted:' + data);
      Object.keys(self.translationsGroups).forEach(function (key, index) {
        var group = self.translationsGroups[key];
        msUtils.objectDeleteByKey(group.translations, 'id', data);
      })
    });

    $scope.$on('ms:login', function () {
      self.reload();
    });

    $scope.$on('ms:logout', function () {
      self.reload();
    });

    $scope.$on('ms:changeOrderWay', function () {
      self.reload();
    });

    $scope.$on('$ionicView.beforeEnter', function () {
      self.reload();
    });

    self.refresh = function() {
      self.reload();
      $scope.$broadcast('scroll.refreshComplete');
    }
  });

  controllersMod.controller('UserCtrl', function ($scope, $rootScope, $state, $animate,
                                                  $ionicHistory, $ionicPopup,
                                                  UserStatusService, UserService, UI) {
    var self = this;

    this.User = UserStatusService;
    this.UserStatistics = {};
    this.showingChangePwd = false;

    this.RefreshStatistics = function () {
      UserService.getStatistics().success(function (stats) {
        self.UserStatistics = stats;
      });
    };

    this.RefreshStatistics();

    console.log('UserCtrl: enter: ', $state);
    if ($state.params.param === 'changePwd') {
      this.showingChangePwd = true;
    };

    this.deleteAccount = function () {
      $ionicPopup.confirm({
        title: 'Delete Account',
        content: 'Sure you want to delete your account?',
        cssClass: 'deleteAccountPopup'
      }).then(function (res) {
        if (res) {
          UserService.unregister().then(function (res) {
            if (res.done) {
              UI.toast("Account Deleted");
              $ionicHistory.nextViewOptions({
                disableBack: true
              });
              $state.go('app.home');
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

      UserService.changePassword(this.oldPwd, this.newPwd).then(function (res) {
        if (res.done) {
          UI.toast("Password Changed");
          self.oldPwd = self.newPwd = self.newPwd2 = "";
          self.showingChangePwd = false;
        }
        else {
          UI.toast("Failed to change password: " + res.err.data);
        }
      });
    };

    $scope.$on('ms:login', self.RefreshStatistics);
    $scope.$on('ms:logout', self.RefreshStatistics);
  });

  controllersMod.controller('PlayCtrl', function ($scope, $http, $compile, $timeout, $ocLazyLoad, $state, $ionicHistory, UI, GamesService) {

    var self = this;

    self.games = undefined;

    GamesService.getGames().success(function (games) {
        self.games = games;
      })
      .error(function (err) { //404 error -> try again
        GamesService.getGames().success(function (games) {
          self.games = games;
        })
      });

    self.playGame = function (gameIndex) {
      console.log("playGame:", self.games[gameIndex]);

      $ionicHistory.nextViewOptions({disableBack: true});

      $state.go('app.games', {gameName: self.games[gameIndex].name_id}).then(function () {
        console.log('playGame ' + self.games[gameIndex].name_id + ' loaded')
      });
    };
  });

})();
