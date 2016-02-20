//do not load inside memslate app
"use strict";

if (document.documentElement.innerHTML.indexOf('ng-app="memslate"') == -1) {

  var options = {};
  var tooltip;
  var font_size = '1em';
  var dblclicked=false;

  chrome.runtime.onMessage.addListener(function (message) {
    if (message == 'options_changed');
    {
      chrome.extension.sendRequest({handler: 'get_options'}, function (response) {
        options = JSON.parse(response.options);
        tooltip = undefined;
        console.log('options_changed: get_options: ', options);
      });
    }
  });

  //recover the options to setup the content script (add listeners...)
  chrome.extension.sendRequest({handler: 'get_options'}, function (response) {

	if(!response) return;

    options = JSON.parse(response.options);
    console.log('get_options: ', options);

    tooltip = undefined;

    function getToolTip() {
      if (tooltip) {
        tooltip.hide();
      }
      else {
        tooltip = new Tooltip({dismiss_on: options.dismiss_on});
      }
      return tooltip;
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

        font_size = hit_elem.css('font-size');

        var text_nodes = hit_elem.contents().filter(function () {
          return this.nodeType == Node.TEXT_NODE && XRegExp(word_re).test(this.nodeValue)
        });

        if (text_nodes.length == 0) {
          console.log('no text');
          return {word: ''};
        }

        var hit_text_node = getExactTextNode(text_nodes, e);
        if (!hit_text_node) {
          console.log('hit between lines');
          return {word: ''};
        }

        console.log("getHitWord: node: " + hit_text_node.data);

        var hit_word = restorable(hit_text_node, function (node) {
          var hw = '';

          function getHitText(node, parent_font_style) {
            console.log("getHitText: '" + node.textContent + "'");

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

          console.log('minimal_text_node', minimal_text_node)

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
              console.log("missed!");
            }
            else {
              hw = $(hit_word_elem).text();
              console.log("got it: '" + hw + "'");
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
          if (sample.trim().split(/\s+/).length <= 2) {
            sample = "";
          }
        }

        console.log("getHitWord: word: " + hit_word + " sample: " + sample);

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

        console.log('Selection gotten: ' + selection.toString());

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
        chrome.extension.sendRequest({
          handler: 'translate',
          sl: document.documentElement.lang,
          word: hit.word,
          sample: hit.sample
        }, function (response) {
          console.log('response: ', response);

          if(dblclicked) return;

          var translation = MemsExt.deserialize(response.translation);

          if (!translation) {
            console.log('skipping empty translation');
            return;
          }

          getToolTip().show(e.clientX, e.clientY, MemsExt.formatTranslation(translation, font_size), 'ltr');
        });
      }
    }

    function withOptionsSatisfied(e, do_stuff) {
      if (options.to_lang) {
        do_stuff();
      }
    }

    $(document).on('mousestop', function (e) {
      withOptionsSatisfied(e, function () {
        // translate selection unless 'translate selection on alt only' is set
        if (options.translate_by == 'point') {
          process(e);
        }
      });
    });

    var downtime=null;
    $(document).on('mousedown', function() {
      downtime = new Date().getTime();
    });

    $(document).on('click', function(e) {
      if(e.which!=1) { //check right button
        return;
      }
      if(e.originalEvent.detail > 1) { //ckeck double click
        dblclicked=true;
        return;
      }
      dblclicked=false;
      if((new Date().getTime() - downtime) > 500) { //check selecting
        return;
      }

      //it is a simple click
      withOptionsSatisfied(e, function () {
        if (options.translate_by != 'click')
          return;
        if ($(e.target).closest('a').length > 0)
          return;
        if (e.target.tagName === 'A' ||
            e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'IMG' ||
            e.target.innerText === '')
        {
          return;
        }
        if (e.target.parentElement.tagName === 'A' ||
            e.target.parentElement.tagName === 'BUTTON' ||
            e.target.parentElement.tagName === 'INPUT' ||
            e.target.parentElement.tagName === 'IMG' ||
            e.target.parentElement.innerText === '')
        {
          return;
        }
        //process de event
        process(e);
      });
      return;
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

      timer25 = setTimeout(function () {
        var mousestop = new $.Event("mousestop");
        last_mouse_stop.x = mousestop.clientX = e.clientX;
        last_mouse_stop.y = mousestop.clientY = e.clientY;

        $(document).trigger(mousestop);
      }, delay);
    });
  });
}


