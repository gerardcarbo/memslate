(function () {
  "use strict";

  angular.module('memslate')

    .component('msMemoFilter', {
      templateUrl: 'app/components/memo/memoFilter.html',
      controllerAs: 'memoFilterCtrl',
      controller: function ($scope, $rootScope, $state, $timeout, LanguagesService,
                            MemoFilterSettingsService) {
        var self = this;

        self.init = function () {
          self.formData = MemoFilterSettingsService.get();
          console.log('MemoFilterCtrl: setting: ', self.formData);
        };

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

        self.init();

        $scope.$on('ms:memoFilterSettingsChanged', function () {
          self.init();
        });

      }
    })

    .component('msMemo', {
      templateUrl: "app/components/memo/memo.html",
      controllerAs: "memoCtrl",
      require: {
        user: '^msUserOperations'
      },
      bindings: {scope: '='},
      controller: function ($scope, $timeout, $filter, $window, $document,
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

        self.reload = function () {
          console.log('MemoControler: reload');
          self.init();
          self.unstickTabs();
          $ionicScrollDelegate.scrollTop(false);
          self.addGroups()
            .finally(self.checkToLoadGroups);
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
          console.log('checkToLoadGroups:  tab_ending_group_top: ' + tab_ending_top +
                      ' windowHeight: ' + window.innerHeight);
          if (tab_ending_top < window.innerHeight) {
            return self.addGroups()
              .then(function(){console.log('checkToLoadGroups: addGroups succeeded');},
                    function (err) {
                      console.log('checkToLoadGroups: error while addGroups: ', err);
                    })
              .finally(function () {
                    console.log('checkToLoadGroups: check again');
                    $timeout(self.checkToLoadGroups,2000);
                  } //if add groups succeeded, check to load groups again after a timeout to give time to rendering
              );
          }
          return $q.resolve('adding groups done');
        };

        self.addingGroups = false;
        self.addGroups = function () {
          console.log('addGroups: enter');
          if (!self.moreDataAvailable) {
            console.log('addGroups: moreDataAvailable:' + self.moreDataAvailable);
            return $q.reject('no data available');
          }
          if (self.addingGroups) {
            console.log('addGroups: addingGroups:' + self.addingGroups);
            return $q.reject('already adding');
          }
          self.addingGroups = true;

          var options = angular.extend({
              columns: self.filterSettings.orderBy,
              orderWay: self.filterSettings.orderWay,
              offset: self.groupsSettings.offset,
              limit: self.groupsSettings.limit
            },
            MemoFilterSettingsService.getGroupsFilter());

          console.log('addGroups: getting items ', options);

          return TranslateService.getTranslationsGroups(options)
            .then(function (groups) {
              if (groups && groups.length) {
                var addTranslationsPr = [];
                console.log('addGroups: ' + groups.length + ' gotten', options);

                angular.forEach(groups, function (group) {
                  var groupName = self.getGroupName(group);
                  console.log('addGroups: add group: ' + self.getGroupKey(group));
                  if (self.translationsGroups[groupName] === undefined) {
                    var newGroup = new self.translationGroup(groupName, group);
                    self.translationsGroups[self.getGroupKey(group)] = newGroup;
                    addTranslationsPr.push(self.addTranslations(newGroup));
                  }
                });

                self.groupsSettings.offset += self.groupsSettings.limit;
                self.loading = false;

                return $q.all(addTranslationsPr);
              }

              self.loading = false;
              self.moreDataAvailable = false;
              return $q.reject('no more groups available');
            }, function (err) {
              return $q.reject(err);
            })
            .finally(function () {
              self.addingGroups = false
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
            console.log('checkToLoadTranslations: ' + groupKey + ' tab_ending_top: ' + tab_ending_top + " windowHeight: " + window.innerHeight);
            if (tab_ending_top - 500 < window.innerHeight) {
              return self.addTranslations(self.translationsGroups[groupKey]);
            }
          }
          return $q.resolve('adding translations done');
        };

        self.addTranslations = function (group) {
          if (!group || group.loading) return $q.reject('already translations adding');
          if (!group.moreDataAvailable) return $q.resolve('no more data available');
          group.loading = true;

          var options = angular.extend({}, group.filterOptions(), group.settings, MemoFilterSettingsService.getTranslationsFilter());

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
                  $timeout(self.checkToLoadTranslations, 500);
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

        self.unstickTabs = function () {
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
          console.log('toggleGroup: enter ' + key + ' to ' + !group.shown);
          group.shown = !group.shown;
          if (!group.shown) {
            //check if groups needed (last tab)
            $timeout(self.checkToLoadGroups, 500);
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

        $scope.$on('ms:memoFilterSettingsChanged', function () {
          self.reload();
        });

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

        self.refresh = function () {
          self.reload();
          $scope.$broadcast('scroll.refreshComplete');
        }

        self.reload();
      }
    });

})();
