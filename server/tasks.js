"use strict";

module.exports = function (knex, models) {

    var CronJob = require('cron').CronJob;
    var setup = require('./setup/setup_lib')(knex, models);

    function cleanSessionsTask(sessionExpiration) {
        console.log('cleanSessionsTask: scheduled with ', sessionExpiration);
        var job = new CronJob('00 00 00 * * *', function () {
                /*
                 * Runs every day
                 * at 00:00:00 AM.
                 */
                console.log('cleanSessionsTask: started...');
                models.UserSessions.cleanSessions(sessionExpiration.days, sessionExpiration.hours, sessionExpiration.minutes); //older than x days, hours, minutes
            }, function () {
                console.log('cleanSessionsTask: finished!');
            },
            true, /* Start the job right now */
            'Europe/Madrid' /* Time zone of this job. */
        );
    }

    function refreshAnonymousTranslationsTask(userId) {
        console.log('cleanAnonymousTranslations: scheduled for user ' + userId);

        function refreshAnonymousTranslations() {
            setup.refreshAnonymousUserTranslations(userId).then(function (total) {
                console.log(total[0] + ' Translations added!!!');
                console.log(total[1] + ' User Translations created!!!');
            });
        }

        //refreshAnonymousTranslations();

        var job = new CronJob('00 00 01 * * *', function () {
                /*
                 * Runs every day
                 * at 00:00:00 AM.
                 */
                console.log('cleanAnonymousTranslations: started...');
                refreshAnonymousTranslations()
            }, function () {
                console.log('cleanAnonymousTranslations: finished!');
            },
            true, /* Start the job right now */
            'Europe/Madrid' /* Time zone of this job. */
        );
    }


    return {

        cleanSessionsTask: cleanSessionsTask,
        refreshAnonymousTranslationsTask: refreshAnonymousTranslationsTask
    }
};