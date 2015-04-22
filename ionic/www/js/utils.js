/**
 * Created by gerard on 18/03/2015.
 */
"use strict";

var msUtils = {};

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
