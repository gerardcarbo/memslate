#!/usr/bin/env node
/**
 * Created by gerard on 25/03/2015.
 */
"use strict";

var express         = require('express');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var cors            = require('cors');
var config          = require('../server/config');
var knex            = require('knex')(config.knex_options);
var bookshelf       = require('bookshelf')(knex);
var models          = require('../server/models')(bookshelf);
var auth            = require('../server/auth')(models);
var routes          = require('../server/routes')(models);
var path            = require('path');

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

var staticContent = path.resolve(__dirname,'/../ionic/www');
log.debug('Serving Static content from: ' + staticContent);
app.use(express.static(staticContent));

app.use(function(req, res, next) {
    log.debug(req.method, req.url);
    next();
});

app.use(function(err, req, res, next) {
    log.error(err.stack);
    res.status(500).send(err.message);
});

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.use(cors());

app.use('/register', auth.register);
app.use('/login', auth.login);

app.all('/resources/*', auth.authenticate);

app.use('/resources', routes.translations);
app.use('/resources', routes.translationsSamples);
app.use('/resources', routes.userLanguages);

app.listen(app.get('port'), function () {
    log.debug('Express server listening on port ' + app.get('port'));
});

