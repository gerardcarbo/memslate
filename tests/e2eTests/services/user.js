/**
 * Created by gerard on 06/03/2016.
 */
"use strict";

var UserService = function() {

    this.login = function(email, password) {
        return browser.executeAsyncScript(function(data,callback) {
            var userService = angular.element(document.body).injector().get('UserService');
            userService.login(data.email, data.password);
            callback();
        },{email:email, password:password});
    };

    this.logout = function() {
        return browser.executeAsyncScript(function(callback) {
            var userService = angular.element(document.body).injector().get('UserService');
            userService.logout();
            callback();
        });
    };

    this.register = function(userData) {
        return browser.executeAsyncScript(function(userData,callback) {
            var userService = angular.element(document.body).injector().get('UserService');
            userService.register(userData);
            callback();
        },userData);
    };

    this.unregister = function() {
        return browser.executeAsyncScript(function(callback) {
            var userService = angular.element(document.body).injector().get('UserService');
            userService.unregister();
            callback();
        });
    };

};

module.exports = UserService;