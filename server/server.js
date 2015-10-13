/**
 * Created by gerard on 22/07/2015.
 */
exports.serve = function ()
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
    var routes = require('./routes')(models);
    var games = require('./games')(bookshelf,models);


    var app = express();

    app.disable('etag');        //Disable cache!!!

    app.set('port', process.env.PORT || 5000);
    app.set('bookshelf', bookshelf);
    app.set('models', models);

    app.use(bodyParser());      // pull information from html in POST
    app.use(methodOverride());  // simulate DELETE and PUT

    // Logging
    var log = {
        debug: config.debug,
        warn: config.warn,
        error: config.error
    };

    var staticContent = __dirname + '/../ionic/www';
    log.debug('Serving Static content from: ' + staticContent);
    app.use(express.static(staticContent));

    app.use(function (req, res, next) {
        log.debug(req.method, req.url);
        next();
    });

    app.use(function (err, req, res, next) {
        log.error(err.stack);
        res.status(500).send(err.message);
    });

    // CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
    app.use(cors());

    app.all('/resources/*', auth.authenticate);
    app.all('/unregister', auth.authenticate);
    app.all('/changePwd', auth.authenticate);
    app.all('/logout', auth.authenticate);
    app.all('/changePwd', auth.authenticate);

    app.use('/connect', function(req, res){res.send('ok')});
    app.use('/register', auth.register);
    app.use('/unregister', auth.unregister);
    app.use('/login', auth.login);
    app.use('/logout', auth.logout);
    app.use('/changePwd', auth.changePwd);

    app.use('/resources', routes.translations);
    app.use('/resources', routes.translationsSamples);
    app.use('/resources', routes.userLanguages);

    app.use('/resources/games/getAll', games.getAll);
    app.use('/resources/games/get/:name_id/:op', games.get);

    app.listen(app.get('port'), function () {
        log.debug('Express server listening on port ' + app.get('port'));
    });
};