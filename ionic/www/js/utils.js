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

String.prototype.toCamelCase = function() {
    return this.replace(/^([A-Z])|\s(\w)/g, function(match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
    });
};

String.prototype.toDash = function(){
    return this.replace(/\s+/g, '-').toLowerCase();
};

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

msUtils.objectDeleteByKey = function(array, key, value) {
  if(array && array.length)
  {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        array.splice(i,1);
        break;
      }
    }
  }
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

msUtils.loadJsCssfile = function(filename, filetype){
    if (filetype=="js"){ //if filename is a external JavaScript file
        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
    }
    else if (filetype=="css"){ //if filename is an external CSS file
        var fileref=document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
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
