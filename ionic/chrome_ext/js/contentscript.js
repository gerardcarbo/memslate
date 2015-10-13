//do not load inside memslate app
"use strict";

var debug = true;
function log() {
  if (debug) {
    console.log(arguments);
  }
}

if (document.documentElement.innerHTML.indexOf('ng-app="memslate"') == -1) {

  //recover the options to setup the content script (add listeners...)
  chrome.extension.sendRequest({handler: 'get_options'}, function (response) {

    var options = JSON.parse(response.options);

    var _tooltip;
    function getToolTip()
    {
      if(_tooltip)
      {
        _tooltip.hide();
      }
      else
      {
        _tooltip = new Tooltip({dismiss_on: options.dismiss_on});
      }
      return _tooltip;
    }

    function process(e) {

      function getHitWord(e) {

        function restorable(node, do_stuff) {
          $(node).wrap('<transwrapper />');
          var res = do_stuff(node);
          $('transwrapper').replaceWith(MemsExt.escape_html($('transwrapper').text()));
          return res;
        }

        function getExactTextNode(nodes, e) {
          $(text_nodes).wrap('<transblock />');
          var hit_text_node = document.elementFromPoint(e.clientX, e.clientY);

          //means we hit between the lines
          if (hit_text_node.nodeName != 'TRANSBLOCK') {
            $(text_nodes).unwrap();
            return null;
          }

          hit_text_node = hit_text_node.childNodes[0];

          $(text_nodes).unwrap();

          return hit_text_node;
        }

        var hit_elem = $(document.elementFromPoint(e.clientX, e.clientY));
        var word_re = "\\p{L}+(?:['’]\\p{L}+)*"
        var parent_font_style = {
          'line-height': hit_elem.css('line-height'),
          'font-size': '1em',
          'font-family': hit_elem.css('font-family')
        };

        var text_nodes = hit_elem.contents().filter(function () {
          return this.nodeType == Node.TEXT_NODE && XRegExp(word_re).test(this.nodeValue)
        });

        if (text_nodes.length == 0) {
          log('no text');
          return {word: ''};
        }

        var hit_text_node = getExactTextNode(text_nodes, e);
        if (!hit_text_node) {
          log('hit between lines');
          return {word: ''};
        }

        log("getHitWord: node: " + hit_text_node.data);

        var hit_word = restorable(hit_text_node, function (node) {
          var hw = '';

          function getHitText(node, parent_font_style) {
            log("getHitText: '" + node.textContent + "'");

            if (XRegExp(word_re).test(node.textContent)) {
              $(node).replaceWith(function () {
                return this.textContent.replace(XRegExp("^(.{" + Math.round(node.textContent.length / 2) + "}(?:\\p{L}|['’](?=\\p{L}))*)(.*)", 's'), function ($0, $1, $2) {
                  return '<transblock>' + MemsExt.escape_html($1) + '</transblock><transblock>' + MemsExt.escape_html($2) + '</transblock>';
                });
              });

              $('transblock').css(parent_font_style);

              var next_node = document.elementFromPoint(e.clientX, e.clientY).childNodes[0];

              if (next_node.textContent == node.textContent) {
                return next_node;
              }
              else {
                return getHitText(next_node, parent_font_style);
              }
            }
            else {
              return null;
            }
          }

          var minimal_text_node = getHitText(hit_text_node, parent_font_style);

          log('minimal_text_node', minimal_text_node)

          if (minimal_text_node) {
            //wrap words inside text node into <memsext> element
            $(minimal_text_node).replaceWith(function () {
              return this.textContent.replace(XRegExp("(<|>|&|" + word_re + ")", 'gs'), function ($0, $1) {
                switch ($1) {
                  case '<':
                    return "&lt;";
                  case '>':
                    return "&gt;";
                  case '&':
                    return "&amp;";
                  default:
                    return '<memsext>' + $1 + '</memsext>';
                }
              });
            });

            $('memsext').css(parent_font_style);

            //get the exact word under cursor
            var hit_word_elem = document.elementFromPoint(e.clientX, e.clientY);

            //no word under cursor? we are done
            if (hit_word_elem.nodeName != 'MEMSEXT') {
              log("missed!");
            }
            else {
              hw = $(hit_word_elem).text();
              log("got it: '" + hw + "'");
            }
          }

          return hw;
        });

        //extract sample. Split lines and find hit word
        var sample = "";
        if (options.save_translation_sample) {
          var lines = hit_elem[0].innerText.match(/[^\.!\?]+[\.!\?]+/g);
          if (!lines) {
            if (hit_text_node.data.indexOf(hit_word) >= 0) {
              sample = hit_text_node.data;
            }
          }
          else {
            lines = lines.filter(function (line) {
              return line.indexOf(hit_word) >= 0;
            });

            if (lines.length > 0) {
              sample = lines[0];
            }
          }

          //exclude if less than two number of words
          if(sample.trim().split(/\s+/).length<=2)
          {
            sample = "";
          }
        }

        log("getHitWord: word: " + hit_word + " sample: " + sample);

        return {word: hit_word, sample: sample};
      }

      var selection = window.getSelection();
      var hit_elem = document.elementFromPoint(e.clientX, e.clientY);

      // happens sometimes on page resize (I think)
      if (!hit_elem) {
        return;
      }

      //skip inputs and editable divs
      if (/INPUT|TEXTAREA/.test(hit_elem.nodeName) || hit_elem.isContentEditable
        || $(hit_elem).parents().filter(function () {
          return this.isContentEditable
        }).length > 0) {

        return;
      }

      var hit = {word: ''};
      if (selection.toString()) {

        if (options.word_key_only) {
          log('Skip because "word_key_only"');
          return;
        }

        log('Got selection: ' + selection.toString());

        var sel_container = selection.getRangeAt(0).commonAncestorContainer;

        while (sel_container.nodeType != Node.ELEMENT_NODE) {
          sel_container = sel_container.parentNode;
        }

        if (
          // only choose selection if mouse stopped within immediate parent of selection
        ( $(hit_elem).is(sel_container) || $.contains(sel_container, hit_elem) )
          // and since it can still be quite a large area
          // narrow it down by only choosing selection if mouse points at the element that is (partially) inside selection
        && selection.containsNode(hit_elem, true)
        // But what is the point for the first part of condition? Well, without it, pointing at body for instance would also satisfy the second part
        // resulting in selection translation showing up in random places
        ) {
          hit.word = selection.toString();
        }
        else if (options.translate_by == 'point') {
          hit = getHitWord(e);
        }
      }
      else {
        hit = getHitWord(e);
      }
      if (hit.word != '') {
        chrome.extension.sendRequest({handler: 'translate', sl: document.documentElement.lang, word: hit.word, sample: hit.sample}, function (response) {
          log('response: ', response);

          var translation = MemsExt.deserialize(response.translation);

          if (!translation) {
            log('skipping empty translation');
            return;
          }

          getToolTip().show(e.clientX, e.clientY, MemsExt.formatTranslation(translation), 'ltr');
        });
      }
    }

    function withOptionsSatisfied(e, do_stuff) {
      if (options.target_lang) {
        //respect 'translate only when alt pressed' option
        if (options.word_key_only && !show_popup_key_pressed) {
          return
        }

        do_stuff();
      }
    }



    $(document).on('mousestop', function (e) {
      withOptionsSatisfied(e, function () {
        // translate selection unless 'translate selection on alt only' is set
        if (window.getSelection().toString()) {
          if (!options.word_key_only) {
            process(e);
          }
        } else {
          if (options.translate_by == 'point') {
            process(e);
          }
        }
      });
    });
    $(document).click(function (e) {
      withOptionsSatisfied(e, function () {
        if (options.translate_by != 'click')
          return
        if ($(e.target).closest('a').length > 0)
          return

        process(e);
      });
      return true;
    });

    var show_popup_key_pressed = false;
    $(document).keydown(function (e) {
      if (MemsExt.modifierKeys[event.keyCode] == options.popup_show_trigger) {
        show_popup_key_pressed = true;

        var selection = window.getSelection().toString();

        if (options.word_key_only && selection) {
          log('Got word_key_only');

          chrome.extension.sendRequest({handler: 'translate', word: selection}, function (response) {
            log('response: ', response);

            var translation = MemsExt.deserialize(response.translation);

            if (!translation) {
              log('skipping empty translation');
              return;
            }

            getToolTip().show(last_mouse_stop.x, last_mouse_stop.y, MemsExt.formatTranslation(translation), 'ltr');
          });
        }
      }
    }).keyup(function (event) {
      show_popup_key_pressed = false;
    });

    function hasMouseReallyMoved(e) { //or is it a tremor?
      var left_boundry = parseInt(last_mouse_stop.x) - 5,
        right_boundry = parseInt(last_mouse_stop.x) + 5,
        top_boundry = parseInt(last_mouse_stop.y) - 5,
        bottom_boundry = parseInt(last_mouse_stop.y) + 5;

      return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry || e.clientY < top_boundry;
    }

    $(document).mousemove(function (e) {
      if (hasMouseReallyMoved(e)) {
        var mousemove_without_noise = new $.Event('mousemove_without_noise');
        mousemove_without_noise.clientX = e.clientX;
        mousemove_without_noise.clientY = e.clientY;

        $(document).trigger(mousemove_without_noise);
      }
    });

    var timer25;
    var last_mouse_stop = {x: 0, y: 0};

    // setup mousestop event
    $(document).on('mousemove_without_noise', function (e) {
      clearTimeout(timer25);

      var delay = options.delay;

      if (window.getSelection().toString()) {
        if (options.word_key_only) {
          delay = 200;
        }
      } else {
        if (options.word_key_only) {
          delay = 200;
        }
      }

      timer25 = setTimeout(function () {
        var mousestop = new $.Event("mousestop");
        last_mouse_stop.x = mousestop.clientX = e.clientX;
        last_mouse_stop.y = mousestop.clientY = e.clientY;

        $(document).trigger(mousestop);
      }, delay);
    });
  });
}


