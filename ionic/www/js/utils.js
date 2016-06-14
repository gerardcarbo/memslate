"use strict";

if (!Date.prototype.adjustDate) {
  Date.prototype.adjustDate = function (days, hours, minutes) {

    days = days || 0;
    hours = hours || 0;
    minutes = minutes || 0;

    var date = new Date(
      this.getTime() + minutes*60000 + hours*60*60000 + days*24*60*60000);

    return date;
  };
}

String.prototype.toCamelCase = function () {
  return this.replace(/^([A-Z])|\s(\w)/g, function (match, p1, p2, offset) {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  });
};

String.prototype.toDash = function () {
  return this.replace(/\s+/g, '-').toLowerCase();
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

try {
  Element.prototype.getTop = function()
  {
    var element = this;
    var yPosition = 0;
    while(element) {
      yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
      element = element.offsetParent;
    }
    return yPosition;
  };


  Element.prototype.isHidden = function() {
    return (this.offsetParent === null)
  }
}catch(err){};



var msUtils = {};

msUtils.getService = function (serviceName) {
  if (angular.element(document.body).injector())
    return angular.element(document.body).injector().get(serviceName);
  else
    return null;
};

msUtils.objectFindByKey = function (array, key, value) {
  if (array && array.length) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        return array[i];
      }
    }
  }
  return null;
};

msUtils.objectDeleteByKey = function (array, key, value) {
  if (array && array.length) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        array.splice(i, 1);
        break;
      }
    }
  }
};

msUtils.decoratePromise = function (promise) {
  //define success and error methods for the promise
  promise.success = function (fn) {
    promise.then(fn);
    return promise;
  };
  promise.error = function (fn) {
    promise.then(null, fn);
    return promise;
  };
};

msUtils.loadJsCssfile = function (filename, filetype) {
  if (filetype == "js") { //if filename is a external JavaScript file
    var fileref = document.createElement('script')
    fileref.setAttribute("type", "text/javascript")
    fileref.setAttribute("src", filename)
  }
  else if (filetype == "css") { //if filename is an external CSS file
    var fileref = document.createElement("link")
    fileref.setAttribute("rel", "stylesheet")
    fileref.setAttribute("type", "text/css")
    fileref.setAttribute("href", filename)
  }
  if (typeof fileref != "undefined")
    document.getElementsByTagName("head")[0].appendChild(fileref)
};

var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

msUtils.convertDateStringsToDates = function (input) {
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

// Enable or disable console.log
// To force logging execute: localStorage.setItem('forceDebug','true') on console
var msLogger = function () {
  var oldConsoleLog = null;
  var pub = {};

  pub.enableLogger = function enableLogger() {
    if (oldConsoleLog == null)
      return;

    window['console']['log'] = oldConsoleLog;
  };

  pub.disableLogger = function disableLogger() {
    var forceDebug;
    if((forceDebug=localStorage.getItem('forceDebug')) && forceDebug=="true")
      return;

    oldConsoleLog = console.log;
    window['console']['log'] = function () {
    };
  };

  return pub;
}();
