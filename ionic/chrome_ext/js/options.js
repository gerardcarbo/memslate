var app = angular.module('memslate.chrome_ext', ['memslate.controllers', 'memslate.directives', 'memslate.services', 'memslate.services.ui', 'memslate.services.translate']);

var MemslateExtOptions = {
  target_lang: function (lang) {
    if (lang) {
      localStorage['target_lang'] = lang;
    }
    return localStorage['target_lang'];
  },
  from_lang: function (lang) {
    if (lang) {
      localStorage['from_lang'] = lang;
    }
    return localStorage['from_lang'] || 'auto';
  },
  word_key_only: function (arg) {
    if (arg != undefined) {
      localStorage['word_key_only'] = arg;
    }
    return localStorage['word_key_only'] ? parseInt(localStorage['word_key_only']) : 0;
  },
  selection_key_only: function (arg) {
    if (arg != undefined) {
      localStorage['selection_key_only'] = arg;
    }
    return parseInt(localStorage['selection_key_only']);
  },
  translate_by: function (arg) {
    if (arg == 'click' || arg == 'point') {
      localStorage.translate_by = arg;
    }
    return localStorage.translate_by || 'click';
  },
  delay: function (ms) {
    if (ms != undefined && !isNaN(parseFloat(ms)) && isFinite(ms)) {
      localStorage['delay'] = ms;
    }
    return localStorage['delay'] == undefined ? 700 : parseInt(localStorage['delay']);
  },
  popup_show_trigger: function (arg) {
    if (arg != undefined) {
      localStorage['popup_show_trigger'] = arg;
    }
    return localStorage['popup_show_trigger'] || 'alt';
  },
  save_translation_sample: function (arg) {
    if (arg != undefined) {
      localStorage['save_translation_sample'] = arg;
    }
    return localStorage['save_translation_sample'] ? (localStorage['save_translation_sample']=='true' ? true : false) : false;
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

app.controller("MemslateExtApp", function ($scope, SessionService, BaseUrlService, TranslationsProviders, LanguagesService, UI, MemslateExtOptions) {
  "use strict";
  var self = this;
  this.from_lang = MemslateExtOptions.from_lang();
  this.target_lang = MemslateExtOptions.target_lang();
  this.translate_by = MemslateExtOptions.translate_by();
  this.word_key_only = MemslateExtOptions.word_key_only();
  this.selection_key_only = MemslateExtOptions.selection_key_only();
  this.delay = MemslateExtOptions.delay();
  this.save_translation_sample = MemslateExtOptions.save_translation_sample();
  this.dismiss_on = MemslateExtOptions.dismiss_on();
  this.translate_by_opts = [
    {name:'Click on word',value:'click'},
    {name:'Point at word',value:'point'}
  ];
  this.dismiss_on_opts = [
    {name:'On Mouse Move',value:'mousemove'},
    {name:'When ESC key pressed',value:'esc'}
  ];

  LanguagesService.getLanguages().success(function (langs) {
    self.languagesFrom = langs;
    self.languagesFrom.items.unshift({name:'Autodetect', value:'auto'});
    self.languagesFrom.user.prefered.unshift('auto');
    self.languagesTarget = langs;
  });

  this.saveOptions = function (optionsForm) {
    if(!this.target_lang) {
      UI.showAlert('To Language Not Defined','You must define a language to translate to.');
      return;
    }
    MemslateExtOptions.target_lang(this.target_lang);
    MemslateExtOptions.from_lang(this.from_lang);
    MemslateExtOptions.translate_by(this.translate_by);
    MemslateExtOptions.word_key_only(this.word_key_only);
    MemslateExtOptions.selection_key_only(this.selection_key_only);
    MemslateExtOptions.delay(this.delay);
    MemslateExtOptions.save_translation_sample(this.save_translation_sample);
    MemslateExtOptions.dismiss_on(this.dismiss_on);

    UI.toast('Options Saved! Please reload the pages for the changes to take effect.',3000);
  };

  function populate_popup_show_trigger() {
    var saved_popup_show_trigger = MemslateExtOptions.popup_show_trigger();

    _(MemsExt.modifierKeys).values().uniq().forEach(function (key) {
      $('#word_key_only_key').each(function () {
        $(this).append($('<option>', {value: key}).text(key).prop('selected', saved_popup_show_trigger == key))
      })
    })

    $('#word_key_only_key').change(function () {
      $('#word_key_only_key').val(this.value)
    })
  }

  populate_popup_show_trigger()

});




