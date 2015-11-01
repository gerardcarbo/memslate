/**
 * Created by gerard on 26/03/2015.
 */
"use strict";

var Schema = require('./schema');
var config = require('../config');
var knex = require('knex')(config.knex_options);
var Promise = require('knex/lib/promise');
var bookshelf = require('bookshelf')(knex);
var models = require('../models')(bookshelf);
var when = require('when/when');
var sequence = require('when/sequence');
var _ = require('lodash');
var uuid = require('node-uuid');
var https = require('https');
var querystring = require('querystring');
var schema_builder = require('./schema_builder');
var startTranslation = 1299;
var limitTranslation = 1500;

function addTranslations(start, limit, lang) {
    var fs = require('fs');
    var parse = require('csv-parse');
    var index = 0;
    var translated = {};

    var parser = parse({delimiter: ',', trim: true});//, function(err, data){console.log(data);});
    var file;

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
            }
            else {
                var word = record[1].trim();

                if (translated[word] === undefined) {
                    translated[word] = word;
                    if (word.length > 2) {
                        console.log('Processing word: ' + word);
                        new models.Translations({
                            translate: word,
                            fromLang: 'en',
                            toLang: lang
                        }).fetch().then(function (model) {
                                if (!model) {
                                    translate(word, 'en', lang, onTranslated);
                                }
                            });

                        index++;
                    }
                }
            }
        }
    });

    file = fs.createReadStream(__dirname + '/mostUsedWords_en.csv');
    file.pipe(parser);
}

function translate(word, fromLang, toLang, onTranslated) {
    console.log('translating: ' + word + '...')
    var params = {
        key: 'dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb',
        lang: fromLang + "-" + toLang,
        text: word,
        ui: 'en'
    };

    var options = {
        host: 'dictionary.yandex.net',
        path: '/api/v1/dicservice.json/lookup?' + querystring.stringify(params)
    };

    var callback = function (response) {
        var data = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            data += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            var result = JSON.parse(data);
            onTranslated(word, fromLang, toLang, result);
        });
    }

    https.request(options, callback).end();
}

function addTranslation(translate, fromLang, toLang, result) {
    console.log("addTranslation:", translate);
    console.log("addTranslation:", result);

    if (!result.def[0]) return;

    console.log("addTranslation:", translate);
    console.log("addTranslation:", result);

    if (!result.def[0]) return;

    var translation = {
        provider: 'yd',
        translate: translate,
        fromLang: fromLang,
        toLang: toLang,
        transcription: result.def[0].ts,
        mainResult: result.def[0].tr[0].text,
        rawResult: result
    };

    console.log("addTranslation:", translation);

    new models.Translations(translation).save().then(function (model) {
        if (model) {
            var userTranslation = {
                userId: 2,
                translationId: model.id
            };
            new models.UserTranslations(userTranslation).save();
        }
    })
}

function onTranslated(word, fromLang, toLang, result) {
    if (!result.def[0]) return;

    addTranslation(word, fromLang, toLang, result);

    //reverse translation
    new models.Translations({
        translate: result.def[0].tr[0].text,
        fromLang: toLang,
        toLang: fromLang
    }).fetch().then(function (model) {
            if (!model) {
                translate(result.def[0].tr[0].text, toLang, fromLang, onReverseTranslated);
            }
        });
}

function onReverseTranslated(word, fromLang, toLang, resutl) {
    addTranslation(word, fromLang, toLang, resutl);
}

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

    var p = models.User.createUser(admin).then(function () {
        return models.User.createUser(anonymous);
    });

    return p;
}

function createGames() {
    var games = [
        {
            name_id: 'basic-test',
            name: 'Basic Test',
            description: 'Performs a basic test based on previous translations'
        }
    ];

    games.forEach(function (game) {
        new models.Games(game).fetch().then(function (gameModel) {
            if (!gameModel) {
                console.log('Creating game: ' + game.name);
                new models.Games(game).save();
            }
            else {
                console.log('Game ' + game.name + ' already created.');
            }
        });
    });
}

process.on('uncaughtException', function (err) {
    console.log(err.stack);
    throw err;
});

//create tables, users, games and add translations
schema_builder.createSchema(Schema)
    .then(function () {
        console.log('Schema created!!');

        createUsers().then(function () {
            console.log('Users created!!!');
            addTranslations(startTranslation, limitTranslation, 'es');
            addTranslations(startTranslation, limitTranslation, 'fr');

            createGames();
        });
    })
    .otherwise(function (error) {
        console.log(error.stack);
    });
