/**
 * Created by gerard on 22/07/2015.
 */
"use strict";

var appGame = angular.module('memslate.directives');

appGame.directive('basicTestGame', function ($location, $ionicScrollDelegate, $ionicModal, GamesService, LanguagesService, SessionService, UI) {
    return {
        restrict: 'E',
        templateUrl: 'templates/games/basic-test/basic-test-template.html',
        replace: true,
        controller: function ($scope, $timeout) {
            var self = this;
            this.numQuestions=10;
            this.numAnswers=5;
            this.showResults=false;

            $ionicModal.fromTemplateUrl('templates/games/basic-test/basic-test-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modal = modal
            });
            
            this.allResponsesGiven = false;

            this.startTest = function () {
                var self=this;
                SessionService.put('basicTestSelectedLangs', this.selectedLangs);
                this.testStarted = true;

                var langs=this.selectedLangs.split('-');

                GamesService.getGame('basic-test', 'questions?fromLang=' + langs[0] + '&toLang=' + langs[1] + '&questions=' + this.numQuestions + '&answers=' + this.numAnswers).success(function (gameQuestions) {
                    console.log(gameQuestions);
                    self.gameQuestions=gameQuestions;
                });
            };

            this.answerSelected = function(idQuestion, idResponse)
            {
                this.checkAllResponsesDone();
                if(idQuestion < this.numQuestions-1 && !this.allResponsesGiven)
                {
                    $location.hash('test_div_'+(idQuestion+1));
                    $ionicScrollDelegate.anchorScroll(true);
                }
            };

            this.checkAllResponsesDone = function()
            {
                var allDone=true;
                var length=this.gameQuestions.length;
                for(var i=0;i<length;i++)
                {
                    if(this.gameQuestions[i].givenAnswer === undefined)
                    {
                        allDone=false;
                        break;
                    }
                }
                this.allResponsesGiven=allDone;
            };

            this.showAnswer = function(i) {
                $location.hash('test_div_' + (i));
                $ionicScrollDelegate.anchorScroll(true);
            };

            this.showFirstNonResponseAnswer = function()
            {
                var length=this.gameQuestions.length;
                for(var i=0;i<length;i++) {
                    if (this.gameQuestions[i].givenAnswer === undefined) {
                        this.showAnswer(i);
                        break;
                    }
                }
            };

            this.showFirstWrongAnswer = function()
            {
                var length=this.gameQuestions.length;
                for(var i=0;i<length;i++) {
                    if (this.gameQuestions[i].options[this.gameQuestions[i].givenAnswer] !== this.gameQuestions[i].answer) {
                        this.showAnswer(i);
                        break;
                    }
                }
            };

            this.evaluateTest = function()
            {
                if(!this.allResponsesGiven)
                {
                    UI.toast('Not all responses given...');
                    this.showFirstNonResponseAnswer();
                    return;
                }

                $scope.result = {};
                $scope.result.score = 0;
                this.gameQuestions.forEach(function(question){
                    if(question.givenAnswer === question.answer)
                    {
                        $scope.result.score++;
                    }
                });

                $scope.result.color = '';

                if($scope.result.score<4)		{$scope.result.type='danger';$scope.result.color='#c12e2a';$scope.result.txt='Ups! you have to improve.';}
                else if($scope.result.score<6)	{$scope.result.type='warning';$scope.result.color='#eb9316';$scope.result.txt='Hey! almost OK.';}
                else if($scope.result.score<8)	{$scope.result.type='info';$scope.result.color='#2aabd2';$scope.result.txt='That\'s the spirit! you are on the good way.';}
                else if($scope.result.score<10)	{$scope.result.type='success';$scope.result.color='#419641';$scope.result.txt='Well done! almost perfect!';}
                else 							{$scope.result.type='success';$scope.result.color='#419641';$scope.result.txt='Congratulations! perfect play ;)';}
                
                $scope.modal.show();
            };

            $scope.tryAgain = function() {
                $scope.modal.hide();
                self.showResults=false;
                self.showAnswer(0);
            };

            $scope.reviewResults = function() {
                $scope.modal.hide();
                self.showResults=true;
                self.showFirstWrongAnswer();
            };

            $scope.playAgain = function() {
                $scope.modal.hide();
                self.gameQuestions=undefined;
                self.testStarted=false;
                $ionicScrollDelegate.scrollTop(true);
            }

            $scope.$on('$destroy', function() {
                self.removeModal();
            });

            this.removeModal = function(){
                if($scope.modal)
                {
                    $scope.modal.remove();
                }
            }

        },
        controllerAs: 'basicTestCtrl',
        link: function ($scope, element, attrs, ctrl) {
            LanguagesService.getLanguages().then(function(){
                "use strict";
                ctrl.testStarted = false;
                GamesService.getGame('basic-test', 'languages').success(function (gameLangs) {
                    ctrl.gameLangs = [];
                    gameLangs.forEach(function (langs) {
                        "use strict";
                        ctrl.gameLangs = ctrl.gameLangs || [];
                        if (langs.count > 60) {
                            ctrl.gameLangs.push({
                                name: "" + LanguagesService.getLanguage(langs.fromLang).name + " > " + LanguagesService.getLanguage(langs.toLang).name + "",
                                value: langs.fromLang + '-' + langs.toLang
                            })
                        }
                    });

                    var selectedLangs=SessionService.get('basicTestSelectedLangs');
                    if(selectedLangs)
                    {
                        ctrl.selectedLangs = selectedLangs;
                    }
                    else
                    {
                        if(ctrl.gameLangs[0])
                        {
                            ctrl.selectedLangs = ctrl.gameLangs[0].value;
                        }
                    }
                });
            });
        }
    };
});