/**
 * Created by gerard on 22/07/2015.
 */
"use strict";

var appGame = angular.module('memslate.directives');

appGame.directive('basicTestGame', function ($log, $location, $ionicScrollDelegate, $ionicModal, GamesService, LanguagesService, SessionService, UI) {
  return {
    restrict: 'E',
    templateUrl: 'templates/games/basic-test/basic-test-template.html',
    replace: true,
    controller: function ($scope, $timeout) {
      var self = this;

      this.init = function ()
      {
        this.testStarted = false;
        this.numQuestions = 10;
        this.numAnswers = 5;
        this.showResults = false;
        this.allResponsesGiven = false;
        this.gameLangs = [];
        this.useAnonymousLangs = false;
        self.useAnonymousLangsDisabled=false;
        this.levels=[{name:'Easy',value:'0-.3'},{name:'Medium',value:'.3-.55'},{name:'High',value:'.55-1'},{name:'Any',value:'0-1'}];
        this.getLanguages();
      };

      this.getLanguages = function() {
        LanguagesService.getLanguages().then(function () {
          $log.log("basic-test:getLanguages gotten");
          GamesService.getGame('basic-test', 'languages?anonymous='+self.useAnonymousLangs).success(function (gameLangs) {
            $log.log("basic-test:getGame languages  gotten: ", gameLangs);
            self.gameLangs = [];
            gameLangs.forEach(function (langs) {
              if (langs.count > 20) {
                self.gameLangs.push({
                  name: LanguagesService.getLanguage(langs.fromLang).name + " > " + LanguagesService.getLanguage(langs.toLang).name + "",
                  value: langs.fromLang + '-' + langs.toLang
                })
              }
            });

            if(SessionService.get('basicTestSelectedLevel')) {
              self.selectedLevel = SessionService.get('basicTestSelectedLevel');
            }
            else {
              self.selectedLevel = self.levels[1].value;
            }

            if(self.gameLangs.length) {
              var selectedLangs = SessionService.get('basicTestSelectedLangs');
              if (selectedLangs) {
                self.selectedLangs = selectedLangs;
              }
              else {
                if (self.gameLangs[0]) {
                  self.selectedLangs = self.gameLangs[0].value;
                }
              }
            }
            else {
              self.useAnonymousLangsDisabled=true;
              UI.showAlert('Basic Test', "You do not have enough translations to play the game (20). We will use anonymous translations from other users to perform the test.",3000)
                .then(function () {
                    self.useAnonymousLangs = true;
                    self.getLanguages();
                });
            }
          });
        });
      };

      this.showAnonymosuTranslationsHelp = function(){
        UI.showAlert("Use Anonymous Translations","Anonymous translations will be used to construct the test's queries.<br/> Your translations will be used also, but if they are not enough, it will be completed with anonymous ones.");
      };

      this.startTest = function () {
        var self = this;
        SessionService.put('basicTestSelectedLangs', this.selectedLangs);
        SessionService.put('basicTestSelectedLevel', this.selectedLevel.value);
        this.testStarted = true;
        this.retrying = false;
        var langs = this.selectedLangs.split('-');

        GamesService.getGame('basic-test', 'questions?difficulty='+self.selectedLevel+'&fromLang=' + langs[0] +
          '&toLang=' + langs[1] + '&questions=' + self.numQuestions + '&answers=' + self.numAnswers +
          '&anonymous='+self.useAnonymousLangs)
          .success(function (gameQuestions) {
            $log.log("Questions: ", gameQuestions);
            $timeout(function(){self.gameQuestions = gameQuestions;},0); //simulate wait
          })
          .error(function(err,status){
            self.testStarted = false;
            if (status == 406) {
              UI.toast("You don't have enough translations of this type to perform this kind of test. Anonymous translations selected.",3000);
              self.useAnonymousLangs=true;
            } else {
              UI.toast("There has been an error while getting test questions: " + err + "("+status+")");
            }
          });
      };

      this.answerSelected = function (idQuestion, idResponse) {
        this.checkAllResponsesDone();
        if (idQuestion < this.numQuestions - 1 && !this.allResponsesGiven) {
          $location.hash('test_div_' + (idQuestion + 1));
          $ionicScrollDelegate.anchorScroll(true);
        }
      };

      this.checkAllResponsesDone = function () {
        var allDone = true;
        var length = this.gameQuestions.length;
        for (var i = 0; i < length; i++) {
          if (this.gameQuestions[i].givenAnswer === undefined) {
            allDone = false;
            break;
          }
        }
        this.allResponsesGiven = allDone;
        if(allDone && !this.retrying) {
          this.evaluateTest();
        }

      };

      this.showAnswer = function (i) {
        $location.hash('test_div_' + (i));
        $ionicScrollDelegate.anchorScroll(true);
      };

      this.showFirstNonResponseAnswer = function () {
        var length = this.gameQuestions.length;
        for (var i = 0; i < length; i++) {
          if (this.gameQuestions[i].givenAnswer === undefined) {
            this.showAnswer(i);
            break;
          }
        }
      };

      this.showFirstWrongAnswer = function () {
        var length = this.gameQuestions.length;
        for (var i = 0; i < length; i++) {
          if (this.gameQuestions[i].options[this.gameQuestions[i].givenAnswer] !== this.gameQuestions[i].answer) {
            this.showAnswer(i);
            break;
          }
        }
      };

      this.playAgain = function ()
      {
        this.gameQuestions = undefined;
        this.showResults = false;
        this.testStarted = false;
        this.allResponsesGiven = false;
        this.retrying = false;

        $ionicScrollDelegate.scrollTop(true);
      };

      this.evaluateTest = function () {
        if (!this.allResponsesGiven) {
          UI.toast('Not all responses given...');
          this.showFirstNonResponseAnswer();
          return;
        }

        $scope.result = {};
        $scope.result.score = 0;
        this.gameQuestions.forEach(function (question) {
          if (question.givenAnswer === question.answer) {
            $scope.result.score++;
          }
        });

        $scope.result.color = '';

        if ($scope.result.score < 4) {
          $scope.result.type = 'danger';
          $scope.result.color = '#c12e2a';
          $scope.result.txt = 'Ups! you have to improve.';
        }
        else if ($scope.result.score < 6) {
          $scope.result.type = 'warning';
          $scope.result.color = '#eb9316';
          $scope.result.txt = 'That\'s the spirit! you are on the good way.';
        }
        else if ($scope.result.score < 8) {
          $scope.result.type = 'info';
          $scope.result.color = '#2aabd2';
          $scope.result.txt = 'Hey! Well done!';
        }
        else if ($scope.result.score < 10) {
          $scope.result.type = 'success';
          $scope.result.color = '#419641';
          $scope.result.txt = 'Well done! almost perfect!';
        }
        else {
          $scope.result.type = 'success';
          $scope.result.color = '#419641';
          $scope.result.txt = 'Congratulations! perfect play ;)';
        }

        if ($scope.modal) {
          $scope.modal.remove();
          delete $scope.modal
        }
        $ionicModal.fromTemplateUrl('templates/games/basic-test/basic-test-modal.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function (modal) {
          $scope.modal = modal;
          $scope.modal.show();
        });

      };

      $scope.tryAgain = function () {
        $scope.modal.hide();
        self.showResults = false;
        self.retrying=true;
        self.showAnswer(0);
      };

      $scope.reviewResults = function () {
        $scope.modal.hide();
        self.showResults = true;
        self.showAnswer(0);
        //self.showFirstWrongAnswer();
      };

      $scope.playAgain = function () {
        $scope.modal.hide();

        self.playAgain();
      };

      $scope.$on('$destroy', function () {
        self.removeModal();
      });

      this.removeModal = function () {
        if ($scope.modal) {
          $scope.modal.remove();
        }
      }
    },
    controllerAs: 'basicTestCtrl',
    link: function ($scope, element, attrs, ctrl) {
      $log.log("basic-test:link enter");
      ctrl.init();

      $scope.$on('ms:logout', function () {
        ctrl.init();
      });
      $scope.$on('ms:login', function () {
        ctrl.init();
      });
    }
  };
});
