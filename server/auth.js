"use strict";

var bcrypt = require('bcryptjs'),
    uuid = require('node-uuid'),
    utils = require('./utils'),
    config = require('./config'),
    validator = require('validator');

module.exports = function (models) {

    var userCache = {};
    var registerCallback = null;

    function comparePassword(password, hash, callback) {
        console.log("Comparing ", password, " to hash ", hash);
        bcrypt.compare(password, hash, function (err, match) {
            if (err) {
                console.log("Comparing error.");
                return callback(err);
            } else {
                console.log("Comparing match: " + match);
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

    function unregister(req, res, next)
    {
        var user = req.user; //comes from authenticate call

        console.log("Unregistering ", user);

        if (user) {
            var userId = user.get('id');
            if (userId === config.ADMIN_USER_ID || userId === config.ANONIMOUS_USER_ID) {
                console.log("Unregistering: undeletable user", userId);
                return res.status(500).send('undeletable user');
            }
            user.destroy();
            console.log("Unregistering: done");
            return res.status(200).send();
        } else {
            console.log("Unregistering: user not found");
            return res.status(500).send();
        }
    }

    function register(req, res, next) {
        var user = req.body;

        if (!validator.isEmail(user.email)) {
            return res.status(400).send("Invalid email address");
        }
        if (!validator.isLength(user.name, 3)) {
            return res.status(400).send("Name must be at least 3 characters long");
        }
        if (!validator.isLength(user.password, 6)) {
            return res.status(400).send("Password must be at least 6 characters long");
        }

        console.log("register: ", user);
        new models.User({
            email: user.email
        }).fetch().then(function (model) {
                if (model) {
                    console.log("register: Email already registered");
                    return res.status(500).send("Email already registered");
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
                        console.log("register done!: ", userModel.attributes);
                        res.json(cleanUser(userModel.attributes));

                    }).catch(next);
                }
            });
    }

    function login(req, res, next) {
        var user = req.body;

        console.log("login enter: ", user);

        new models.User({
            email: user.email
        }).fetch().then(function (model) {
                if (!model) {
                    console.log("login failed: unknown user");
                    return res.status(401).send("Invalid credentials");
                }

                console.log("login: Compare user ", user, " to model ", model.attributes);

                comparePassword(user.password, model.get("cryptedPassword"), function (err, match) {
                    if (err) {
                        console.log("login failed: ",err);
                        return res.status(401).send("Invalid Credentials");
                    }
                    if (match) {
                        model.set('token', uuid.v4());
                        model.save().then(function (savedUser) {
                            console.log("login succeeded: ",savedUser);
                            res.json(cleanUser(savedUser.attributes));
                        }).catch(next);

                    } else {
                        // Passwords don't match
                        console.log("login failed: Passwords don't match");
                        return res.status(401).send("Invalid Credentials");
                    }
                });
            });
    }

    function logout(req, res, next) {
        var user = req.body;

        console.log("logout ", user);

        var token = req.headers.authorization;
        if (token) {
            token = token.split(' ')[1];
        } else {
            token = req.query.token;
            delete req.query.token;
        }

        if (token && token in userCache) {
            delete userCache[token];
        }

        res.status(200).send('logout');
    }

    function onRegister(callback)
    {
        registerCallback = callback;
    }

    function authenticate(req, res, next)
    {
        var token = req.headers.authorization;
        if (token) {
            token = token.split(' ')[1];
        } else {
            token = req.query.token;
            delete req.query.token;
        }

        console.log("authenticate: ", token);

        if (token in userCache) {
            req.user = userCache[token];
            next();
        } else {
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
            else {
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

    function requireAdmin(req, res, next)
    {
        if (!req.user.get('isAdmin')) {
            res.status(401).send("Unauthorized");
        } else {
            return next();
        }
    }

    function changePwd(req, res)
    {
        var user = req.user; //comes from authenticate call
        var data = req.body;

        console.log("changePwd: ", user);

        if (!validator.isLength(data.newPwd, 6))
        {
            return res.status(400).send("Password must be at least 6 characters");
        }

        comparePassword(data.oldPwd, user.get("cryptedPassword"), function (err, match) {
            if (err) {
                console.log('changePwd: error: ', err);
                return res.status(401).send("Invalid Credentials");
            }
            if (match) {
                user.set('cryptedPassword', utils.encryptPassword(data.newPwd));
                console.log('changePwd:user.cryptedPassword: ', user.get('cryptedPassword'));
                user.save().then(function (savedUser) {
                    res.json(cleanUser(savedUser.attributes));
                }).catch(function (err){
                    return res.status(401).send(err);
                });

            } else {
                // Passwords don't match
                return res.status(401).send("Invalid Credentials");
            }
        });
    }

    return {
        register: register,
        unregister: unregister,
        login: login,
        logout: logout,
        requireAdmin: requireAdmin,
        onRegister: onRegister,
        authenticate: authenticate,
        changePwd: changePwd
    };
};
