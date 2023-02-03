"use strict";

var Schema = require('./schema');
var config = require('../config');
var knex = require('knex')(config.knex_options);
var bookshelf = require('bookshelf')(knex);
var models = require('../models')(bookshelf);
var when = require('when/when');
var _ = require('lodash');
var request = require('request-promise');
var schema_builder = require('./schema_builder');
var setup = require('./setup_lib')(knex, models);
var log4js = require('log4js');

var startTranslation = 0;
var limitTranslation = 14000;

var setupLogFile = '/logs/setup.log';

process.on('uncaughtException', function (err) {
    console.log('uncaughtException: ', err);
    console.log('uncaughtException:  stack: ', err.stack);
    //throw err;

    console.log('uncaughtException: retrying in 5s...');
    setTimeout(
        ()=>{
            start();
        }
    , 5000);
});

function pad(s) {
    return (s < 10) ? '0' + s : s;
}
function getDay(d) {
    return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
}

start();

function start() {
    //rename old log
    var fs = require('fs');
    fs.stat(setupLogFile, function (err, stat) {
        if (stat && stat.birthtime) {
            var date = stat.birthtime;
            var filename = "/logs/setup." + getDay(date) + "." + pad(date.getHours()) + "h." + pad(date.getMinutes()) + "m.log";
            fs.renameSync(setupLogFile, filename);
        }

        DoSetup(fs);
    });
}

//setup operations
function DoSetup(fs) {
    log4js.configure({
        appenders: {
            out:{ type: 'console' },
            app:{ type: 'file', filename: setupLogFile, alwaysIncludePattern: false }
        },
        categories: {
            default: { appenders: [ 'out', 'app' ], level: 'debug' }
        }
    });

    console.log('Tracing to: ' + setupLogFile);

    fs.chmodSync(setupLogFile, '666');

    //create tables, users, games and add translations
    schema_builder.createSchema(Schema)
        .then(function () {
            console.log('Schema created!!');
        })
        .then(setup.createUsers).then(function () {
            console.log('Users created!!!');
        })
        .then(setup.createGames).then(function () {
            console.log('Games created!!!');
        })
        /*.then(function () {
            return setup.loadMostUsedWords(__dirname + '/google-20000-english.txt', 0)
            .then(function () {
            console.log('LoadMostUsedWords done!!!');
            });
         })*/
        .then(function () {
            return setup.addTranslationsAnonymous(__dirname + '/google-20000-english.txt', 0, startTranslation, limitTranslation, 'es')
                .then(function () {
                    console.log('Translations es done!!!');
                });
        })
        .then(function () {
            return setup.addTranslationsAnonymous(__dirname + '/google-20000-english.txt', 0, startTranslation, limitTranslation, 'fr')
                .then(function () {
                    console.log('Translations fr done!!!');
                });
        })
        .then(function () {
            return setup.refreshAnonymousUserTranslations(config.ANONIMOUS_USER_ID).then(function (total) {
                console.log('refreshAnonymousUserTranslations done!!!');
                console.log(total[0] + ' Translations added!!!');
                console.log(total[1] + ' User Translations created!!!');
            });
        })
        .then(function () {
            return setup.computeDifficulty()
                .then(function () {
                    console.log('computeDifficulty done!!!');
                });
        })
        .then(function () {
            console.log('all done!!!');
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve();
                }, 5000);
            });
        })
        .catch(function (error) {
            console.log('Setup: exception caught: ', error)
            console.log('Setup: stack: ', error.stack);
        });
}
