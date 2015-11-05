"use strict";

var uuid = require('node-uuid');
var utils = require('./utils');
var log = require('./config');

module.exports = function (bookshelf)
{
    var User = bookshelf.Model.extend(
    {
        tableName: 'Users',

        initialize: function () {
            this.on('creating', this.setAdmin);
        },

        setAdmin: function () {
            var self = this;
            return bookshelf.knex('Users').count().then(function (result) {
                if (result[0] && result[0].count === 0) {
                    log.debug("Marking first user " + self.get("email") + " as admin");
                    self.set('isAdmin', true);
                }
            });
        }
    },
    {
        createUser: function (user) {
            log.debug('createUser: creating "' + user.name + '"...');

            var p = bookshelf.knex('Users').where({
                email: user.email
            }).count().then(function (result) {
                if (result[0] && result[0].count > 0) {
                    log.debug('createUser: user "' + user.name + '" already exists.');
                    return true;
                } else {
                    user.cryptedPassword = utils.encryptPassword(user.password);
                    delete user.password;
                    return bookshelf.knex('Users').insert(user).then(function () {
                        log.debug('createUser: user "' + user.name + '" created');
                        return true; //important! must return something -> new promise created
                    });
                }
            });

            return p;
        }
    });

    var Translations = bookshelf.Model.extend({
        tableName: 'Translations'
    });

    var UserTranslations = bookshelf.Model.extend({
        tableName: 'UserTranslations',
        translation: function () {
            return this.belongsTo(Translations, "translationId");
        }
    });

    var UserTranslationsSamples = bookshelf.Model.extend({
        tableName: 'UserTranslationsSamples',
        translation: function () {
            return this.belongsTo(Translations, "translationId");
        }
    });

    var UserLanguages = bookshelf.Model.extend({
        tableName: 'UserLanguages'
    });

    var Games = bookshelf.Model.extend({
        tableName: 'Games'
    });


    var UserSessions = bookshelf.Model.extend({
            tableName: 'UserSessions'
        },
        {
            cleanSessions: function (days, hours, minutes) {
                var olderDate = new Date().adjustDate(-days, -hours, -minutes);
                console.log('cleanSessions: older than days: '+days+' hours: '+hours+' minutes: '+minutes+' -> '+olderDate.toLocaleString());
                this.where('accessedAt', '<', new Date().adjustDate(-days, -hours, -minutes)).fetchAll().then(function (sessions) {
                    sessions.forEach(function (session) {
                        console.log('cleanSessions: destroying session: ' + session.get('token') + ' accessedAt: '+session.get('accessedAt'));
                        session.destroy();
                    })
                });
            }
        });


    return {
        User: User,
        UserSessions: UserSessions,
        Translations: Translations,
        UserTranslations: UserTranslations,
        UserTranslationsSamples: UserTranslationsSamples,
        UserLanguages: UserLanguages,
        Games: Games
    };
};
