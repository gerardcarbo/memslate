"use strict";

var app = angular.module('memslate', ['ionic', 'memslate.directives', 'memslate.services']);

var MemslateExtOptions =
{
  from_lang: function (lang) {
    if (lang) {
      localStorage['from_lang'] = lang;
    }
    return localStorage['from_lang'] || 'auto';
  },
  to_lang: function (lang) {
    if (lang) {
      localStorage['to_lang'] = lang;
    }
    return localStorage['to_lang'] || "en";
  },
  ctrl_pressed: function(option){
      if (option != undefined) {
          localStorage['ctrl_pressed'] = option;
      }
      return localStorage['ctrl_pressed'] ? (localStorage['ctrl_pressed'] == 'true' ? true : false) : true;
  },
  not_langs: function (langs) {
    if (langs) {
      localStorage['not_langs'] = langs;
    }
    return localStorage['not_langs'];
  },
  translate_by: function (arg) {
    if (arg == 'click' || arg == 'point') {
      localStorage.translate_by = arg;
    }
    return localStorage.translate_by || 'point';
  },
  delay: function (ms) {
    if (ms != undefined && !isNaN(parseFloat(ms)) && isFinite(ms)) {
      localStorage['delay'] = ms;
    }
    return localStorage['delay'] == undefined ? 500 : parseInt(localStorage['delay']);
  },
  save_translation_sample: function (arg) {
    if (arg != undefined) {
      localStorage['save_translation_sample'] = arg;
    }
    return localStorage['save_translation_sample'] ? (localStorage['save_translation_sample'] == 'true' ? true : false) : false;
  },
  dismiss_on: function (arg) {
    if (arg != undefined) {
      localStorage['dismiss_on'] = arg;
    }
    return localStorage['dismiss_on'] === undefined ? 'mousemove' : localStorage['dismiss_on'];
  }
};

app.factory("MemslateExtOptions", function () {
  return MemslateExtOptions;
});

app.component("msExtensionOptions", {
  templateUrl: "./options.html",
  controllerAs: "msAppCtrl",
  require: {
    user: '^msUserOperations'
  },
  controller: function ($scope, SessionService, UserService, TranslationsProviders, LanguagesService, UI, MemslateExtOptions) {
    var self = this;
    this.loading = true;
    this.from_lang = MemslateExtOptions.from_lang();
    this.to_lang = MemslateExtOptions.to_lang();
    this.ctrl_pressed = MemslateExtOptions.ctrl_pressed();
    this.not_langs = MemslateExtOptions.not_langs() ? MemslateExtOptions.not_langs().split(',') : [];
    this.translate_by = MemslateExtOptions.translate_by();
    this.delay = MemslateExtOptions.delay();
    this.save_translation_sample = MemslateExtOptions.save_translation_sample();
    this.dismiss_on = MemslateExtOptions.dismiss_on();
    this.translate_by_opts = [
      {name: 'Click on', value: 'click'},
      {name: 'Point at (mouse over)', value: 'point'}
    ];
    this.dismiss_on_opts = [
      {name: 'On Mouse Move', value: 'mousemove'},
      {name: 'When ESC key pressed', value: 'esc'}
    ];

    LanguagesService.getLanguages().success(function (langs) {
      self.languagesFrom = angular.copy(langs);
      self.languagesFrom.items.unshift({name: 'Autodetect', value: 'auto'});
      self.languagesFrom.user.prefered.unshift('auto');
      self.languagesTo = angular.copy(langs);

      if (!self.to_lang || !msUtils.objectFindByKey(langs.items, 'value', self.to_lang)) {
        self.to_lang = langs.user.prefered[0];
        self.saveOptions(false);
      }

      
    });
    
    this.getLanguage = function (lang) {
      if (!self.languagesTo) return;
      var item = msUtils.objectFindByKey(self.languagesTo.items, "value", lang);
      if (item) return item.name;
      return;
    };
    
    this.saveOptions = function (showToast) {
      if (!this.to_lang) {
        UI.showAlert('To Language Not Defined', 'You must define a language to translate to.');
        return;
      }
      MemslateExtOptions.from_lang(this.from_lang);
      MemslateExtOptions.to_lang(this.to_lang);
      MemslateExtOptions.ctrl_pressed(this.ctrl_pressed);
      MemslateExtOptions.not_langs(this.not_langs);
      MemslateExtOptions.translate_by(this.translate_by);
      MemslateExtOptions.delay(this.delay);
      MemslateExtOptions.save_translation_sample(this.save_translation_sample);
      MemslateExtOptions.dismiss_on(this.dismiss_on);
      
      chrome.extension.sendRequest({handler: 'options_changed'});
      
      if (showToast)
      UI.toast('Options Applied!',1000);
    };
    
    $scope.$watch('msAppCtrl.not_lang', function (newValue, oldValue) {
      if (newValue!=undefined) {
        console.log('extApp.not_lang: ' + newValue);
        var index = 0;
        if ((index = self.not_langs.indexOf(newValue)) == -1) {
          self.not_langs.push(newValue);
        }
        else {
          self.not_langs.splice(index, 1);
        }
        self.not_lang = undefined;
        self.saveOptions(!self.loading);
      }
    });
    
    $scope.$watch('msAppCtrl.from_lang', function (newValue, oldValue) {
      if (newValue!=undefined) {
        self.saveOptions(!self.loading);
      }
    });   
    $scope.$watch('msAppCtrl.to_lang', function (newValue, oldValue) {
      if (newValue!=undefined) {
        self.saveOptions(!self.loading);
      }
    });   
    $scope.$watch('msAppCtrl.ctrl_pressed', function (newValue, oldValue) {
      if (newValue!=undefined) {
        self.saveOptions(!self.loading);
      }
    });   
    $scope.$watch('msAppCtrl.translate_by', function (newValue, oldValue) {
      if (newValue!=undefined) {
        self.saveOptions(!self.loading);
      }
    });   
    $scope.$watch('msAppCtrl.delay', function (newValue, oldValue) {
      if (newValue!=undefined) {
        self.saveOptions(!self.loading);
      }
    });   
    $scope.$watch('msAppCtrl.save_translation_sample', function (newValue, oldValue) {
      if (newValue!=undefined) {
        self.saveOptions(!self.loading);
      }
    });   
    $scope.$watch('msAppCtrl.dismiss_on', function (newValue, oldValue) {
      if (newValue!=undefined) {
        self.saveOptions(!self.loading);
      }
    });  
    setTimeout(()=>{
      this.loading = false;
    },500);
  }
});




