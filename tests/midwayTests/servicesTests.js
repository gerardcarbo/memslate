/**
 * Created by gerard on 23/04/2015.
 */
"use strict";

describe("Midway: Services Tests", function () {
    var tester;

    var module;
    beforeEach(function () {
        module = angular.module("memslate");
    });

    beforeEach(function () {
        if (tester) {
            tester.destroy();
        }
        tester = ngMidwayTester('memslate');
    });

    describe('Registration Service tests', function () {
        var UserService;

        var registerData = {};
        registerData.name = 'test';
        registerData.email = 'test@testtest.com';
        registerData.password = 'testtest';
        registerData.password2 = 'testtest';
        var newPassword = "testtest2";

        beforeEach(function () {
            UserService = tester.inject('UserService');
        });

        beforeEach(function (done) {
            //try to unregister first (if previous test failed)
            UserService.login(registerData.email, registerData.password).then(function (res) {
                if (res.done) {
                    UserService.unregister().then(function () {
                        done()
                    });
                }
                else {
                    UserService.login(registerData.email, newPassword).then(function (res) {
                        if (res.done) {
                            UserService.unregister().then(function () {
                                done()
                            });
                        }
                        else {
                            done();
                        }
                    });
                }
            });
        });

        it("Register, Change Password, Login, Change Password, Login, Unregister", function (done) {
            UserService.register(registerData).then(function (result) {
                    console.log('register: ', result);
                    expect(result.done).toEqual(true);
                    return UserService.changePassword(registerData.password, newPassword);
                }
            ).then(function (res) {
                    console.log('changePassword', res);
                    expect(res.done).toBe(true);
                    return UserService.logout();
                }
            ).then(function (res) {
                    console.log('logout', res);
                    expect(res.done).toBe(true);
                    return UserService.login(registerData.email, newPassword);
                }
            ).then(function (res) {
                    console.log('login new pwd', res);
                    expect(res.done).toBe(true);
                    return UserService.changePassword(newPassword, registerData.password);
                }
            ).then(function (res) {
                    console.log('changePassword II', res);
                    expect(res.done).toBe(true);
                    return UserService.login(registerData.email, registerData.password);
                }
            ).then(function (res) {
                    console.log('login new pwd II', res);
                    expect(res.done).toBe(true);
                    return UserService.unregister();
                }
            ).then(function (res) {
                    console.log('unregister', res);
                    expect(res.done).toBe(true);
                    done();
                }
            )
        },15000);

        it("Register, Logout, Login fail, Login, Unregister", function (done) {
            UserService.register(registerData).then(function (result) {
                    console.log('register: ', result)
                    expect(result.done).toEqual(true);
                    return true;
                }
            ).then(function () {
                    console.log('logout');
                    return UserService.logout();
                }
            ).then(function () {
                    console.log('login fail');
                    return UserService.login('test@testtest.com', 'KKKK'); //login failed
                }
            ).then(function (res) {
                    console.log('login failed: ', res);
                    expect(res.done).toBe(false); //invalid login data. should have failed.
                    return UserService.login('test@testtest.com', 'testtest');
                }
            ).then(function (res) {
                    console.log('login succeeded: ', res);
                    expect(res.done).toBe(true); //valid login data. should have succeeded.
                    //login succeeded -> unregister
                    return UserService.unregister();
                }
            ).then(function (res) {
                    console.log('unregister: ', res);
                    expect(res.done).toBe(true);
                    return UserService.login('test@testtest.com', 'testtest');
                }
            ).then(function (res) {
                    console.log('login failed: ', res);
                    expect(res.done).toBe(false);
                    done();
                },
                function (err) {
                    console.log(err);
                    expect(true).toBe(false); //should have logged in
                }
            );
        });
    });

    describe('Games Service tests', function () {
        var GamesService;
        var gameOneName;

        beforeEach(function () {
            GamesService = tester.inject('GamesService');
        });

        it("should get all games (1)", function (done) {
            GamesService.getGames().success(function (games) {
                console.log(games);
                expect(games.length).toBe(1);
                gameOneName = games[0].name_id;
                done();
            }).error(function (error) {
                expect(error).toBeUndefined();
                done();
            });
        });

        it("should get game 1 languages", function (done) {
            GamesService.getGame(gameOneName, 'languages').success(function (gameLangs) {
                console.log(gameLangs);
                expect(gameLangs.length).toBeGreaterThan(1);
                done();
            }).error(function (error) {
                expect(error).toBeUndefined();
                done();
            });
        });

        var fromLang = 'en';
        var toLang = 'es';
        var numQuestions = 10;
        var numAnswers = 5;
        it("should get 10 questions from game 1 ", function (done) {
            GamesService.getGame(gameOneName, 'questions?fromLang=' + fromLang + '&toLang=' + toLang + '&questions=' + numQuestions + '&answers=' + numAnswers).success(function (gameQuestions) {
                console.log(gameQuestions);
                expect(gameQuestions.length).toBe(numQuestions);
                gameQuestions.forEach(function (question) {
                    expect(question.question).toBeDefined();
                    expect(question.answer).toBeDefined();
                    var matchs = 0;
                    var given = {}; //given options
                    question.options.forEach(function (option) {
                        if (option === question.answer) matchs++;
                        expect(given[option]).toBeUndefined();
                        given[option] = option;
                    });
                    expect(matchs).toBe(1);
                });
                done();
            }).error(function (error) {
                expect(error).toBeUndefined();
                done();
            });
        });
    });
});
