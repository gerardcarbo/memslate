(function () {
  "use strict";

  angular.module('memslate')

    .component("msTranslate", {
      templateUrl: "app/components/translate/translate.html",
      controllerAs: "translateCtrl",
      controller: function ($scope, $animate, $document, $timeout, UI, TranslateService, LanguagesService) {
        var self = this;
        this.options = {};
        this.swappingFrom = false;
        this.swappingTo = false;
        this.translating = false;

        this.init = function () {
          LanguagesService.getLanguages().then(function (languages) {
            console.log("TranslateCtrl: languages gotten...")
            self.languages = languages;
          });
        };

        this.swapLanguages = function () {
          self.swappingFrom = self.swappingTo = true;

          var fromLang = LanguagesService.languages.user.fromLang;
          var toLang = LanguagesService.languages.user.toLang;

          angular.element(document.getElementById('btnSwap')).toggleClass('ms-rotate-180');

          var bFrom = angular.element(document.getElementById('fromLang')).children()[1];
          $animate.addClass(bFrom, 'ms-hide').then(function () {
            self.languages.user.fromLang = toLang;
            $animate.removeClass(bFrom, 'ms-hide').then(function () {
              self.swappingFrom = false;
            });
          });

          var bTo = angular.element(document.getElementById('toLang')).children()[1];
          $animate.addClass(bTo, 'ms-hide').then(function () {
            self.languages.user.toLang = fromLang;
            $animate.removeClass(bTo, 'ms-hide').then(function () {
              self.swappingTo = false;
            });
          });


          delete self.translation;
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
                self.translation = data;
                //},3000)
              },
              function (error) //error
              {
                self.translation.error = error ? (error.data && error.data.message ? error.data.message : error) : "Unknown Error";

                UI.toast(self.translation.error);

                // log the error to the console
                console.error("Translate: The following error happened: " + error);
              })
            .finally(function ()	//finally
            {
              //$timeout(function(){ //simulate delay
              self.translating = false;
              //},3000)
            });
        };

        this.cleanTextToTranslate = function(){
          this.textToTranslate='';
          this.translation=undefined;
          $timeout(function() {angular.element(document.getElementById('textToTranslate'))[0].focus();});
        };

        this.reload = function () {
          self.textToTranslate = undefined;
          self.translation = undefined;

          LanguagesService.clearUserLanguages();
          LanguagesService.getUserLanguages().then(function (userLangs) {
            self.languages.user = userLangs;
          });
        };

        $scope.$watch('translateCtrl.languages.user.fromLang', function (newValue, oldValue) {
          if (!self.swappingFrom && newValue !== oldValue && newValue === self.languages.user.toLang) {
            UI.toast("From and to languages must be distinct");
            self.languages.user.fromLang = oldValue;
          }
        });

        $scope.$watch('translateCtrl.languages.user.toLang', function (newValue, oldValue) {
          if (!self.swappingTo && newValue !== oldValue && newValue === self.languages.user.fromLang) {
            UI.toast("From and to languages must be distinct");
            self.languages.user.toLang = oldValue;
          }
        });

        $scope.$on('ms:translationDeleted', function () {
          self.textToTranslate = undefined;
        });

        $scope.$on('ms:login', function () {
          self.reload();
        });

        $scope.$on('ms:logout', function () {
          self.reload();
        });

        this.init();
      }
    });
})();
