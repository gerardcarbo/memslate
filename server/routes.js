/**
 * Created by gerard on 01/04/2015.
 */
var restful = require('./bookshelf_rest');
var log     = require('./config');

module.exports = function(models)
{
    /**
     * Translations routes
     */
    function checkTranslation(req,res,saveTranslation)
    {
        req.translation = req.body;

        log.debug('checkTranslation: '+req.translation.translate);

        new models.Translations({
            fromLang: req.translation.fromLang,
            toLang: req.translation.toLang,
            translate: req.translation.translate
        }).fetch().then(function (model) {
                if (model) {
                    log.debug('translation found for:'+req.translation.translate);
                    req.translation.id = model.get("id");
                    res.status(200).send(req.translation);
                }
                else
                {
                    saveTranslation(req.translation);
                }
            });
    }

    function saveUserTranslation(req, res, translation) {
        if(translation)
        {
            log.debug('saveUserTranslation: translationId:'+translation.id);

            var userTranslation={};
            userTranslation.translationId = translation.id;
            userTranslation.userId = req.user.id;

            models.UserTranslations.forge(userTranslation).save().then(function(item){
                log.debug('saveUserTranslation: userTranslationId:'+item.id);
            })
        }
    }


    var translations = restful(models.Translations, 'translations', {
        getAll: function(req, res, next){

            var offset=req.query.offset||0;
            var limit=req.query.limit||5;

            models.UserTranslations.query({
                select: '*', limit:limit, offset:offset
            }).where({userId:req.user.id})
                .fetchAll({withRelated: ['translation']})
                .then(function (collection) {
                    if(collection)
                    {
                        var translations=collection.models.map(function(model){
                            return model.relations.translation;
                        });

                        res.json(translations);
                    }
                    else
                    {
                        res.json(false);
                    }
                });
        },
        get: function(req, res, next) {
            models.UserTranslations.query({
                select: '*'
            }).where({userId: req.user.id,translationId:req.params.pkid}).fetch({
                withRelated: ['translation']
            }).then(function (userTranslation) {
                if(userTranslation)
                {
                    res.json(userTranslation.relations.translation);
                }
                else
                {
                    res.json(false);
                }
            });
        },
        pre_save: checkTranslation,
        post_save: saveUserTranslation
    });

    return {
        translations:translations
    }
};

