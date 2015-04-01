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
        pre_save: checkTranslation,
        post_save: saveUserTranslation
    });

    return {
        translations:translations
    }
};

