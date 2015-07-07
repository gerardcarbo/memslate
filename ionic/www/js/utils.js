/**
 * Created by gerard on 18/03/2015.
 */
"use strict";

if(!Date.prototype.adjustDate){
    Date.prototype.adjustDate = function(days){
        var date;

        days = days || 0;

        if(days === 0){
            date = new Date( this.getTime() );
        } else if(days > 0) {
            date = new Date( this.getTime() );

            date.setDate(date.getDate() + days);
        } else {
            date = new Date(
                this.getFullYear(),
                this.getMonth(),
                this.getDate() - Math.abs(days),
                this.getHours(),
                this.getMinutes(),
                this.getSeconds(),
                this.getMilliseconds()
            );
        }

        this.setTime(date.getTime());

        return this;
    };
}

var msUtils = {};

msUtils.getService = function(serviceName)
{
    return angular.element(document.body).injector().get(serviceName);
};

msUtils.objectFindByKey = function(array, key, value) {
    if(array && array.length)
    {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
    }

    return null;
};

msUtils.decoratePromise = function(promise)
{
    //define success and error methods for the promise
    promise.success = function(fn) {
        promise.then(fn);
        return promise;
    };
    promise.error = function(fn) {
        promise.then(null, fn);
        return promise;
    };
};


var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

msUtils.convertDateStringsToDates = function(input)
{
    // Ignore things that aren't objects.
    if (typeof input !== "object") return input;

    for (var key in input) {
        if (!input.hasOwnProperty(key)) continue;

        var value = input[key];
        var match;
        // Check for string properties which look like dates.
        if (typeof value === "string" && (match = value.match(regexIso8601))) {
            var milliseconds = Date.parse(match[0])
            if (!isNaN(milliseconds)) {
                input[key] = new Date(milliseconds);
            }
        } else if (typeof value === "object") {
            // Recurse into object
            msUtils.convertDateStringsToDates(value);
        }
    }

    return input;
}

var msConfig = {
    toastShowTime: 2000
};
