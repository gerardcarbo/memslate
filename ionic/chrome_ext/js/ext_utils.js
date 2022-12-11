MemsExt = {};

MemsExt.modifierKeys = {
  16: "shift", 17: "ctrl", 18: "alt", 224: "meta", 91: "command", 93: "command", 13: "Return"
};

MemsExt.deserialize = function (text) {
  var res;

  if(typeof text === 'object') {
    return text;
  }

  try {
    res = JSON.parse(text);
  }
  catch (e) {
    // that means text is a string (including "") as opposed to a serialized object
    if (e.toString().match(/SyntaxError: Unexpected (token|end of input)/)) {
      res = text;
    }
    else {
      throw e;
    }
  }
  return res;
};

var reCapitalize = /(^|[.!?]\s+)([a-z])/g;
MemsExt.formatTranslation = function (succeeded, translation, hit_elem_style) {
  var formatted_translation = '';
  if (!succeeded) {formatted_translation = '<div>Not Found<div style="font-size:smaller">'+translation+'</div></div>'}
  else if (translation instanceof Array) {
    translation.forEach(function (pos_block) {
      var formatted_pos = pos_block.pos ? '<b>' + pos_block.pos + '</b>: ' : '';
      var formatted_meanings = pos_block.meanings.slice(0, 6).join(', ') + ( pos_block.meanings.length > 6 ? '...' : '' );
      var formatted_syn = "";
      if(pos_block.syn.length > 0) {
        formatted_syn = " (" + pos_block.syn.slice(0, 6).join(', ') + ( pos_block.syn.length > 6 ? '...' : '' ) + ")";
      }
      if(formatted_meanings.includes(".")) { //capitalize first word after .
        formatted_meanings = formatted_meanings.replace(reCapitalize, (m, $1, $2) => $1 + $2.toUpperCase());
      }
      formatted_translation = formatted_translation + '<div>' + formatted_pos + formatted_meanings + formatted_syn + '</div>';
    });
  }
  else {
    formatted_translation = MemsExt.escape_html(translation) ;
  }

  return '<div class="pos_translation">'+formatted_translation+'</div>';
};

MemsExt.escape_html = function (text) {
  return text.replace(XRegExp("(<|>|&)", 'g'), function ($0, $1) {
    switch ($1) {
      case '<':
        return "&lt;";
      case '>':
        return "&gt;";
      case '&':
        return "&amp;";
    }
  });
};

// add \ before characters [-\/^$*+...
MemsExt.regexp_escape = function (s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
