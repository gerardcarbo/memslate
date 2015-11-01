var CronJob = require('cron').CronJob;

module.exports = function (models) {

    function cleanSessionsTask(maxSessionDays)
    {
        "use strict";
        console.log('cleanSessionsTask: scheduled');
        var job = new CronJob('00 00 00 * * *', function() {
                /*
                 * Runs every day
                 * at 00:00:00 AM.
                 */
                console.log('cleanSessionsTask: started...');
                models.UserSessions.cleanSessions(-maxSessionDays,0,0); //older than x days
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