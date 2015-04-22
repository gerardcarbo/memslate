/**
 * Created by gerard on 26/03/2015.
 */
"use strict";

var Schema          = require('./schema');
var config          = require('../config');
var knex            = require('knex')(config.knex_options);
var bookshelf       = require('bookshelf')(knex);
var models          = require('../models')(bookshelf);
var sequence        = require('when/sequence');
var _               = require('lodash');
var uuid            = require('node-uuid');

function createTable(tableName) {
    console.log('Creating table ' + tableName + '...');
    return knex.schema.createTable(tableName, function (table)
    {
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
                try
                {
                    column = table[fields[key].type](key);
                }
                catch(e)
                {
                    column = table.specificType(key,fields[key].type);
                }
            }
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
            if (fields[key].hasOwnProperty('defaultTo')) {
                column.defaultTo(fields[key].defaultTo);
            }
            if (fields[key].hasOwnProperty('defaultToRaw')) {
                column.defaultTo(knex.raw(fields[key].defaultToRaw));
            }
            if (fields[key].hasOwnProperty('index')) {
                column.index('index_' + key + '_' + fields[key].index,fields[key].index);
            }
        });

        var uniques = Schema[tableName].constrains.uniques;
        _.each(uniques, function (unique) {
            table.unique(unique);
        });
    });
}

function createTables () {
    var tables = [];
    var tableNames = _.keys(Schema);
    tables = _.map(tableNames, function (tableName) {
        return knex.schema.hasTable(tableName).then(function(exists) {
            if (!exists) {
                return function () {
                    return createTable(tableName);
                };
            }
            console.log(tableName + ' already exists');
            return function()
            {
                return null;
            };
        });
    });
    return sequence(tables);
}

function createUsers ()
{
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

    var p = models.User.createUser(admin).then(function(){
                    return models.User.createUser(anonymous);
                });

    return p;
}

process.on('uncaughtException', function(err) {
    console.log(err.stack);
    throw err;
});

createTables()
    .then(function() {
        console.log('Tables created!!');

        createUsers.then(function () {
            console.log('Users created!!!');
        });

    })
    .otherwise(function (error) {
        console.log(error.stack);
    });
