/**
 * Created by gerard on 26/03/2015.
 */
"use strict";

var Schema = require('./schema');
var config = require('../config');
var knex = require('knex')(config.knex_options);
var bookshelf = require('bookshelf')(knex);
var models = require('../models')(bookshelf);
var sequence = require('when/sequence');
var _ = require('lodash');
var uuid = require('node-uuid');
var https = require('https');
var querystring = require('querystring');

/*ColumnBuilder.prototype.onDelete = function(value) {
 return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], this)
 ._columnBuilder(this)
 .onDelete(value);
 };

 ColumnBuilder.prototype.onUpdate = function(value) {
 return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], this)
 ._columnBuilder(this)
 .onUpdate(value);
 };*/

var startTranslation = 1;
var limitTranslation = 80;

function createTable(tableName) {
    console.log('Creating table ' + tableName + '...');
    return knex.schema.createTable(tableName, function (table) {
        var column;
        var fields = Schema[tableName].fields;
        var columnKeys = _.keys(fields);
        _.each(columnKeys, function (key) {
            if (fields[key].type === 'text' && fields[key].hasOwnProperty('fieldtype')) {
                column = table[fields[key].type](key, fields[key].fieldtype);
            }
            else if (fields[key].type === 'string' && fields[key].hasOwnProperty('maxlength')) {
                column = table[fields[key].type](key, fields[key].maxlength);
            }
            else {
                try {
                    column = table[fields[key].type](key);
                }
                catch (e) {
                    column = table.specificType(key, fields[key].type);
                }
            }

            column.onDelete = function (value) {
                return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], this)
                    ._columnBuilder(this)
                    .onDelete(value);
            };

            if (fields[key].hasOwnProperty('nullable') && fields[key].nullable === true) {
                column.nullable();
            }
            else {
                column.notNullable();
            }
            if (fields[key].hasOwnProperty('primary') && fields[key].primary === true) {
                column.primary();
            }
            if (fields[key].hasOwnProperty('unique') && fields[key].unique) {
                column.unique();
            }
            if (fields[key].hasOwnProperty('unsigned') && fields[key].unsigned) {
                column.unsigned();
            }
            if (fields[key].hasOwnProperty('references')) {
                column.references(fields[key].references);
            }
            if (fields[key].hasOwnProperty('onDelete')) {
                column.onDelete(fields[key].onDelete);
            }
            if (fields[key].hasOwnProperty('defaultTo')) {
                column.defaultTo(fields[key].defaultTo);
            }
            if (fields[key].hasOwnProperty('defaultToRaw')) {
                column.defaultTo(knex.raw(fields[key].defaultToRaw));
            }
            if (fields[key].hasOwnProperty('index')) {
                column.index('index_' + key + '_' + fields[key].index, fields[key].index);
            }
        });

        var uniques = Schema[tableName].constrains.uniques;
        _.each(uniques, function (unique) {
            table.unique(unique);
        });
    });
}

function createTables() {
    var tables = [];
    var tableNames = _.keys(Schema);
    tables = _.map(tableNames, function (tableName) {
        return knex.schema.hasTable(tableName).then(function (exists) {
            if (!exists) {
                return function () {
                    return createTable(tableName);
                };
            }
            console.log(tableName + ' already exists');
            return function () {
                return null;
            };
        });
    });
    return sequence(tables);
}

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
                                else {
                                    //reverse translation
                                    var reverseWord = model.get('mainResult');
                                    new models.Translations({
                                        translate: reverseWord,
                                        fromLang: lang,
                                        toLang: 'en'
                                    }).fetch().then(function (reverseModel) {
                                            if(!reverseModel)
                                            {
                                                translate(reverseWord, lang, 'en', onReverseTranslated);
                                            }
                                        });
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

    console.log("addTranslation:",translate);
    console.log("addTranslation:",result);

    if(!result.def[0]) return;

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

function onTranslated(word, fromLang, toLang, result)
{
    if(!result.def[0]) return;

    addTranslation(word, fromLang, toLang, result);

    //reverse translation
    translate(result.def[0].tr[0].text, toLang, fromLang, onReverseTranslated);
}

function onReverseTranslated(word, fromLang, toLang, resutl) {
    addTranslation(word, fromLang, toLang, resutl);
}


function createUsers() {
    var admin = {
        name: 'Memslate admin user',
        email: 'admin@memslate.com',
        password: '_.,$late_',
        token: uuid.v4()
    };

    var anonymous = {
        name: 'Memslate anonymous user',
        email: 'anonymous@memslate.com',
        password: 'Memolate_',
        token: uuid.v4()
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
        new models.Games(game).fetch().then(function(gameModel){
            if(!gameModel)
            {
                console.log('Creating game: ' + game.name);
                new models.Games(game).save();
            }
            else
            {
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
createTables()
    .then(function () {
        console.log('Tables created!!');

        createUsers().then(function () {
            console.log('Users created!!!');
        });

        addTranslations(startTranslation, limitTranslation, 'es');
        addTranslations(startTranslation, limitTranslation, 'fr');

        createGames();
    })
    .otherwise(function (error) {
        console.log(error.stack);
    });
