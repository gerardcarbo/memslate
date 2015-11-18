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
var limitTranslation = 2000;

log4js.configure({
    appenders: [
        { "type": "console" },
        { "type": "dateFile", "filename": "/logs/setup.log", "pattern": ".yyyy-MM-dd.log", "alwaysIncludePattern": false }
    ],
    replaceConsole: true
});

process.on('uncaughtException', function (err) {
    console.log(err.stack);
    throw err;
});

//create tables, users, games and add translations
schema_builder.createSchema(Schema)
    .then(function () {
        console.log('Schema created!!');
        return setup.cleanTranslations(config.ANONIMOUS_USER_ID);
    })
    .then(setup.createUsers)
    .then(function () {
        console.log('Users created!!!');
        return setup.addTranslationsAnonymous(__dirname + '/google-10000-english.txt', 0, startTranslation, limitTranslation, 'es');
    })
    .then(function() {
        console.log('Translations es done!!!');
        return setup.addTranslationsAnonymous(__dirname + '/google-10000-english.txt', 0, startTranslation, limitTranslation, 'fr');
    })
    .then(function(){
        console.log('Translations fr done!!!');
        return true;
    })
    .then(function(){
        return setup.refreshAnonymousUserTranslations(config.ANONIMOUS_USER_ID);
    }).then(function(total){
        console.log(total[0]+' Translations added!!!');
        console.log(total[1]+' User Translations created!!!');
        return true;
    })
    .then(setup.createGames).then(function(){
        console.log('Games created!!!');
        return true;
    })
    .catch(function (error) {
        console.log(error, error.stack);
    });

