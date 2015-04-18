/**
 * Created by gerard on 01/04/2015.
 */
var restful = require('./bookshelf_rest');
var config  = require('./config');
var _       = require('lodash');
var locale  = require('locale');

var log=config;

module.exports = function (models)
{
    /**
     * Translations routes
     */
    function checkTranslation(req, res, saveTranslation) {
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
                    saveTranslation(req.translation);
                }
            });

        addToUserLanguages(req);
    }

    function saveUserTranslation(req, res, translation)
    {
        if (translation)
        {
            log.debug('saveUserTranslation: translationId:' + translation.id);

            var userTranslation = {};
            userTranslation.translationId = translation.id;
            userTranslation.userId = req.user.id;

            models.UserTranslations.forge(userTranslation).fetch().then(function(model) {
                if (!model) {
                    models.UserTranslations.forge(userTranslation).save().then(function (item) {
                        log.debug('saveUserTranslation: saved Id:' + item.id);
                    });
                }
            });
        }
    }

    function addToUserLanguages(req)
    {
        var translation=req.translation;

        if(req.user.id != config.ANONIMOUS_USER_ID)
        {
            new models.UserLanguages({userId:req.user.id}).fetch().then(function(ulModel)
            {
                var prefered;
                if(ulModel)
                {
                    prefered=ulModel.attributes.prefered.arr; //arr is used because of a bug when storing json arrays
                    addPrefered(prefered,[translation.fromLang,translation.toLang]);
                    ulModel.save({fromLang:translation.fromLang,toLang:translation.toLang,prefered:{arr:prefered}});
                }
                else
                {
                    //create new one
                    console.log('creating UserLanguages');
                    var locales=new locale.Locales(req.headers["accept-language"]);
                    prefered=[translation.fromLang,translation.toLang];
                    addPrefered(prefered,[locales[0] && locales[0].language,locales[1] && locales[1].language,locales[2] && locales[2].language,locales[3] && locales[3].language]);
                    models.UserLanguages.forge({userId:req.user.id,fromLang:translation.fromLang,toLang:translation.toLang,prefered:{arr:prefered}}).save();
                }
            });
        }
    }

    var translations = restful(models.Translations, 'translations', {
        getAll: function (req, res, next)
        {
            var offset = req.query.offset || 0;
            var limit = req.query.limit || 5;

            models.UserTranslations.query({
                select: '*', limit: limit, offset: offset
            }).where({userId: req.user.id})
                .fetchAll({withRelated: ['translation']})
                .then(function (collection) {
                    if (collection) {
                        var translations = collection.models.map(function (model) {
                            return model.relations.translation;
                        });

                        res.json(translations);
                    }
                    else {
                        res.json(false);
                    }
                });
        },
        get: function (req, res, next) {
            models.UserTranslations.query({
                select: '*'
            }).where({userId: req.user.id, translationId: req.params.pkid}).fetch({
                withRelated: ['translation']
            }).then(function (userTranslation) {
                if (userTranslation) {
                    res.json(userTranslation.relations.translation);
                }
                else {
                    res.json(false);
                }
            });
        },
        pre_save: checkTranslation,
        post_save: saveUserTranslation,
        pre_delete: function (req, res, doDelete) {
            //check user translation.
            new models.UserTranslations({
                translationId: req.params.id
            }).fetch()
                .then(function (model) {
                    if (model) {
                        if (model.get('userId') == req.user.id) {
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
        },
        post_delete: function (req,res,item,doPostDeleteDone){
            //delete user translation.
            new models.UserTranslations({
                translationId: item.id
            }).fetch()
                .then(function (model) {
                    if (model) {
                        model.destroy();
                    }
                });
            new models.UserTranslationsSamples().query({ where:{translationId: item.id,userId: req.user.id}})
                .fetchAll().then(function (modelSamples) {
                    if(modelSamples)
                    {
                        _.each(modelSamples.models, function(model) {
                            model.destroy();
                        });
                    }
                });

            doPostDeleteDone();
        }
    });

    /**
     * Translations Samples
     */
    var translationsSamples = restful(models.UserTranslationsSamples,
        'translations/:translationId/samples', {
            pre_save: function (req, res, doSave) {
                //check that translation sample does not already exists
                req.translationSample = req.body;
                req.translationSample.userId = req.user.id;

                log.debug('translationsSamples: pre_save ' + req.translationSample.sample);

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
            pre_delete: function (req, res, doDelete) {
                //check translation sample user.
                new models.UserTranslationsSamples({
                    id: req.params.id
                }).fetch()
                    .then(function (model) {
                        if (model) {
                            if (model.get('userId') == req.user.id) {
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

    var addPrefered = function(prefered,languages)
    {
        _.forEach(languages,function(language){
            console.log('addPrefered: trying '+language);
            if(language)
            {
                var pos=prefered.indexOf(language);
                if(pos!=-1)
                {
                    prefered.splice(pos,1);
                }
                prefered.unshift(language);
                if(prefered.length>4)
                {
                    prefered.pop();
                }
                console.log('addPrefered: done for '+language+' -> '+JSON.stringify(prefered));
            }
        });
    };

    var createDefaultUserLanguages=function(req)
    {
        var userLanguages={};
        userLanguages.userId=req.user.id;
        userLanguages.fromLang='en';
        var locales=new locale.Locales(req.headers["accept-language"]);
        userLanguages.toLang=(userLanguages.fromLang!=locales[0].language ? locales[0].language : locales[1].language);
        userLanguages.prefered=[userLanguages.fromLang,userLanguages.toLang];

        addPrefered(userLanguages.prefered,[locales[0] && locales[0].language,locales[1] && locales[1].language,locales[2] && locales[2].language,locales[3] && locales[3].language]);

        return userLanguages;
    };

    var userLanguages = restful(models.UserLanguages,
        'userLanguages',
        {
            getAll: function (req, res, next)
            {
                if(req.user.id==config.ANONIMOUS_USER_ID)
                {
                    var userLanguages=createDefaultUserLanguages(req);
                    res.json(userLanguages);
                    return;
                }

                models.UserLanguages.query({
                    select: '*'
                }).where({userId: req.user.id})
                    .fetch()
                    .then(function (userLanguages) {
                        if (userLanguages)
                        {
                            userLanguages.attributes.prefered=userLanguages.attributes.prefered.arr; //arr is used because of a bug when storing json arrays
                            res.json(userLanguages);
                        }
                        else {
                            userLanguages=createDefaultUserLanguages(req);

                            res.json(userLanguages);

                            new  models.UserLanguages(userLanguages).save();
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

