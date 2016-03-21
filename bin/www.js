#!/usr/bin/env node
/**
 * Created by gerard on 25/03/2015.
 */
"use strict";

var server = require('../server/server');
//rename old log
var fs = require('fs');

function pad(s) {
    return (s < 10) ? '0' + s : s;
}
function getDay(d) {
    return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
}

var  serverLogFile= '/logs/server.log';

fs.stat(serverLogFile, function (err, stat) {
    if (stat && stat.birthtime) {
        var date = stat.birthtime;
        var filename = serverLogFile + "." + getDay(date) + "." + pad(date.getHours()) + "h." + pad(date.getMinutes()) + "m.log";
        console.log("renaming log from "+serverLogFile+" to "+filename);
        fs.renameSync(serverLogFile, filename);
    }

    server.serve(serverLogFile);
});

