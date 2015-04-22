/**
 * Created by gerard on 31/03/2015.
 */
"use strict";

var bcrypt = require('bcryptjs');

exports.encryptPassword = function (password) {
    return bcrypt.hashSync(password, 10);
};
