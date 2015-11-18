"use strict";
var config = require('../config');
var knex = require('knex')(config.knex_options);
var Promise = require('knex/lib/promise');
var bookshelf = require('bookshelf')(knex);
var models = require('../models')(bookshelf);
var when = require('when/when');
var _ = require('lodash');
var request = require('request-promise');
var sequence = require('when/sequence');

module.exports = function (knex, models) {

    function cleanTranslations(userId) {
        return knex.raw('DELETE FROM public."UserTranslations" as ut WHERE ut."userId"=' + userId).then(function () {
            console.log('cleanTranslations:done');
            return true;
        });
    }

    function refreshAnonymousUserTranslations(userId) {
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
                        return new models.Translations(translation).fetch().then(function (translation) {
                            if (!translation) {
                                console.log('refreshAnonymousUserTranslations: not found:', translation);
                                new models.Translations(tr.attributes).save().then(function (savedTranslation) {
                                    total.translations.push(savedTranslation);
                                    total.count++;
                                });
                            }
                            else {
                                total.translations.push(translation);
                            }
                            return total;
                        });
                    }, {count: 0, translations: []})
                    .then(function (translations) {
                        //all translations copied -> create user translations
                        console.log('refreshAnonymousUserTranslations: translations copied from anonymousTranslations...')
                        var total2 = [translations.count, 0]; //reduce value!
                        return Promise.reduce(translations.translations, function (total, tr) {
                            return models.UserTranslations.forge({
                                userId: userId,
                                translationId: tr.id
                            }).fetch().then(function (userTranslation) {
                                if (!userTranslation) {
                                    new models.UserTranslations({
                                        userId: userId,
                                        translationId: tr.id
                                    }).save().then(function (saverTranslation) {
                                        if (saverTranslation) {
                                            total[1]++;
                                        }
                                    });
                                }

                                return total;
                            });
                        }, total2);
                    });
            }
        });
    };

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
                            console.log('Processing word: ' + index + ': ' + word);
                            var query = new models.TranslationsAnonymous({
                                translate: word,
                                fromLang: 'en',
                                toLang: lang
                            }).fetch().then(function (model) {
                                if (!model) {
                                    console.log('NOT on DB word: ' + word);
                                    tasks.push(function () {
                                        return translate(word, 'en', lang, onTranslated).delay(Math.floor(Math.random() * 30) * 100);
                                    });
                                }
                                else {
                                    console.log('Already on DB word: ' + word);
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
                    console.log('parser.on(end)');
                    resolve()
                }
            );
            parser.on('error', reject);
        });

        //file = fs.createReadStream(__dirname + '/mostUsedWords_en.csv');
        var file = fs.createReadStream(fileName);
        file.pipe(parser);

        return doneParsingPr.delay(1000).then(function () {
            console.log('Waiting queries...');
            return Promise.all(queries).then(function () {
                console.log('Starting sequence...');
                return sequence(tasks);
            });
        });
    }

    function translate(word, fromLang, toLang, onTranslated) {
        console.log("translating: '" + word + "' ...");

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
                console.log("Error Translating: " + word + " not found. Trying with translate service");

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
                })
            }
        }).catch(function (err) {
            console.log("Exception Translating: " + word + " -> ", err);
        });
    }

    function onTranslated(word, fromLang, toLang, result, provider) {
        if (provider == 'yd' && !result.def[0]) return Promise.resolve(true);
        if (provider == 'yt' && !result.text && !result.text[0]) return Promise.resolve(false);

        var mainResult = (provider == 'yd' ? result.def[0].tr[0].text : result.text[0]);

        var prAdd = addTranslation(word, fromLang, toLang, mainResult, result, provider);

        //reverse translation
        var prRevTransl = new models.TranslationsAnonymous({
            translate: mainResult,
            fromLang: toLang,
            toLang: fromLang
        }).fetch().then(function (model) {
            if (!model) {
                return translate(mainResult, toLang, fromLang, onReverseTranslated);
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

        return new models.TranslationsAnonymous(translation).save().then(function (model) {
            if (model) {
                console.log("addTranslation: added to TranslationsAnonymous " + model.attributes.translate + " (" + model.id + ")");
                return new models.Translations(translation).save().then(function (model2) {
                    console.log("addTranslation: added to Translations " + model2.attributes.translate + " (" + model2.id + ")");
                    var userTranslation = {
                        userId: 2,
                        translationId: model2.id
                    };
                    return new models.UserTranslations(userTranslation).save();
                });
            }
            return Promise.resolve(false);
        });
    };

    function createUsers() {
        var admin = {
            name: 'Memslate admin user',
            email: 'admin@memslate.com',
            password: '_.,$late_'
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
        cleanTranslations: cleanTranslations,
        refreshAnonymousUserTranslations: refreshAnonymousUserTranslations,
        addTranslationsAnonymous: addTranslationsAnonymous
    }
};