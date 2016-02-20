(function () {
  "use strict";

  var app = angular.module('memslate.directives', ['memslate.services', 'memslate.services.ui']);

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

  app.directive('msVisible', function () {
    return {
      scope: {
        onVisible: '@'
      },
      link: function (scope, element, attrs) {
        scope.$watch(function () {
            return element[0].is(':visible')
          },
          function () {
            scope.onVisible();
          });
      }
    }
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
        title: '@',
        unselectedText: '@'
      },
      link: function ($scope) {

        $scope.onSelected = function (value) {
          $scope.selectedItem = value;
          $scope.modalSelect.hide();
        };

        $scope.notPrefered = function (item) {
          if (!this.preferedItems) return true;
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
          if (!value) return $scope.unselectedText || null;
          var item = msUtils.objectFindByKey($scope.items, "value", value);
          if (item) return item.name;
          return undefined;
        };

        $scope.getSelected = function () {
          return $scope.getName($scope.selectedItem);
        };
      }
    };
  });

  app.directive('msTranslation', ['$log', 'TranslateService', function ($log, TranslateService) {
    return {
      restrict: 'E',
      templateUrl: 'templates/widgets/ms-translation.html',
      replace: true,
      scope: {
        translation: '=',
        parent: '=',
        showExtended: '=?'
      },
      controller: function ($scope, TranslationSampleRes, UI, UserStatusService) {
        // check if it was defined.  If not - set a default
        $scope.showExtended = angular.isDefined($scope.showExtended) ? $scope.showExtended : true;

        this.isAuthenticated = function () {
          $log.log('isAuthenticated', UserStatusService.isAuthenticated())
          return UserStatusService.isAuthenticated();
        };

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
          translationSample.$delete(function () {
            $scope.translation.samples.splice(index, 1);
          });
        };

        this.deleteTranslation = function (id) {
          UI.showOkCancelModal("Delete Translation", "Do you really want to delete the translation '" + $scope.translation.translate + "' ?")
            .then(function (res) {
              if (res === true) {
                $log.log('deleteTranslation', id);
                TranslateService.deleteTranslation(id).then(function () {
                  $log.log('deleteTranslation: done for ', id);
                  $scope.$emit('ms:translationDeleted', id);
                  $scope.translation = undefined;
                });
              }
            });
        };

        this.playText = function (txt, lang) {
          var msg = new SpeechSynthesisUtterance();
          msg.text = txt;
          msg.lang = lang + "-" + lang.toUpperCase();

          msg.onerror = function (error) {
            $log.log('playingSound: error ' + error)
          };

          var voices = speechSynthesis.getVoices();
          if(Array.isArray(voices))
          {
            var voicesFiltered = voices.filter(function (voice) {
              return voice.lang == msg.lang;
            });
            msg.voice = voicesFiltered[0];
          }

          speechSynthesis.speak(msg);

          $log.log('playingSound: ' + txt);
        };

        this.playAudio = function (url) {
          // Play the audio file at url
          var my_media = new Media(url,
            // success callback
            function () {
              console.log("playAudio():Audio Success");
            },
            // error callback
            function (err) {
              console.log("playAudio():Audio Error: " + err);
            }
          );

          // Play audio
          my_media.play();

          // Pause after 10 seconds
          setTimeout(function () {
            media.pause();
          }, 10000);
        }
      },
      controllerAs: 'msTranslationCtrl',
      link: function ($scope, element, attrs) {
        var scope = $scope;
        $scope.$watch('translation', function (translation) {
          if (translation && translation.rawResult) //full translation gotten
          {
            TranslateService.getTranslationSamples(translation.id, function (samples) {
              scope.translation.samples = samples;
            });
          }
        });
      }
    };
  }]);
})
();
