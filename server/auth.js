var bcrypt = require('bcryptjs'),
    uuid = require('node-uuid'),
    utils = require('./utils'),
    validator = require('validator');


module.exports = function (models) {

    var user_cache = {};
    var register_callback = null;

    function comparePassword(password, hash, callback) {
        console.log("Comparing ", password, " to hash ", hash);
        bcrypt.compare(password, hash, function (err, match) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, match);
            }
        });
    }

    function clean_user(user) {
        delete user.cryptedPassword;
        delete user.password;
        delete user.password2;
        return user;
    }

    function register(req, res, next) {
        var user = req.body;

        if (!validator.isEmail(user.email)) {
            return res.status(400).send("Invalid email address");
        }
        if (!validator.isLength(user.name, 3)) {
            return res.status(400).send("Name must be at least 3 characters");
        }
        if (!validator.isLength(user.password, 3)) {
            return res.status(400).send("Password must be at least 3 characters");
        }

        console.log("Registering ", user);
        new models.User({
            email: user.email
        }).fetch().then(function (model) {
                if (model) {
                    return res.status(500).send("That email is already registered");
                } else {
                    var hash = utils.encryptPassword(user.password);

                    user.token = uuid.v4();
                    user.cryptedPassword = hash;
                    user.isAdmin = false;

                    delete user.password;
                    delete user.password2;

                    new models.User(user).save().then(function (model) {
                        if (register_callback) {
                            register_callback(model);
                        }
                        console.log("Registered: ", model.attributes);
                        res.json(clean_user(model.attributes));

                    }).catch(next);
                }
            });
    }

    function login(req, res, next) {
        var user = req.body;

        new models.User({
            email: user.email
        }).fetch().then(function (model) {
                if (!model) {
                    return res.status(401).send("Invalid credentials");
                }

                console.log("Compare user ", user, " to model ", model.attributes);

                comparePassword(user.password, model.get("cryptedPassword"), function (err, match) {
                    if (err) {
                        console.log(err);
                        return res.status(401).send("Invalid Credentials");
                    }
                    if (match) {
                        model.token = uuid.v4();

                        model.save().then(function (model) {
                            res.json(clean_user(model.attributes));

                        }).catch(next);

                    } else {
                        // Passwords don't match
                        return res.status(401).send("Invalid Credentials");
                    }
                });
            });
    }

    function on_register(callback) {
        register_callback = callback;
    }

    function authenticate(req, res, next) {
        var token = req.headers.authorization;
        if (token) {
            token = token.split(' ')[1];
        } else {
            token = req.query.token;
            delete req.query.token;
        }

        if (token in user_cache) {
            req.user = user_cache[token];
            next();
        } else {
            console.log("Checking token '" + token + "'");
            if (!token) {
                new models.User({
                    email: 'anonymous@memslate.com'
                }).fetch().then(function (model) {
                        if (model) {
                            user_cache[token] = model;
                            req.user = model;
                            return next();
                        }
                    });
            }
            else
            {
                new models.User({
                    token: token
                }).fetch().then(function (model) {
                        if (model) {
                            user_cache[token] = model;
                            req.user = model;
                            return next();
                        } else {
                            console.log("Invalid token, returning 401");
                            return res.status(401).send("Invalid token");
                        }
                    });
            }
        }
    }

    function clear_leaders(req, res, next) {
        user_cache = {};
        return models.clear_leaders(req, res, next);
    }

    function require_admin(req, res, next) {
        if (!req.user.get('isAdmin')) {
            res.status(401).send("Unauthorized");
        } else {
            return next();
        }
    }

    return {
        register: register,
        login: login,
        require_admin: require_admin,
        on_register: on_register,
        authenticate: authenticate,
        clear_leaders: clear_leaders
    };
};