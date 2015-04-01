var uuid            = require('node-uuid');
var utils           = require('./utils');

module.exports = function (bookshelf) {
    var User = bookshelf.Model.extend({
        tableName: 'Users',

        initialize: function () {
            this.on('creating', this.setAdmin);
        },

        setAdmin: function () {
            var self = this;
            return bookshelf.knex('Users').count().then(function (result) {
                if (result[0] && result[0].count == 0) {
                    console.log("Marking first user " + self.get("email") + " as admin");
                    self.set('isAdmin', true);
                }
            });
        }
    }, {
        createUser: function(user)
        {
            console.log('createUser: creating "'+user.name+'"...');

            var p =  bookshelf.knex('Users').where({
                email: user.email
            }).count().then(function (result) {
                    if (result[0] && result[0].count>0) {
                        console.log('createUser: user "'+user.name+'" already exists.');
                        return true;
                    } else {
                        user.token = uuid.v4();
                        user.cryptedPassword = utils.encryptPassword(user.password);
                        delete user.password;
                        return bookshelf.knex('Users').insert(user).then(function(){
                            console.log('createUser: user "'+user.name+'" created');
                            return true; //important! must return something -> new promise created
                        });
                    }});

            return p;
        }
    });

    var Translations = bookshelf.Model.extend({
        tableName: 'Translations'
    });

    var UserTranslations = bookshelf.Model.extend({
        tableName: 'UserTranslations'
    });

    function activate_question(req, res, next) {
        var question_id = req.params.questionId;
        console.log("activating question ", question_id);

        return bookshelf.knex('questions').update({
            'show': knex.raw('(id=' + question_id + ')')
        }).then(function () {
            res.send('OK');
        }).catch(function (err) {
            console.log("Error ", err);
            res.status(500).send(err);
        });
    }

    function next_question(req, res, next) {
        var idWhere = '(select min(id) from questions where (show = false or show is null) and id > (select max(id) from questions where show = true))';
        return bookshelf.knex('questions').update({
            'show': bookshelf.knex.raw('(id = ' + idWhere + ')')
        })
            .then(function () {
                res.send('OK');
            }).catch(next);
    }

    function leaders(req, res, next) {
        return bookshelf.knex('users').orderBy('points', 'desc')
            .select('*').then(function (rows) {
                res.json(rows);
            });
    }

    function clear_leaders(req, res, next) {
        var knex = bookshelf.knex;
        knex('answers').del().then(function () {
            knex('users').update({
                points: 0
            }).then(function () {
                knex('questions').update({
                    show: false
                }).then(function () {
                    knex('questions').where({
                        question: 'start'
                    }).update({
                        show: true
                    }).then(function () {
                        res.send('OK');
                    });
                });
            });
        }).catch(function (err) {
            next(err);
        });
    }

    return {
        User: User,
        Translations: Translations,
        UserTranslations: UserTranslations,
        leaders: leaders,
        clear_leaders: clear_leaders
    }
};