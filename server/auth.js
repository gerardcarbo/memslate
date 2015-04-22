"use strict";

var bcrypt = require('bcryptjs'),
    uuid = require('node-uuid'),
    utils = require('./utils'),
    validator = require('validator');


module.exports = function (models) {

    var userCache = {};
    var registerCallback = null;

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

    function cleanUser(user) {
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

                    new models.User(user).save().then(function (userModel) {
                        if (registerCallback) {
                            registerCallback(userModel);
                        }
                        console.log("Registered: ", userModel.attributes);
                        res.json(cleanUser(userModel.attributes));

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

                        model.save().then(function (savedUser) {
                            res.json(cleanUser(savedUser.attributes));

                        }).catch(next);

                    } else {
                        // Passwords don't match
                        return res.status(401).send("Invalid Credentials");
                    }
                });
            });
    }

    function onRegister(callback) {
        registerCallback = callback;
    }

    function authenticate(req, res, next) {
        var token = req.headers.authorization;
        if (token) {
            token = token.split(' ')[1];
        } else {
            token = req.query.token;
            delete req.query.token;
        }

        if (token in userCache) {
            req.user = userCache[token];
            next();
        } else {
            console.log("Checking token '" + token + "'");
            if (!token) {
                new models.User({
                    email: 'anonymous@memslate.com'
                }).fetch().then(function (model) {
                        if (model) {
                            userCache[token] = model;
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
                            userCache[token] = model;
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

    function clearLeaders(req, res, next) {
        userCache = {};
        return models.clearLeaders(req, res, next);
    }

    function requireAdmin(req, res, next) {
        if (!req.user.get('isAdmin')) {
            res.status(401).send("Unauthorized");
        } else {
            return next();
        }
    }

    return {
        register: register,
        login: login,
        requireAdmin: requireAdmin,
        onRegister: onRegister,
        authenticate: authenticate,
        clearLeaders: clearLeaders
    };
};
