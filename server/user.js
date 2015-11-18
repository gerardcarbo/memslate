"use strict";

module.exports = function (knex, models) {
    var user = {};
    user.getStatistics = function (userId) {
        return knex.raw('SELECT t."fromLang", t."toLang", count(*) as count FROM public."Translations" as t ' +
            'INNER JOIN public."UserTranslations" as ut ON t.id=ut."translationId" ' +
            'WHERE ut."userId"=' + userId + ' GROUP BY t."fromLang", t."toLang" ' +
            'ORDER BY t."fromLang" ASC, t."toLang" ASC').then(function (langs) {
            if (langs) {
                console.log('getStatistics: languages done:', langs.rows);
                return langs.rows;
            }
            else {
                return false;
            }
        }, function (err) {
            console.log('getStatistics: languages error:', err);
            return false;
        });
    };

    user.sendStatistics = function (req, res) {
        var userId = req.user.id || config.ANONIMOUS_USER_ID;
        user.getStatistics(userId).then(function (stats) {
            if (stats) {
                res.json(stats);
            } else {
                res.status(500).send();
            }
        });

        /*models.UserTranslations.query({where: {userId: userId}}).count().then(function(count){
         res.send({count : count});
         });*/

    };

    return user;
};