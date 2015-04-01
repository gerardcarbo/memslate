/**
 * Created by gerard on 31/03/2015.
 */
var bcrypt = require('bcryptjs');

exports.encryptPassword = function (password) {
    return bcrypt.hashSync(password,10);
};