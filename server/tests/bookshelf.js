/**
 * Created by gerard on 26/05/2015.
 */
var config      = require('../config');
var knex        = require('knex')(config.knex_options);
var bookshelf   = require('bookshelf')(knex);
var models      = require('../models')(bookshelf);

var offset = 0;
var limit =  20;
var orderWay = 'desc';
var userId = config.ANONIMOUS_USER_ID;

models.UserTranslations.query(function(qb) {
    qb.orderBy('id', orderWay);
    qb.limit(limit);
    qb.offset(offset);
})
    .where({userId: userId})
    .fetchAll({withRelated: ['translation']})
    .then(function (collection) {
        if (collection) {
            var translationsCol = collection.models.map(function (model) {
                return [model.get('id'),model.relations.translation.get('id')];
            });

            console.log('Translations: ', translationsCol);
        }
        else {
            console.log('error');
        }
        return;
    });

console.log('exit')