/**
 * Created by gerard on 18/03/2015.
 */
function objectFindByKey(array, key, value) {
    if(array && array.length)
    {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }        
    }

    return null;
}

function decoratePromise(promise)
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