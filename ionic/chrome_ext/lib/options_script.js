var app = angular.module('memslate.chrome_ext.options', ['memslate.services.translate']);

app.controller("MemslateOptionsApp", function ($scope, SessionService, BaseUrlService, TranslationsProvider, LanguagesService) {
  "use strict";
  $scope.save_options = function() {

    Options.target_lang($('#target_lang').val());
    Options.from_lang($('#from_lang').val());
    Options.translate_by($('#translate_by').val());
    Options.word_key_only($('#word_key_only:checked').val() ? 1 : 0);
    Options.selection_key_only($('#selection_key_only:checked').val() ? 1 : 0);
    Options.delay($('#delay').val());
    Options.save_translation_sample($('#save_translation_sample:checked').val() ? 1 : 0)

    $('#status').fadeIn().delay(3000).fadeOut();
  };

  function fill_target_lang() {
    var saved_target_lang = Options.target_lang();

    if (!saved_target_lang) {
      $('#target_lang').append('<option selected value="">Choose...</option>').append('<optgroup label="----------"></optgroup>');
    }

    LanguagesService.getLanguages().success(function(langs){
      langs.items.forEach(function (lang, i) {
        $('#target_lang').append('<option value="' + lang.value + '"' + (saved_target_lang == lang.value ? ' selected' : '') + '>' + lang.name + '</option>');
      });
    });
  }

  function fill_from_lang() {
    var saved_from_lang = Options.from_lang();

    $('#from_lang').append('<option selected value="auto">Autodetect</option>').append('<optgroup label="----------"></optgroup>');

    LanguagesService.getLanguages().success(function(langs){
      langs.items.forEach(function (lang, i) {
        $('#from_lang').append('<option value="' + lang.value + '"' + (saved_from_lang == lang.value ? ' selected' : '') + '>' + lang.name + '</option>');
      });
    });
  }


  function populate_popup_show_trigger() {
    var saved_popup_show_trigger = Options.popup_show_trigger();

    _(MemsExt.modifierKeys).values().uniq().forEach(function (key) {
      $('#word_key_only_key').each(function () {
        $(this).append($('<option>', {value: key}).text(key).prop('selected', saved_popup_show_trigger == key))
      })
    })

    $('#word_key_only_key').change(function () {
      $('#word_key_only_key').val(this.value)
    })
  }

  $(function () {
    fill_target_lang();
    fill_from_lang();
    populate_popup_show_trigger()

    if (Options.translate_by() == 'point') {
      $('#delay').attr('disabled', false).parent().removeClass('disabled');
    }

    if (Options.word_key_only()) {
      $('#delay').attr('disabled', true).parent().addClass('disabled');
    }

    $('#translate_by').val(Options.translate_by()).change(function () {
      if ($(this).val() == 'point' && !$('#word_key_only').attr('checked')) {
        $('#delay').attr('disabled', false).parent().removeClass('disabled');
      }
      else {
        $('#delay').attr('disabled', true).parent().addClass('disabled');
      }
    });

    $('#word_key_only').attr('checked', Options.word_key_only() ? true : false).click(function () {
      if ($('#translate_by').val() == 'point' && !$(this).attr('checked')) {
        $('#delay').attr('disabled', false).parent().removeClass('disabled');
      }
      else {
        $('#delay').attr('disabled', true).parent().addClass('disabled');
      }
    });

    $('#delay').val(Options.delay());

    $('#save_translation_sample').attr('checked', Options.save_translation_sample() ? true : false);

    $(document).on('keydown', function (e) {
      if (e.keyCode == 13) {
        $scope.save_options();
      }
    });

    $('#set_hotkey').on('click', function () {
      chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
      return false;
    });
  });
});



