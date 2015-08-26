/**
 * Created by gerard on 01/04/2015.
 */
"use strict";

var restful = require('./bookshelf_rest');
var config = require('./config');
var _ = require('lodash');
var locale = require('locale');

var log = config;

module.exports = function (models) {

    var addPrefered = function (prefered, languages) {
        _.forEach(languages, function (language) {
            console.log('addPrefered: trying ' + language);
            if (language) {
                var pos = prefered.indexOf(language);
                if (pos !== -1) {
                    prefered.splice(pos, 1);
                }
                prefered.unshift(language);
                if (prefered.length > 4) {
                    prefered.pop();
                }
                console.log('addPrefered: done for ' + language + ' -> ' + JSON.stringify(prefered));
            }
        });
    };

    function addToUserLanguages(req) {
        var translation = req.translation;

        if (req.user.id !== config.ANONIMOUS_USER_ID) {
            new models.UserLanguages({userId: req.user.id}).fetch().then(function (ulModel) {
                var prefered;
                if (ulModel) {
                    prefered = ulModel.attributes.prefered.arr; //arr is used because of a bug when storing json arrays
                    addPrefered(prefered, [translation.fromLang, translation.toLang]);
                    ulModel.save({
                        fromLang: translation.fromLang,
                        toLang: translation.toLang,
                        prefered: {arr: prefered}
                    });
                }
                else {
                    //create new one
                    console.log('creating UserLanguages');
                    var locales = new locale.Locales(req.headers["accept-language"]);
                    prefered = [translation.fromLang, translation.toLang];
                    addPrefered(prefered, [locales[0] && locales[0].language, locales[1] && locales[1].language, locales[2] && locales[2].language, locales[3] && locales[3].language]);
                    models.UserLanguages.forge({
                        userId: req.user.id,
                        fromLang: translation.fromLang,
                        toLang: translation.toLang,
                        prefered: {arr: prefered}
                    }).save();
                }
            });
        }
    }

    function saveUserTranslation(req, res, translation) {
        if (translation) {
            log.debug('saveUserTranslation: translationId:' + translation.id + ' : ' + translation.translate);

            var userTranslation = {};
            userTranslation.translationId = translation.id;
            userTranslation.userId = req.user.id;

            models.UserTranslations.forge(userTranslation).fetch().then(function (model) {
                if (!model) {
                    models.UserTranslations.forge(userTranslation).save().then(function (item) {
                        log.debug('saveUserTranslation: saved Id:' + item.id);
                    });
                }
            });
        }
    }

    function checkIfTranslationExists(req, res, doSave) {
        req.translation = req.body;

        log.debug('checkTranslation: ' + req.translation.translate);

        new models.Translations({
            fromLang: req.translation.fromLang,
            toLang: req.translation.toLang,
            translate: req.translation.translate
        }).fetch().then(function (model) {
                if (model) {
                    log.debug('translation found for:' + req.translation.translate);
                    req.translation.id = model.get("id");
                    res.status(200).send(req.translation);
                    saveUserTranslation(req, res, req.translation);
                }
                else {
                    doSave(req.translation);
                }
            });

        addToUserLanguages(req);
    }

    function createOrderRaw(orderBy, orderWay) {
        var orders = orderBy.split(',');

        var orderByRaw = orders.map(function (order) {
                return order.split('.').map(function (item) {
                    return '"' + item + '"';
                }).join(".");
            }).join(" " + orderWay + ", ")
            + " " + orderWay;

        return orderByRaw;
    }


    /**
     * User Translations routes
     */
    var translations = restful(models.Translations, 'translations',
        {
            getAll: function (req, res) {
                var offset = req.query.offset || 0;
                var limit = req.query.limit || 10;
                var orderWay = req.query.orderWay || 'asc';
                var orderBy = req.query.orderBy || 'Translations.translate';
                var userId = req.user.id || config.ANONIMOUS_USER_ID;
                var columns = req.query.columns || 'userTranslationInsertTime,Translations.*';

                models.UserTranslations.query(function (qb) {
                    columns.split(',').forEach(function (column) {
                        qb.column(column.trim());
                    });
                    qb.innerJoin("Translations", "Translations.id", "UserTranslations.translationId");
                    qb.where("UserTranslations.userId", userId);
                    if (req.query.filterByString && req.query.filterByString === "true") {
                        qb.andWhereRaw("\"Translations\".translate like '" + escape(req.query.filterString) + "%'");
                    }
                    if (req.query.filterByDates && req.query.filterByDates === "true") {
                        qb.andWhereRaw("\"UserTranslations\".\"userTranslationInsertTime\" >= '" + req.query.filterDateFrom + "'  and \"UserTranslations\".\"userTranslationInsertTime\" <= '" + req.query.filterDateTo + "'");
                    }
                    if (req.query.filterByLanguages && req.query.filterByLanguages === "true") {
                        if (req.query.filterFromLanguage && req.query.filterFromLanguage != "") {
                            qb.andWhereRaw("\"Translations\".\"fromLang\" = '" + req.query.filterFromLanguage + "'");
                        }
                        if (req.query.filterToLanguage && req.query.filterToLanguage != "") {
                            qb.andWhereRaw("\"Translations\".\"toLang\" = '" + req.query.filterToLanguage + "'");
                        }
                    }
                    qb.limit(limit);
                    qb.offset(offset);
                    if (orderBy.split(',').length > 1) {
                        var orderByRaw = createOrderRaw(orderBy, orderWay);
                        qb.orderByRaw(orderByRaw);
                    }
                    else {
                        qb.orderBy(orderBy, orderWay);
                    }

                    qb.debug();
                }).fetchAll({columns: ['UserTranslations.id as userTranslationId']}).then(function (collection) {
                    if (collection) {
                        res.json(collection);
                    }
                    else {
                        res.json(false);
                    }
                });

                /* Using withRelated -> pagination problems when filtering by Translations fields
                 models.UserTranslations.query(function(qb) {
                 qb.orderBy(orderBy, orderWay);
                 qb.limit(limit);
                 qb.offset(offset);
                 })
                 .where({userId: userId})
                 .fetchAll({withRelated: ['translation']})
                 .then(function (collection) {
                 if (collection) {
                 var translationsCol = collection.models.map(function (model) {
                 return model.relations.translation;
                 });

                 res.json(translationsCol);
                 }
                 else {
                 res.json(false);
                 }
                 });*/
            },
            get: function (req, res) {
                console.log("Translations.get", req.params.id);
                models.Translations.query({
                    select: '*'
                }).where({id: req.params.id}).fetch().then(function (translation) {
                    if (translation) {
                        translation.set('rawResult', JSON.parse(translation.get('rawResult')));
                        res.json(translation);
                    }
                    else {
                        res.json(false);
                    }
                });
            },
            preSave: checkIfTranslationExists,
            postSave: saveUserTranslation,
            preDelete: function (req, res, doDelete) {
                //check user translation.
                new models.UserTranslations().query({where: {translationId: req.params.id}})
                    .fetchAll().then(function (translationsModel) {
                        if (translationsModel) {
                            if (translationsModel.models.length === 1) {
                                if (translationsModel.models[0].get('userId') == req.user.id) {
                                    translationsModel.models[0].destroy();  //delete user translation
                                    doDelete(req.params); //delete translation
                                }
                            }
                            else {
                                _.each(translationsModel.models, function (model) {
                                    if (model.get('userId') == req.user.id) {
                                        model.destroy(); //delete user translation
                                    }
                                });
                                //do not delete translation as other users still use it.
                                res.json({id: req.params.id});
                            }

                            //delete user translation samples -> already done by DB integrity rules
                            /*new models.UserTranslationsSamples().query({where: {translationId: item.id, userId: req.user.id}})
                             .fetchAll().then(function (modelSamples) {
                             if (modelSamples) {
                             _.each(modelSamples.models, function (model) {
                             model.destroy();
                             });
                             }
                             });*/
                        }
                        else {
                            res.status(404).send('Translation not found');
                        }
                    })
                    .otherwise(function (err) {
                        res.status(500).json({error: true, data: {message: err.message}});
                    });
            }
        });

    /**
     * User Translations Samples
     */
    var translationsSamples = restful(models.UserTranslationsSamples,
        'translations/:translationId/samples', {
            preSave: function (req, res, doSave) {
                //check that translation sample does not already exists
                req.translationSample = req.body;
                req.translationSample.userId = req.user.id;

                log.debug('translationsSamples: preSave ' + req.translationSample.sample);

                new models.UserTranslationsSamples({
                    userId: req.translationSample.userId,
                    translationId: req.translationSample.translationId,
                    sample: req.translationSample.sample
                }).fetch().then(function (model) {
                        if (model) {
                            log.debug('translationSample found for:' + req.translationSample.sample);
                            req.translationSample.id = model.get("id");
                            res.status(200).send(req.translationSample);
                        }
                        else {
                            doSave(req.translationSample);
                        }
                    });
            },
            preDelete: function (req, res, doDelete) {
                //check translation sample user.
                new models.UserTranslationsSamples({
                    id: req.params.id
                }).fetch()
                    .then(function (model) {
                        if (model) {
                            if (model.get('userId') === req.user.id) {
                                doDelete(req.params);
                            }
                            else {
                                res.status(403).send('Invalid user');
                            }
                        }
                    })
                    .otherwise(function (err) {
                        res.status(500).json({error: true, data: {message: err.message}});
                    });
            }
        }
    );

    var createDefaultUserLanguages = function (req) {
        var defUserLanguages = {};
        defUserLanguages.userId = req.user.id;
        var locales = new locale.Locales(req.headers["accept-language"]);
        defUserLanguages.toLang = (defUserLanguages.fromLang !== locales[0].language ? locales[0].language : locales[1].language);

        (defUserLanguages.toLang == 'en' ? defUserLanguages.fromLang = 'es' : defUserLanguages.fromLang = 'en');

        defUserLanguages.prefered = [defUserLanguages.fromLang, defUserLanguages.toLang];

        addPrefered(defUserLanguages.prefered, [locales[0] && locales[0].language, locales[1] && locales[1].language, locales[2] && locales[2].language, locales[3] && locales[3].language]);

        return defUserLanguages;
    };

    /**
     * User Languages
     */
    var userLanguages = restful(models.UserLanguages, 'userLanguages',
        {
            getAll: function (req, res, next) {
                if (req.user.id === config.ANONIMOUS_USER_ID) {
                    var defUserLanguages = createDefaultUserLanguages(req);
                    res.json(defUserLanguages);
                    return;
                }

                models.UserLanguages.query({
                    select: '*'
                }).where({userId: req.user.id})
                    .fetch()
                    .then(function (userLangs) {
                        if (userLangs) {
                            userLangs.attributes.prefered = userLangs.attributes.prefered.arr; //arr is used because of a bug when storing json arrays
                            res.json(userLangs);
                        }
                        else {
                            userLangs = createDefaultUserLanguages(req);

                            res.json(userLangs);

                            new models.UserLanguages(userLangs).save();
                        }
                    });
            }
        });

    return {
        translations: translations,
        translationsSamples: translationsSamples,
        userLanguages: userLanguages
    };
};

