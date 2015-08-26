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

    /*    describe("LanguagesService Tests", function () {
     // set up some data for the http call to return and test later.
     var LanguagesService;
     beforeEach(function () {
     LanguagesService = tester.inject('LanguagesService');
     });

        it("should get User Languages method server", function (done) {
            LanguagesService.clearUserLanguages();

     LanguagesService.getUserLanguages().then(
     function (response) {
     var userLangs = response;

     expect(userLangs.userId).toBeDefined();
     expect(userLangs.fromLang).toBeDefined();
     expect(userLangs.toLang).toBeDefined();
     expect(userLangs.prefered).toBeDefined();

     expect(userLangs.userId).toBe(2);
     expect(userLangs.fromLang).toBe('es');
     expect(userLangs.toLang).toBe('en');
     expect(userLangs.prefered.length).toBe(2);
     expect(userLangs.prefered[0]).toBe('en');
     expect(userLangs.prefered[1]).toBe('es');

     return true;
     },
     function (err) {
     console.log('getUserLanguages method' + err);
     expect(err).toBeNull();

     return false;
     }).then(function () {
     LanguagesService.fromLang('fr');
     LanguagesService.toLang('ru');
     LanguagesService.addPrefered('fr');
     LanguagesService.addPrefered('ru');

     LanguagesService.getUserLanguages().then(
     function (response) {
     var userLangs = response;

     expect(userLangs.fromLang).toBe('fr');
     expect(userLangs.toLang).toBe('ru');
     expect(userLangs.prefered.length).toBe(4);
     expect(userLangs.prefered[0]).toBe('ru');
     expect(userLangs.prefered[1]).toBe('fr');

     done();
     },
     function (err) {
     console.log('getUserLanguages II method' + err);
     expect(err).toBeNull();

     done();
     });

     });
     });


        it("should get Languages from server", function (done) {
            LanguagesService.clearUserLanguages();

            LanguagesService.getLanguages().then(
                function (response) {
                    var languages = response;
                    return languages;
                },
                function (err) {
                    console.log('getUserLanguages method' + err);
                    expect(err).toBeNull();
                    done();
                }).then(function (languages) {
                    if (languages) {
                        expect(languages.user.fromLang).toBeDefined();
                        expect(languages.user.toLang).toBeDefined();
                        expect(languages.items).toBeDefined();
                        expect(languages.user.prefered).toBeDefined();
                        expect(languages.user.fromLang).toBe('es');
                        expect(languages.user.toLang).toBe('en');
                        expect(languages.items.length).toBeDefined();
                        expect(languages.items.length).toBeGreaterThan(50);
                        expect(languages.user.prefered.length).toBeDefined();
                        expect(languages.user.prefered.length).toBe(2);
                        done();
                    }
                });
        });
    });

    /*    describe('Translate Service tests', function () {
     var TranslateService;
     var LanguagesService;
     var MemoFilterService;
     var translation5;
        var MemoFilterService;
        var translation5;

        beforeEach(function () {
            TranslateService = tester.inject('TranslateService');
            LanguagesService = tester.inject('LanguagesService');
            MemoFilterService = tester.inject('MemoFilterService');
        });

     it("should translate simple word", function (done) {
     LanguagesService.clearUserLanguages();

     var translationCake = {};
     TranslateService.translate('en', 'es', 'cake').then(
     function (response) {
     console.log(response)
     translationCake = response;

     expect(translationCake.id).not.toBe(0);
     expect(translationCake.translate).toBe('cake');
     expect(translationCake.mainResult).toBe('pastel');
     expect(translationCake.fromLang).toBe('en');
     expect(translationCake.toLang).toBe('es');
     expect(translationCake.provider).toBe('yd');
     expect(translationCake.rawResult).toBeDefined();
     //expect(translationCake.rawResult).toEqual(responseGetCake);

     done();
     },
     function (err) {
     console.log('translate method' + err);
     expect(err).toBeNull();

     done();
     });
     });

        it("should translate a phrase (multiple words)", function (done) {
            var translationDoMore = {};
            TranslateService.translate('en', 'es', 'do less').then(
                function (response) {
                    console.log('translation multiple word')
                    console.log(response);
                    translationDoMore = response;

     expect(translationDoMore.id).not.toBe(0);
     expect(translationDoMore.translate).toBe('do less');
     expect(translationDoMore.mainResult).toBe('hacer menos');
     expect(translationDoMore.fromLang).toBe('en');
     expect(translationDoMore.toLang).toBe('es');
     expect(translationDoMore.provider).toBe('yt');
     expect(translationDoMore.rawResult).toBeDefined();
     //expect(translationDoMore.rawResult).toEqual(responseGetDoMoreTransl);

     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     it("should keep translate languages between sessions", function (done) {
     LanguagesService.getUserLanguages().then(
     function (userLangs) {

     expect(userLangs.fromLang).toBe('en');
     expect(userLangs.toLang).toBe('es');

     done();
     },
     function (err) {
     console.log('getUserLanguages error' + err);
     expect(err).toBeNull();

     done();
     });
     });

        it("should get 10 translations ordered alphabetically (default value)", function (done) {
            TranslateService.getTranslations(null).then(function (result) {
                    expect(result).not.toBeNull();
                    expect(result.length).toBe(10);
                    expect(result[0].translate).toBe('and');

                    for (var i = 0; i < 10 - 1; i++) {
                        expect(result[i].translate <= result[i + 1].translate).toBeTruthy();
                    }

                    translation5 = result[5];

                    done();
                },
                function (err) {
                    console.log('translate error' + err);
                    expect(err).toBeNull();

                    done();
                });
        },10000);

        it("should get 5 translations, skip 5 ordered alphabetically", function (done) {
            TranslateService.getTranslations({offset: 5, limit: 5}).then(function (result) {
                    expect(result).not.toBeNull();
                    expect(result.length).toBe(5);
                    expect(result[0].translate).toBe(translation5.translate);
                    done();
                },
                function (err) {
                    console.log('translate error' + err);
                    expect(err).toBeNull();

                    done();
                });
        });

        it("should order desc alphabetically", function (done) {
            TranslateService.getTranslations({orderWay: 'desc'}).then(function (result) {
                    expect(result).not.toBeNull();
                    expect(result.length).toBe(10);
                    expect(result[0].translate).toBe('you');

                    for (var i = 0; i < 10 - 1; i++) {
                        expect(result[i].translate >= result[i + 1].translate).toBeTruthy();
                    }

                    done();
                },
                function (err) {
                    console.log('translate error' + err);
                    expect(err).toBeNull();

                    done();
                });
        });


        it("should order by time asc", function (done) {
            TranslateService.getTranslations({
                    limit: 200,
                    orderBy: 'UserTranslations.userTranslationInsertTime',
                    orderWay: 'asc'
                }).then(function (result) {
                    expect(result).not.toBeNull();
                    expect(result.length).toBeLessThan(101);
                    for (var i = 0; i < result.length - 1; i++) {
                        expect(new Date(result[i].userTranslationInsertTime) <= new Date(result[i + 1].userTranslationInsertTime)).toBeTruthy();
                    }
                    done();
                },
                function (err) {
                    console.log('translate error' + err);
                    expect(err).toBeNull();

                    done();
                });
        });

        it("should order by time desc", function (done) {
            TranslateService.getTranslations({
                    limit: 200,
                    orderBy: 'UserTranslations.userTranslationInsertTime',
                    orderWay: 'desc'
                }).then(function (result) {
                    expect(result).not.toBeNull();
                    expect(result.length).toBeLessThan(101);
                    for (var i = 0; i < result.length - 1; i++) {
                        expect(new Date(result[i].userTranslationInsertTime) >= new Date(result[i + 1].userTranslationInsertTime)).toBeTruthy();
                    }
                    done();
                },
                function (err) {
                    console.log('translate error' + err);
                    expect(err).toBeNull();

                    done();
                });
        });

        it("should order by languages asc", function (done) {
            TranslateService.getTranslations({
                    limit: 200,
                    orderBy: 'Translations.fromLang,Translations.toLang',
                    orderWay: 'asc'
                }).then(function (result) {
                    expect(result).not.toBeNull();
                    for (var i = 0; i < result.length - 1; i++) {
/*                        if (!(result[i].toLang <= result[i + 1].toLang))
                            console.log('*** langs asc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);
                        else
                            console.log('langs asc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);*/

                        expect(result[i].fromLang <= result[i + 1].fromLang).toBeTruthy();
                        if (result[i].fromLang == result[i + 1].fromLang) {
                            expect(result[i].toLang <= result[i + 1].toLang).toBeTruthy();
                        }
                    }
                    expect(result.length).toBeLessThan(101);
                    done();
                },
                function (err) {
                    console.log('translate error' + err);
                    expect(err).toBeNull();

                    done();
                });
        });

        it("should order by languages desc", function (done) {
            TranslateService.getTranslations({
                    limit: 200,
                    orderBy: 'Translations.fromLang,Translations.toLang',
                    orderWay: 'desc'
                }).then(function (result) {
                    expect(result).not.toBeNull();
                    expect(result.length).toBeLessThan(101);
                    for (var i = 0; i < result.length - 1; i++) {
                        /*if (result[i].fromLang == result[i + 1].fromLang && !(result[i].toLang >= result[i + 1].toLang))
                            console.log('*** langs desc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);
                        else
                            console.log('langs desc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);*/

                        expect(result[i].fromLang >= result[i + 1].fromLang).toBeTruthy();
                        if (result[i].fromLang == result[i + 1].fromLang) {
                            expect(result[i].toLang >= result[i + 1].toLang).toBeTruthy();
                        }
                    }
                    done();
                },
                function (err) {
                    console.log('translate error' + err);
                    expect(err).toBeNull();

                    done();
                });
        });

        it("should get 1 translations with projection on columns: id, fromLang, toLang, userTranslationInsertTime, translate, mainResult", function (done) {
            TranslateService.getTranslations({limit: 1, columns: "Translations.id, fromLang, toLang, userTranslationInsertTime as insertTime, translate, mainResult"}).then(function(result) {
                    expect(result).not.toBeNull();
                    expect(result.length).toBe(1);

                    expect(result[0].id !== undefined).toBeTruthy();
                    expect(result[0].fromLang !== undefined).toBeTruthy();
                    expect(result[0].toLang !== undefined).toBeTruthy();
                    expect(result[0].insertTime !== undefined).toBeTruthy();
                    expect(result[0].translate !== undefined).toBeTruthy();
                    expect(result[0].mainResult !== undefined).toBeTruthy();
                    expect(result[0].rawResult === undefined).toBeTruthy();

                    expect(Object.keys(result[0]).length).toBe(7); //6 + 1 of userTranslationId

                    done();
                },
                function (err) {
                    console.log('getTranslations error' + err);
                    expect(err).toBeNull();

                    done();
                });
        });

        it("should get 1 translation based on id", function (done) {
            TranslateService.getTranslation(1).then(function (translation) {
                console.log("should get 1 translation based on id -> success: \n", translation);
                expect(translation.id).toBe(1);
                expect(translation.translate).toBe('and');
                expect(translation.rawResult.def).toBeDefined();

                done();
            },
            function(err){
                console.log('getTranslation error' + err);
                expect(err).toBeNull();

                done();
            });
        });
    });

     for (var i = 0; i < 10 - 1; i++) {
     expect(result[i].translate <= result[i + 1].translate).toBeTruthy();
     }

     translation5 = result[5];

     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     }, 10000);

     it("should get 5 translations, skip 5 ordered alphabetically", function (done) {
     TranslateService.getTranslations({offset: 5, limit: 5}).then(function (result) {
     expect(result).not.toBeNull();
     expect(result.length).toBe(5);
     expect(result[0].translate).toBe(translation5.translate);
     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     it("should order desc alphabetically", function (done) {
     TranslateService.getTranslations({orderWay: 'desc'}).then(function (result) {
     expect(result).not.toBeNull();
     expect(result.length).toBe(10);
     expect(result[0].translate).toBe('your');

     for (var i = 0; i < 10 - 1; i++) {
     expect(result[i].translate >= result[i + 1].translate).toBeTruthy();
     }

     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     var limit = 200;
     it("should order by time asc", function (done) {
     TranslateService.getTranslations({
     limit: limit,
     orderBy: 'UserTranslations.userTranslationInsertTime',
     orderWay: 'asc'
     }).then(function (result) {
     expect(result).not.toBeNull();
     expect(result.length).toBeLessThan(limit+1);
     for (var i = 0; i < result.length - 1; i++) {
     expect(new Date(result[i].userTranslationInsertTime) <= new Date(result[i + 1].userTranslationInsertTime)).toBeTruthy();
     }
     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     it("should order by time desc", function (done) {
     TranslateService.getTranslations({
     limit: limit,
     orderBy: 'UserTranslations.userTranslationInsertTime',
     orderWay: 'desc'
     }).then(function (result) {
     expect(result).not.toBeNull();
     expect(result.length).toBeLessThan(limit+1);
     for (var i = 0; i < result.length - 1; i++) {
     expect(new Date(result[i].userTranslationInsertTime) >= new Date(result[i + 1].userTranslationInsertTime)).toBeTruthy();
     }
     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     it("should order by languages asc", function (done) {
     TranslateService.getTranslations({
     limit: limit,
     orderBy: 'Translations.fromLang,Translations.toLang',
     orderWay: 'asc'
     }).then(function (result) {
     expect(result).not.toBeNull();
     for (var i = 0; i < result.length - 1; i++) {
     /!*                        if (!(result[i].toLang <= result[i + 1].toLang))
     console.log('*** langs asc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);
     else
     console.log('langs asc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);*!/

     expect(result[i].fromLang <= result[i + 1].fromLang).toBeTruthy();
     if (result[i].fromLang == result[i + 1].fromLang) {
     expect(result[i].toLang <= result[i + 1].toLang).toBeTruthy();
     }
     }
     expect(result.length).toBeLessThan(limit+1);
     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     it("should order by languages desc", function (done) {
     TranslateService.getTranslations({
     limit: 200,
     orderBy: 'Translations.fromLang,Translations.toLang',
     orderWay: 'desc'
     }).then(function (result) {
     expect(result).not.toBeNull();
     expect(result.length).toBeLessThan(limit+1);
     for (var i = 0; i < result.length - 1; i++) {
     /!*if (result[i].fromLang == result[i + 1].fromLang && !(result[i].toLang >= result[i + 1].toLang))
     console.log('*** langs desc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);
     else
     console.log('langs desc: ' + result[i].fromLang + ':' + result[i].toLang + ' > ' + result[i + 1].fromLang + ':' + result[i + 1].toLang);*!/

     expect(result[i].fromLang >= result[i + 1].fromLang).toBeTruthy();
     if (result[i].fromLang == result[i + 1].fromLang) {
     expect(result[i].toLang >= result[i + 1].toLang).toBeTruthy();
     }
     }
     done();
     },
     function (err) {
     console.log('translate error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     it("should get 1 translations with projection on columns: id, fromLang, toLang, userTranslationInsertTime, translate, mainResult", function (done) {
     TranslateService.getTranslations({
     limit: 1,
     columns: "Translations.id, fromLang, toLang, userTranslationInsertTime as insertTime, translate, mainResult"
     }).then(function (result) {
     expect(result).not.toBeNull();
     expect(result.length).toBe(1);

     expect(result[0].id !== undefined).toBeTruthy();
     expect(result[0].fromLang !== undefined).toBeTruthy();
     expect(result[0].toLang !== undefined).toBeTruthy();
     expect(result[0].insertTime !== undefined).toBeTruthy();
     expect(result[0].translate !== undefined).toBeTruthy();
     expect(result[0].mainResult !== undefined).toBeTruthy();
     expect(result[0].rawResult === undefined).toBeTruthy();

     expect(Object.keys(result[0]).length).toBe(7); //6 + 1 of userTranslationId

     done();
     },
     function (err) {
     console.log('getTranslations error' + err);
     expect(err).toBeNull();

     done();
     });
     });

     it("should get 1 translation based on id", function (done) {
     TranslateService.getTranslation(1).then(function (translation) {
     console.log("should get 1 translation based on id -> success: \n", translation);
     expect(translation.id).toBe(1);
     expect(translation.translate).toBe('and');
     expect(translation.rawResult.def).toBeDefined();

     done();
     },
     function (err) {
     console.log('getTranslation error' + err);
     expect(err).toBeNull();

     done();
     });
     });
     });*/

    /*    describe('Registration Service tests', function () {
     var RegistrationService;

     var registerData = {};
     registerData.name = 'test';
     registerData.email = 'test@testtest.com';
     registerData.password = 'testtest';
     registerData.password2 = 'testtest';
     var newPassword = "testtest2";

     beforeEach(function () {
     RegistrationService = tester.inject('RegistrationService');
     });

     beforeEach(function (done) {
     //try to unregister first (if previous test failed)
     RegistrationService.login(registerData.email, registerData.password).then(function (res) {
     if (res.done) {
     RegistrationService.unregister().then(function () {
     done()
     });
     }
     else {
     RegistrationService.login(registerData.email, newPassword).then(function (res) {
     if (res.done) {
     RegistrationService.unregister().then(function () {
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
     RegistrationService.register(registerData).then(function (result) {
     console.log('register: ', result);
     expect(result.done).toEqual(true);
     return RegistrationService.changePassword(registerData.password, newPassword);
     }
     ).then(function (res) {
     console.log('changePassword', res);
     expect(res.done).toBe(true);
     return RegistrationService.logout();
     }
     ).then(function (res) {
     console.log('logout', res);
     expect(res.done).toBe(true);
     return RegistrationService.login(registerData.email, newPassword);
     }
     ).then(function (res) {
     console.log('login new pwd', res);
     expect(res.done).toBe(true);
     return RegistrationService.changePassword(newPassword, registerData.password);
     }
     ).then(function (res) {
     console.log('changePassword II', res);
     expect(res.done).toBe(true);
     return RegistrationService.login(registerData.email, registerData.password);
     }
     ).then(function (res) {
     console.log('login new pwd II', res);
     expect(res.done).toBe(true);
     return RegistrationService.unregister();
     }
     ).then(function (res) {
     console.log('unregister', res);
     expect(res.done).toBe(true);
     done();
     }
     )
     });

     it("Register, Logout, Login fail, Login, Unregister", function (done) {
     RegistrationService.register(registerData).then(function (result) {
     console.log('register: ', result)
     expect(result.done).toEqual(true);
     return true;
     }
     ).then(function () {
     console.log('logout');
     return RegistrationService.logout();
     }
     ).then(function () {
     console.log('login fail');
     return RegistrationService.login('test@testtest.com', 'KKKK'); //login failed
     }
     ).then(function (res) {
     console.log('login failed: ', res);
     expect(res.done).toBe(false); //invalid login data. should have failed.
     return RegistrationService.login('test@testtest.com', 'testtest');
     }
     ).then(function (res) {
     console.log('login succeeded: ', res);
     expect(res.done).toBe(true); //valid login data. should have succeeded.
     //login succeeded -> unregister
     return RegistrationService.unregister();
     }
     ).then(function (res) {
     console.log('unregister: ', res);
     expect(res.done).toBe(true);
     return RegistrationService.login('test@testtest.com', 'testtest');
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
     });*/

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
                    var given={}; //given options
                    question.options.forEach(function (option) {
                        if (option === question.answer) matchs++;
                        expect(given[option]).toBeUndefined();
                        given[option]=option;
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
