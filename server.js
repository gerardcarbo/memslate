var express         = require('express'),
    config          = require('./server/config'),
    bodyParser      = require('body-parser'),
    methodOverride  = require('method-override'),
    translations    = require('./server/routes/translations');


app = express();

app.use(bodyParser());          // pull information from html in POST
app.use(methodOverride());      // simulate DELETE and PUT

app.use(express.static(__dirname+'/ionic/www'));

// Logging
logger = {
    debug: config.debug,
    warn: config.warn,
    error: config.error
};

app.use(function(req, res, next) {
    logger.debug(req.method, req.url);
    next();
});

app.use(function(err, req, res, next) {
    logger.error(err.stack);
    res.status(500).send(err.message);
});

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/translations', translations.findAll);
app.get('/translations/:id', translations.findById);

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
