/**
 * Created by gerard on 31/03/2015.
 */
"use strict";

var bcrypt = require('bcryptjs');

exports.encryptPassword = function (password) {
    return bcrypt.hashSync(password, 10);
};

String.prototype.trimChars = (function () {
    "use strict";

    function escapeRegex(string) {
        return string.replace(/[\[\](){}?*+\^$\\.|\-]/g, "\\$&");
    }

    return function trim(characters, flags) {
        flags = flags || "g";
        if (typeof this !== "string" || typeof characters !== "string" || typeof flags !== "string") {
            throw new TypeError("argument must be string");
        }

        if (!/^[gi]*$/.test(flags)) {
            throw new TypeError("Invalid flags supplied '" + flags.match(new RegExp("[^gi]*")) + "'");
        }

        characters = escapeRegex(characters);

        return this.replace(new RegExp("^[" + characters + "]+|[" + characters + "]+$", flags), '');
    };
}());
