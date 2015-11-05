var CronJob = require('cron').CronJob;

module.exports = function (models) {

    function cleanSessionsTask(sessionExpiration)
    {
        "use strict";
        console.log('cleanSessionsTask: scheduled with ',sessionExpiration);
        var job = new CronJob('00 00 00 * * *', function() {
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
        job.start();
    }

    return {
        cleanSessionsTask: cleanSessionsTask
    }
};