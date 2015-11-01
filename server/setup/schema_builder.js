var config = require('../config');
var knex = require('knex')(config.knex_options);
var Promise = require('knex/lib/promise');
var bookshelf = require('bookshelf')(knex);
var models = require('../models')(bookshelf);
var when = require('when/when');
var sequence = require('when/sequence');
var _ = require('lodash');

function createFields(Schema, tableName, table, definition) {
    var column;
    var fields = Schema[tableName].fields;
    var columnKeys = _.keys(fields);

    if(!definition)
    {
        definition = {};
        //create with all fields
         _.forEach(columnKeys, function(key){
            definition[key] = false;
        })
    }

    var columns = _.forIn(definition, function (exists, key) {

        if (exists) return;
        /* promises not listened on 'knex.schema.table'
         if (exists) return new Promise(function (resolver, rejecter) {
         resolver()
         });*/

        console.log('creating field: ' + tableName + ':' + key);

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
};

function createSchema(Schema) {
    var tables = [];
    var tableNames = _.keys(Schema);
    var tablesTransaction = knex.transaction(function (trx) {
        //lookup tables fields existence
        return Promise.reduce(tableNames, function (memo1, tableName) {
            return trx.schema.hasTable(tableName).then(function (exists) {
                if (!exists){
                    return trx.schema.createTable(tableName, function(table){
                        createFields(Schema, tableName, table);
                    });
                }
                return Promise.reduce(Object.keys(Schema[tableName].fields), function (memo2, column) {
                    return trx.schema.hasColumn(tableName, column).then(function (exists) {
                        memo2[column] = exists;
                    }).return(memo2)
                }, {}).then(function (columns) {
                    memo1[tableName] = columns;
                })
            }).return(memo1);
        }, {})
            .then(function (tablesDefs) {
                //fields existence for each table in definitions
                console.log(tablesDefs);
                var tablesTasks = [];
                var defs = _.forIn(tablesDefs, function (tableDef, tableName) {
                    tablesTasks.push(
                        function () {
                            return knex.schema.table(tableName, function (table) {
                                //create non existent fields for the specified table
                                createFields(Schema, tableName, table, tableDef);
                            });
                        });
                });
                return sequence(tablesTasks);
            })
    })
        .then(function () {
            console.log('Transaction has committed');
        })
        .catch(function (err) {
            console.log('Transaction has rolled back');
            console.log(err.stack);
        });

    return tablesTransaction;
}

module.exports = {
    createFields: createFields,
    createSchema: createSchema
};