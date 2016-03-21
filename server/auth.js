"use strict";

var bcrypt = require('bcryptjs'),
    uuid = require('node-uuid'),
    utils = require('./utils'),
    config = require('./config'),
    validator = require('validator'),
    nodemailer = require('nodemailer'),
    _ = require('lodash');

module.exports = function (models) {

    var usersCache = {};

    function comparePassword(password, hash, callback) {
        console.log("Comparing to hash " + hash);
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
        delete user.password;
        delete user.password2;
        return user;
    }

    function sendUser(res, user, token) {
        cleanUser(user);
        var sentUser = _.omit(user, 'cryptedPassword');
        if (token) sentUser.token = token;
        res.json(sentUser);
    }

    function unregister(req, res, next) {
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

                    user.cryptedPassword = hash;
                    user.isAdmin = false;
                    user.updatedAt = new Date();

                    var password = user.password;

                    //do not save pwds
                    delete user.password;
                    delete user.password2;

                    new models.User(user).save().then(function (userModel) {
                        console.log("register done!: ", userModel.attributes);

                        req.body.password = password; //re-put user password for the login phase
                        login(req, res, next);
                    }).catch(next);
                }
            });
    }

    function login(req, res, next) {
        var user = req.body;

        console.log("login enter: ", user.email);

        new models.User({
            email: user.email
        }).fetch().then(function (userModel) {
                if (!userModel) {
                    console.log("login failed: unknown user");
                    return res.status(401).send("Invalid credentials");
                }

                comparePassword(user.password, userModel.get("cryptedPassword"), function (err, match) {
                    if (err) {
                        console.log("login failed: ", err);
                        return res.status(401).send("Invalid Credentials");
                    }
                    if (match) {
                        console.log("login succeeded: ", user.email);
                        var newToken = uuid.v4();

                        new models.UserSessions({
                            userId: userModel.get("id"),
                            token: newToken,
                            accessedAt: new Date(),
                            updatedAt: new Date()
                        }).save().then(function (userSessionModel) {
                            console.log("login token "+newToken+" saved and in cache");
                            usersCache[newToken] = {user: userModel, session: userSessionModel};
                            console.log("login sending user...");
                            sendUser(res, userModel.attributes, newToken);
                        });
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
        var userId = req.user.id;

        var token = req.headers.authorization;
        if (token) {
            token = token.split(' ')[1];
        } else {
            token = req.query.token;
            delete req.query.token;
        }

        console.log("logout: user: " + req.user + ' token: ' + token);

        if (token && token in usersCache) {
            console.log("logout: destroying session");
            usersCache[token].session.destroy();
            delete usersCache[token];
        }

        console.log('logout: usersCache: \n', _.keys(usersCache));

        res.status(200).send('logout');
    }

    function sendMailAuthFailed(desc, sessionModels)
    {
        var transporter = nodemailer.createTransport();
        transporter.sendMail({
            from: 'Memslate Team ✔ <info@memslate.com>',
            to: "info@memslate.com",
            subject: 'Memslate Authentication Failed ✘',
            html: desc+"<br><br>Cache tokens:<br><br>"+JSON.stringify(usersCache)+"<br><br>Db Tokens:<br><br>" +
                    (sessionModels ? JSON.stringify(sessionModels):"")
        }, function (error) {
            if (error) {
                console.log('sendMailAuthFailed: sending mail failed: ',error);
            }
            else {
                console.log('sendMailAuthFailed: ok');
            }
        });
    }

    function authenticate(req, res, next) {
        var token = req.headers.authorization;
        if (token) {
            token = token.split(' ')[1];
        } else {
            token = req.query.token;
            delete req.query.token;
        }

        console.log("authenticate: path: "+req.url+" token: "+token);

        if (!token) { // use anonymous user
            if (usersCache['anonymous']) {
                console.log("authenticate: return cached anonymous");
                req.user = usersCache['anonymous'].user;
                next();
            }
            else {
                console.log("authenticate: fetching anonymous...");
                new models.User({
                    email: 'anonymous@memslate.com'
                }).fetch().then(function (model) {
                        if (model) {
                            console.log("authenticate: anonymous fetched from db and returned");
                            usersCache['anonymous'] = {user: model, session: null};
                            req.user = model;
                            next();
                        }
                    });
            }
        }
        else {
            if (token in usersCache) {
                console.log("authenticate: token in usersCache \r\n",_.keys(usersCache));
                req.user = usersCache[token].user;

                updateAccessedAt(usersCache[token]);
                updateToken(usersCache[token], res, next);

                next();
            }
            else { //try to recover session from db
                console.log("authenticate: fetching "+token+" token ...");
                new models.UserSessions({
                    token: token
                }).fetch().then(function (sessionModel) {
                        if (sessionModel) {
                            new models.User({id: sessionModel.get('userId')}).fetch().then(function (userModel) {
                                if (userModel) {
                                    usersCache[token] = {user: userModel, session: sessionModel};
                                    req.user = userModel;

                                    updateAccessedAt(usersCache[token]);
                                    updateToken(usersCache[token], res, next);

                                    next();
                                }
                                else {
                                    console.log("authenticate: Invalid user '" + sessionModel.get('userId') + "' , returning 401");
                                    console.log('authenticate: userCache: \n', _.keys(usersCache));
                                    res.status(401).send("Invalid user");

                                    sendMailAuthFailed("Invalid user '" + sessionModel.get('userId') + "'")
                                }
                            });
                        } else {
                            console.log("authenticate: Invalid token, returning 401");
                            console.log('authenticate: userCache: \n', _.keys(usersCache));
                            res.status(401).send("Invalid token");

                            new models.UserSessions().fetchAll().then(function (sessionModels) {
                                sendMailAuthFailed("Invalid token '" + token + "'", sessionModels);
                            });
                        }
                    });
            }
        }
    }

    function updateAccessedAt(userCache, next) {
        userCache.session.set('accessedAt', new Date());
        return userCache.session.save().then(function (savedSessionModel) {
            //debugging...
        }).catch(next);
    }

    function updateUpdatedAt(userCache, next) {
        userCache.user.set('updatedAt', new Date());
        userCache.user.save().then(function (savedUserModel) {
            //debugging...
        }).catch(next);
        userCache.session.set('updatedAt', new Date());
        return userCache.session.save().then(function (savedSessionModel) {
            //debugging...
        }).catch(next);
    }

    function updateToken(userCache, response, next) {
        var numDaysTokenExpiration = 0;
        var numHoursTokenExpiration = 0;
        var numMinutesTokenExpiration = 1;
        var updatedAt = userCache.session.get('updatedAt');
        var accessedAt = userCache.session.get('accessedAt');
        if (accessedAt > updatedAt.adjustDate(numDaysTokenExpiration, numHoursTokenExpiration, numMinutesTokenExpiration)) {
            //clean old session token
            var oldToken = userCache.session.get('token');
            setTimeout(function() {
                delete usersCache[oldToken];
            },5000); //let some time to incoming requests with the old token

            //create new token and save
            var newToken = uuid.v4();
            console.log('updateToken: updating token -> updatedAt: ' + updatedAt.toLocaleString() + ' accessedAt: ' + accessedAt.toLocaleString() +
                '\n' + oldToken + ' -> ' + newToken);

            response.setHeader('Access-Control-Expose-Headers', 'updated_token');
            response.setHeader('updated_token', newToken);

            userCache.session.set('token', newToken);
            updateUpdatedAt(userCache, next);

            usersCache[newToken] = userCache;
            console.log('updateToken: userCache: \n', _.keys(usersCache));
        }
    }

    function requireAdmin(req, res, next) {
        if (!req.user.get('isAdmin')) {
            res.status(401).send("Unauthorized");
        } else {
            return next();
        }
    }

    function recoverPwd(req, res) {
        var email = req.body.email;
        console.log("recoverPwd: ", email);
        new models.User({
            email: email
        }).fetch().then(function (user) {
                if (user) {
                    var data = {};
                    data.newPwd = uuid.v4().replace('-', '').substr(0, 8);
                    _changePwdInternal(user, data, function (error, savedUser) {
                        if (error) {
                            console.log("recoverPwd: _changePwdInternal failed ", error);
                            return res.status(500).send("Invalid user");
                        }
                        else {
                            console.log("recoverPwd: sending mail to "+email);

                            var transporter = nodemailer.createTransport();
                            transporter.sendMail({
                                from: 'Memslate Team ✔ <info@memslate.com>',
                                to: email,
                                subject: 'Memslate Password Recovery ✔',
                                html: 'hello ' + user.get('name') + ',<br>&nbsp;&nbsp;&nbsp;&nbsp;your new password is <b>' + data.newPwd + '</b>. Please change this password as soon as possible.<br>cheers,<br>&nbsp;&nbsp;&nbsp;&nbsp;The Memslate Team'
                            }, function (error) {
                                if (error) {
                                    console.log('recoverPwd: sending mail failed: ',error);
                                    return res.status(500).send(error);
                                }
                                else {
                                    console.log('recoverPwd: ok');
                                    return res.status(200).send();
                                }
                            });

                            console.log('recoverPwd: exit');
                            return;
                        }
                    });
                }
                else {
                    console.log("recoverPwd: unknown email");
                    return res.status(404).send("Invalid email");
                }
            });
    }

    function _changePwdInternal(user, data, done) {
        user.set('cryptedPassword', utils.encryptPassword(data.newPwd));
        console.log('_changePwdInternal:user.cryptedPassword: ', user.get('cryptedPassword'));
        user.save().then(function (savedUser) {
            done(null, savedUser);
        }).catch(function (err) {
            done(err);
        });
    }

    function changePwd(req, res) {
        var user = req.user; //comes from authenticate call
        var data = req.body;

        console.log("changePwd: ", user.get('name'));

        if (user.id==config.ANONIMOUS_USER_ID) {
            return res.status(400).send("Invalid User");
        }

        if (!validator.isLength(data.newPwd, 6)) {
            return res.status(400).send("Password must be at least 6 characters");
        }

        comparePassword(data.oldPwd, user.get("cryptedPassword"), function (err, match) {
            if (err) {
                console.log('changePwd: error: ', err);
                return res.status(400).send("Invalid Credentials");
            }
            if (match) {
                _changePwdInternal(user, data, function (error, savedUser) {
                    if (error) {
                        return res.status(500).send(err);
                    }
                    else {
                        sendUser(res, savedUser.attributes);
                    }
                });
            } else {
                // Passwords don't match
                return res.status(400).send("Invalid Credentials");
            }
        });
    }

    return {
        register: register,
        unregister: unregister,
        login: login,
        logout: logout,
        requireAdmin: requireAdmin,
        authenticate: authenticate,
        changePwd: changePwd,
        recoverPwd: recoverPwd
    };
};
