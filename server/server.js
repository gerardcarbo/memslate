/**
 * Created by gerard on 22/07/2015.
 */
exports.serve = function (serverLogFile)
{
    "use strict";
    var express = require('express');
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var cors = require('cors');
    var path = require('path');
    var config = require('./config');
    var knex = require('knex')(config.knex_options);
    var bookshelf = require('bookshelf')(knex);
    var models = require('./models')(bookshelf);
    var auth = require('./auth')(models);
    var routes = require('./routes')(models,knex);
    var games = require('./games')(bookshelf,models);
    var user = require('./user')(knex,models);
    var tasks = require('./tasks')(knex,models);
    var nodemailer = require('nodemailer');
    var directTransport = require('nodemailer-direct-transport');
    var log4js = require('log4js');
    var fs = require('fs');

    log4js.configure({
        appenders: {
            out:{ type: 'console' },
            app:{ type: 'file', filename: serverLogFile, alwaysIncludePattern: false }
        },
        categories: {
            default: { appenders: [ 'out', 'app' ], level: 'debug' }
        }
    });

    console.log('Tracing to: ' + serverLogFile);

    fs.chmodSync(serverLogFile, '777');

    process.on('uncaughtException', function (err) {
        console.log('Memslate Server: uncaughtException: ', err);
        console.log('Memslate Server: uncaughtException:  stack: ', err.stack);
        //throw err;

        var transporter = nodemailer.createTransport(directTransport({
            name: 'mail.memslate.com'
        }));
        
        transporter.sendMail({
            from: 'Memslate Team ✔ <info@memslate.com>',
            to: 'gcarbo@miraiblau.com',
            subject: 'Memslate Exception! ✘',
            text: 'Exception Caught,\r\nexc: ' + err + '\r\n\r\nstack: '+err.stack
        });
    });

    var app = express();

    app.disable('etag');        //Disable cache!!!

    app.set('port', process.env.PORT || 5000);
    app.set('bookshelf', bookshelf);
    app.set('models', models);

    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json()); // pull information from html in POST
    app.use(methodOverride());  // simulate DELETE and PUT

    var staticContentPath = __dirname + '/../ionic/www';
    console.log('Memslate Server: Serving Static content from: ' + staticContentPath);
    app.use(express.static(staticContentPath));

    //log request
    app.use(function (req, res, next) {
        console.log('Memslate Server: '+req.method+':'+req.url);
        next();
    });

    //log error
    app.use(function (err, req, res, next) {
        log.error(err.stack);
        res.status(500).send(err.message);
    });

    // CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
    app.use(cors());

    app.all('/resources/*', auth.authenticate);
    app.all('/user/unregister', auth.authenticate);
    app.all('/user/changePwd', auth.authenticate);
    app.all('/user/logout', auth.authenticate);
    app.all('/user/statistics', auth.authenticate);

    app.use('/connect', function(req, res){res.send('ok')});
    app.use('/user/register', auth.register);
    app.use('/user/unregister', auth.unregister);
    app.use('/user/login', auth.login);
    app.use('/user/logout', auth.logout);
    app.use('/user/changePwd', auth.changePwd);
    app.use('/user/recoverPwd', auth.recoverPwd);
    app.use('/user/statistics', user.sendStatistics);

    app.use('/resources', routes.translations);
    app.use('/resources', routes.translationsSamples);
    app.use('/resources', routes.userLanguages);

    app.use('/resources/games/getAll', games.getAll);
    app.use('/resources/games/get/:name_id/:op', games.get);

    app.listen(app.get('port'), function () {
        console.log('Memslate Server: Express server listening on port ' + app.get('port'));
    });

    //start maintenance tasks
    tasks.cleanSessionsTask(config.sessionExpiration);
    tasks.refreshAnonymousTranslationsTask(config.ANONIMOUS_USER_ID);

    models.UserSessions.cleanSessions(config.sessionExpiration.days,config.sessionExpiration.hours,config.sessionExpiration.minutes);
};