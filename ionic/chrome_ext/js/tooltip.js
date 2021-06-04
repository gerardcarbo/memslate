Tooltip = (function () {
  function Tooltip(args) {
    var opts = $.extend({dismiss_on: 'mousemove'}, args)
    var self = this;
    var tt;

    function inject_css(tt) {
      var cssLink = document.createElement("link");
      cssLink.href = chrome.extension.getURL('chrome_ext/css/tooltip.css');
      cssLink.rel = "stylesheet";
      cssLink.type = "text/css";
      document.head.appendChild(cssLink);
    }

    function position(x, y, tt) {
      var pos = {};
      var margin = 5;
      var anchor = 10;

      // show popup to the right of the word if it fits into window this way
      if (x + anchor + tt.outerWidth(true) + margin < $(window).width()) {
        pos.x = x + anchor;
      }
      // show popup to the left of the word if it fits into window this way
      else if (x - anchor - tt.outerWidth(true) - margin > 0) {
        pos.x = x - anchor - tt.outerWidth(true);
      }
      else {
        pos.x = margin;
      }

      // show popup above the word if it fits into window this way
      if (y - anchor - tt.outerHeight(true) - margin > 0) {
        pos.y = y - anchor - tt.outerHeight(true);
      }
      // show popup below the word if it fits into window this way
      else if (y + anchor + tt.outerHeight(true) + margin < $(window).height()) {
        pos.y = y + anchor;
      }
      // show popup at the very top of the window
      else {
        pos.y = margin;
      }

      return pos;
    }

    function setup_dismiss(tt) {
      if (opts.dismiss_on == 'mousemove') {
        $(document).on('mousemove_without_noise', self.hide);
        $(window).scroll(self.hide);
      }
      else {
        $(document).keydown(escape_hide_handler);
        tt.contents().keydown(escape_hide_handler);
      }
    }

    function escape_hide_handler(e) {
      if (e.keyCode == 27) {
        self.hide();
      }
    }

    function set_text_direction(text_direction, tt) {
      tt.contents().find('.pos_translation').css('direction', text_direction || 'ltr');
    }


    this.show = function(x, y, content, text_direction, style) {
      tt.html(content);

      var pos = position(x, y, tt);

      setup_dismiss(tt);

      set_text_direction(text_direction, tt);

      tt
        .hide()
        .blur() // so that page document (not tt iframe) catches keyboard events
        .css({ top: pos.y, left: pos.x })
        .css(style)
        .fadeIn(200)
        .queue(function() {
          if (self.on_open) {
            self.on_open()
          }
          $(this).dequeue();
      });
    };

    this.hide = function() {
      tt
        .fadeOut(200)
        .css('top', '-1500px')
        .show();
    };

    this.is_hidden = function() {
      return !tt || tt.css('top') == '-1500px';
    };

    this.is_visible = function() {
      return tt && !this.is_hidden();
    };

    this.find = function(selector) {
      return tt.contents().find(selector);
    };

    tt = $('<div>', {
        css: {
          /*background: '#fcf7d9',*/
          'text-align': 'left',
          'border-style': 'solid',
          'border-width': '1px',
          'border-color': '#ccc',
          'box-shadow': 'rgba(0,0,0,0.2) 0px 2px 5px',
          position: 'fixed',
          'border-radius': '5px',
          'z-index': 2147483647,
          top: '-1500px',
          display: 'none',
          'font-size': '1em',
          padding: '5px'
        },
        id: 'memslate_tooltip'
    }).appendTo('body');

    inject_css(tt);
  }

  return Tooltip;
})();
