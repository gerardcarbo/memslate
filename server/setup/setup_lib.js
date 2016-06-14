"use strict";
var config = require('../config');
var knex = require('knex')(config.knex_options);
var Promise = require('bluebird');
var bookshelf = require('bookshelf')(knex);
var models = require('../models')(bookshelf);
var when = require('when/when');
var _ = require('lodash');
var request = require('request-promise');
var Sequence = require('when/sequence');
var difficulty = require('./../difficulty')(models);

module.exports = function (knex, models) {
    function cleanUserTranslations(userId) {
        return knex.raw('DELETE FROM public."UserTranslations" as ut WHERE ut."userId"=' + userId);
    }

    function refreshAnonymousUserTranslations(userId) {
        console.log('refreshAnonymousUserTranslations: enter');
        return models.TranslationsAnonymous.query({
            select: '*'
        }).fetchAll().then(function (anonymousTranlations) {
            if (anonymousTranlations) {
                //copy translations
                return Promise.reduce(anonymousTranlations.models, function (total, tr) {
                        delete tr.attributes.id;
                        var translation = {
                            fromLang: tr.attributes.fromLang,
                            toLang: tr.attributes.toLang,
                            translate: tr.attributes.translate,
                        };
                        //console.log('refreshAnonymousUserTranslations: searching: ', translation );
                        return new models.Translations(translation).fetch().then(function (translationModel) {
                            if (!translationModel) {
                                console.log('refreshAnonymousUserTranslations: not found:', translation.translate);
                                return new models.Translations(tr.attributes).save().then(function (savedTranslation) {
                                    total.translations.push(savedTranslation);
                                    total.count++;
                                    return total;
                                });
                            }
                            else {
                                total.translations.push(translationModel);
                                return total;
                            }
                        });
                    }, {count: 0, translations: []})
                    .then(function (translations) {
                        console.log('refreshAnonymousUserTranslations: anonymous translation copy done!!!');
                        console.log('refreshAnonymousUserTranslations: cleaning user translations');
                        return cleanUserTranslations(config.ANONIMOUS_USER_ID)
                            .then(function () {
                                console.log('refreshAnonymousUserTranslations: cleanAnonymousTranslations done!!!');
                                console.log('refreshAnonymousUserTranslations: translations copied from anonymousTranslations. Creating '+translations.translations.length+' UserTranslations...');
                                var total2 = [translations.count, 0]; //reduce value!
                                return Promise.reduce(translations.translations, function (total, tr) {
                                    if(tr.get('translate') == tr.get('mainResult')) return total; //do not copy idem translations
                                    return models.UserTranslations.forge({
                                        userId: userId,
                                        translationId: tr.id
                                    }).fetch().then(function (userTranslation) {
                                        if (!userTranslation) {
                                            return new models.UserTranslations({
                                                userId: userId,
                                                translationId: tr.id,
                                                userTranslationInsertTime: tr.get('insertTime')
                                            }).save().then(function (saverTranslation) {
                                                if (saverTranslation) {
                                                    total[1]++;
                                                }
                                                return total;
                                            });
                                        } else {
                                            return total;
                                        }
                                    });
                                }, total2);
                            });
                    });
            }
        });
    };

    function computeDifficulty() {
        return models.Translations.query({select:'*', where: {difficulty: 0.5}})
            .fetchAll()
            .then(function (translations) {
                if (translations && translations.length) {console.log('computeDifficulty: found to compute -> '+translations.length);}
                return Promise.all(translations.map(function (translation) {
                    var wordEn, wordOther;
                    if(translation.attributes.fromLang=='en')
                    {
                        wordEn = translation.attributes.translate;
                        wordOther = translation.attributes.mainResult;
                    }
                    else if(translation.attributes.toLang=='en')
                    {
                        wordOther = translation.attributes.translate;
                        wordEn = translation.attributes.mainResult;
                    }

                    if(wordEn) return difficulty.compute(wordEn, wordOther).then(function(difficulty){
                        return translation.set('difficulty', difficulty).save().then(function(){/*console.log('computeDifficulty: done for '+wordEn+' - '+wordOther+' : '+difficulty)*/});
                    });
                    return false;
            }));
        });
    }

    function loadMostUsedWords(fileName, pos) {
        var fs = require('fs');
        var parse = require('csv-parse');
        var index = 0;
        var i = 0;

        console.log('loadMostUsedWords: enter');

        var parser = parse({delimiter: ',', trim: true});
        var queries = [];
        var inserts = [];

        parser.on('readable', function () {
            var record;

            while (record = parser.read()) {
                var word = record[pos].trim();

                //console.log('loadMostUsedWords: readen ('+(i++)+') '+word);
                var query = function () {
                    return new models.MostUsedWords({
                        word: word
                    }).fetch().then(function (model) {
                        if (!model) {
                            i++;
                            console.log('loadMostUsedWords:' + i + ' NOT on DB word: ' + word);
                            inserts.push(function () {
                                index++;
                                return new models.MostUsedWords({
                                    position: index,
                                    word: word
                                }).save().then(function () {
                                    console.log('loadMostUsedWords:' + index + '  ' + word + ' saved');
                                }).catch(function (err) {
                                    index--;
                                    console.warn('loadMostUsedWords:' + index + ' EXCEPTION while adding - ' + word + ' -> ', err.detail);
                                });
                            });
                        }
                        return true;
                    });
                };
                queries.push(query);
            }
        });

        var doneParsingPr2 = new Promise(function (resolve, reject) {
            parser.on('end', function () {
                    console.log('loadMostUsedWords: file parsed');
                    resolve();
                }
            );
            parser.on('error', function (error) {
                    console.log('loadMostUsedWords: parser.on(error) ', error);
                    reject();
                }
            );
        });

        var file = fs.createReadStream(fileName);
        file.pipe(parser);

        return doneParsingPr2.delay(1000).then(function () {
            console.log('loadMostUsedWords: Inserting words...');
            return Sequence(queries).then(function () {
                return Sequence(inserts);
            });
        });
    }

    function addTranslationsAnonymous(fileName, pos, start, limit, lang) {
        var fs = require('fs');
        var parse = require('csv-parse');
        var index = 0;
        var translated = {};

        console.log('addTranslationsAnonymous: ' + start + '->' + limit + ' (' + lang + ')');

        var parser = parse({delimiter: ',', trim: true});
        var tasks = [];
        var queries = [];

        parser.on('readable', function () {
            var record;
            while (record = parser.read()) {
                //console.log('Processing index: '+index);

                if (index < start) {
                    index++;
                    continue;
                }
                if (index >= limit) {
                    file.destroy();
                    parser.end()
                }
                else {
                    var word = record[pos].trim();

                    if (translated[word] === undefined) {
                        translated[word] = word;
                        if (word.length > 3) {
                            //console.log('addTranslationsAnonymous:Processing word: ' + index + ': ' + word);
                            var query = new models.TranslationsAnonymous({
                                translate: word,
                                fromLang: 'en',
                                toLang: lang
                            }).fetch().then(function (model) {
                                if (!model) {
                                    console.log('NOT on DB word: ' + word);
                                    tasks.push(function () {
                                        return translateDict(word, 'en', lang, onTranslated).delay(Math.floor(Math.random() * 30) * 100);
                                    });
                                }
                            });

                            queries.push(query);
                            index++;
                        }
                    }
                }
            }
        });

        var doneParsingPr = new Promise(function (resolve, reject) {
            parser.on('end', function () {
                    console.log('addTranslationsAnonymous: file parsed');
                    resolve();
                }
            );
            parser.on('error', function (error) {
                    console.log('addTranslationsAnonymous: parser.on(error) ', error);
                    reject();
                }
            );
        });

        var file = fs.createReadStream(fileName);
        file.pipe(parser);

        return doneParsingPr.delay(1000).then(function () {
            console.log('addTranslationsAnonymous: Waiting queries...');
            return Promise.all(queries).then(function () {
                console.log('addTranslationsAnonymous: Starting sequence...');
                return Sequence(tasks);
            });
        });
    }

    function translateDict(word, fromLang, toLang, onTranslated, plural) {
        console.log("translateDict: '" + word + "' ...");

        var options = {
            uri: 'https://dictionary.yandex.net/api/v1/dicservice.json/lookup',
            qs: {
                key: 'dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb',
                lang: fromLang + "-" + toLang,
                text: word,
                ui: 'en'
            }
        };

        return request(options).then(function (data) {
            var result = JSON.parse(data);
            if (result.def[0]) {
                return onTranslated(word, fromLang, toLang, result, 'yd');
            }
            else {
                if(word[word.length-1] == 's') //is plural
                {
                    console.log("Error Translating: " + word + " not found. Trying with '"+word.substring(0,word.length-1)+"'");
                    return translateDict(word.substring(0,word.length-1),fromLang, toLang, onTranslated, true);
                }
                else
                {
                    console.log("Error Translating: " + word + " not found. Trying with translate service");
                    if(plural)
                    {
                        word += 's'; //reconstruct plural
                    }
                    return translateTranslate(word, fromLang, toLang, onTranslated);
                }
            }
        }).catch(function (err) {
            console.log("Exception Translating: " + word + " -> ", err);
        });
    }

    function translateTranslate(word, fromLang, toLang, onTranslated) {
        console.log("translateTranslate: '" + word + "' ...");
        var options2 = {
            uri: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
            qs: {
                key: 'trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430',
                lang: fromLang + "-" + toLang,
                text: word,
                ui: 'en'
            }
        };

        return request(options2).then(function (data2) {
            var result2 = JSON.parse(data2);
            return onTranslated(word, fromLang, toLang, result2, 'yt');
        });
    }

    function onTranslated(word, fromLang, toLang, result, provider) {
        if (provider == 'yd' && !result.def[0]) return Promise.resolve(true);
        if (provider == 'yt' && (!result.text || result.text[0] == word)){
            console.log("onTranslated(yt): translation not found for: "+word);
            return Promise.resolve(false);
        }

        var mainResult = (provider == 'yd' ? result.def[0].tr[0].text : result.text[0]);
        mainResult = mainResult.replace('-',' ');
        mainResult = mainResult.replace('el ','');
        mainResult = mainResult.replace('la ','');
        mainResult = mainResult.replace('los ','');
        mainResult = mainResult.replace('las ','');
        mainResult = mainResult.replace('the ','');
        mainResult = mainResult.replace('le ','');
        mainResult = mainResult.replace('les ','');
        mainResult = mainResult.trimChars('\'');
        mainResult = mainResult.trimChars('(');
        mainResult = mainResult.trimChars(')');
        if(mainResult == "" || mainResult == " " || mainResult == "  " || mainResult == "?") {
            console.log("onTranslated: ERROR no translation for '"+word+"' -> mainResult: '"+mainResult+"'");
            return Promise.resolve(false);
        }

        var prAdd = addTranslation(word, fromLang, toLang, mainResult, result, provider);

        //reverse translation
        var prRevTransl = new models.TranslationsAnonymous({
                translate: mainResult,
                fromLang: toLang,
                toLang: fromLang
            }).fetch().then(function (model) {
                if (!model) {
                    return translateDict(mainResult, toLang, fromLang, onReverseTranslated).delay(Math.floor(Math.random() * 30) * 100);
                }
                return Promise.resolve(false);
            });
        return Promise.all([prAdd, prRevTransl]);
    }

    function onReverseTranslated(word, fromLang, toLang, result, provider) {
        var mainResult = (provider == 'yd' ? result.def[0].tr[0].text : result.text[0]);
        return addTranslation(word, fromLang, toLang, mainResult, result, provider);
    }

    function addTranslation(translate, fromLang, toLang, mainResult, result, provider) {
        if (provider == 'yd' && !result.def[0]) return Promise.resolve(false);
        if (provider == 'yt' && !result.text && !result.text[0]) return Promise.resolve(false);

        console.log("addTranslation(" + provider + "): " + translate + " -> " + mainResult);

        var translation = {
            provider: provider,
            translate: translate,
            fromLang: fromLang,
            toLang: toLang,
            transcription: (provider == 'yd' ? result.def[0].ts : ''),
            mainResult: mainResult,
            rawResult: result
        };

        return new models.TranslationsAnonymous({
            translate: translate,
            fromLang: fromLang,
            toLang: toLang
        }).fetch().then(function (model) {
            if (!model) {
                return new models.TranslationsAnonymous(translation).save();
            }
        });
    };

    function createUsers() {
        var admin = {
            name: 'Memslate admin user',
            email: 'admin@memslate.com',
            password: '_.,$late_',
            isAdmin: true
        };

        var anonymous = {
            name: 'Memslate anonymous user',
            email: 'anonymous@memslate.com',
            password: 'Memolate_'
        };

        return models.User.createUser(admin).then(function () {
            return models.User.createUser(anonymous);
        });
    };

    function createGames() {
        var games = [
            {
                name_id: 'basic-test',
                name: 'Basic Test',
                description: 'Performs a basic test based on previous translations'
            }
        ];

        var prGames = games.map(function (game) {
            return new models.Games(game).fetch().then(function (gameModel) {
                if (!gameModel) {
                    console.log('Creating game: ' + game.name);
                    new models.Games(game).save();
                }
                else {
                    console.log('Game ' + game.name + ' already created.');
                }
            });
        });

        return Promise.all(prGames);
    };

    return {
        createUsers: createUsers,
        createGames: createGames,
        cleanAnonymousTranslations: cleanUserTranslations,
        refreshAnonymousUserTranslations: refreshAnonymousUserTranslations,
        addTranslationsAnonymous: addTranslationsAnonymous,
        loadMostUsedWords: loadMostUsedWords,
        computeDifficulty: computeDifficulty
    }
}
;