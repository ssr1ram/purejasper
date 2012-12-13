
var jade = (function(exports){
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  } 
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj){
  var buf = []
    , terse = obj.terse;
  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;
  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];
      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else {
        buf.push(key + '="' + exports.escape(val) + '"');
      }
    }
  }
  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;

  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context); 

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno 
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

  return exports;

})({});
var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee",".jade"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/page.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div');
buf.push(attrs({ "class": ('container') }));
buf.push('><div');
buf.push(attrs({ 'style':('position:relative'), "class": ('menubar') }));
buf.push('></div><div');
buf.push(attrs({ 'style':('margin-top:30px'), "class": ('main') }));
buf.push('><div');
buf.push(attrs({ "class": ('paratabs') }));
buf.push('></div><div');
buf.push(attrs({ "class": ('paraview') }));
buf.push('><div');
buf.push(attrs({ 'style':('text-align:left;background-color:#ffffff;padding:0px 10px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd'), "class": ('paraonpage') }));
buf.push('><div');
buf.push(attrs({ 'style':('color:#cccccc'), "class": ('pull-right') + ' ' + ('paraactions') }));
buf.push('></div><div');
buf.push(attrs({ 'style':('clear:both;padding:0px 10px;margin-right:16px;height:' + (h) + 'px;overflow:auto'), "class": ('paracontents') }));
buf.push('><div');
buf.push(attrs({ 'style':('padding:4px 6px'), "class": ('htmlarea') }));
buf.push('></div><div');
buf.push(attrs({ 'style':('display:none'), "class": ('editspot') }));
buf.push('><textarea');
buf.push(attrs({ 'style':('width:100%;height:' + (h-10) + 'px;'), "class": ('editarea') }));
buf.push('></textarea></div></div></div></div><div');
buf.push(attrs({ 'style':('text-align:center') }));
buf.push('><div');
buf.push(attrs({ 'style':('color:#ccc;margin-top:20px;letter-spacing:3px') }));
buf.push('>&copy; 2013 purejasper.com</div></div></div></div><div');
buf.push(attrs({ 'style':('display:none'), "class": ('modal') + ' ' + ('ymodal') }));
buf.push('></div>');
}
return buf.join("");
};
});

require.define("/paras/paratabs.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var oneParaM, paraTabsT;

  paraTabsT = require('./paratabs.jade');

  oneParaM = require('./onepara.coffee');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    events: {
      "click .paratab": "doparatab"
    },
    render: function() {
      var paraname, self;
      self = this;
      self.tabsonpage = [];
      Paradoc.paras.each(function(m) {
        var el;
        if (m.get("name") === "Sys-tabs") {
          el = $(m.get("contents"));
          return $("a", el).each(function() {
            return self.tabsonpage.push($(this).attr('data-para'));
          });
        }
      });
      if (self.tabsonpage.length === 0) self.tabsonpage = ["Home", "About"];
      /*
              $(this.el).html(paraTabsT({
                  tabs: self.tabsonpage
              }))
              $(this.options.parent).append(this.el)
      */
      this.painttabs();
      paraname = "Home";
      return Paradoc.paras.each(function(m) {
        if (m.get("name") === paraname) {
          return new oneParaM({
            model: m
          });
        }
      });
    },
    painttabs: function(activepara) {
      var activetab, i, t, _len, _ref;
      if (activepara) {
        _ref = this.tabsonpage;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          t = _ref[i];
          if (t === activepara) activetab = i;
        }
      } else {
        activetab = 0;
      }
      $(this.el).html(paraTabsT({
        tabs: this.tabsonpage,
        activetab: activetab
      }));
      $(this.options.parent).html(this.el);
      return this.delegateEvents();
    },
    doparatab: function(ev) {
      var paraname;
      if (Paradoc.isediting) return;
      $(".paratabwrap").removeClass("active");
      $(ev.target).closest(".paratabwrap").addClass('active');
      paraname = $(ev.target).attr('data-paraname');
      ev.preventDefault();
      return Paradoc.paras.each(function(m) {
        if (m.get("name") === paraname) {
          return new oneParaM({
            model: m
          });
        }
      });
    },
    addatab: function(paraslug, paraname) {
      var m, mrs, para, self;
      self = this;
      para = null;
      mrs = Paradoc.paras.where({
        slug: paraslug
      });
      if (mrs) para = mrs[0];
      if (!para) {
        console.log('no para');
        m = new Backbone.Model({
          name: paraname,
          slug: paraslug,
          contents: "<div class='row-fluid'><div class='span6'>Penny for your thoughts</div><div class='span6'>another penny</div></div>"
        });
        Paradoc.paras.add(m);
        self.tabsonpage.push(paraname);
        self.painttabs(paraname);
      }
      if ($(".paratab[data-paraname='" + paraname + "']").length > 0) {
        return $(".paratab[data-paraname='" + paraname + "']").click();
      } else {
        self.tabsonpage.push(paraname);
        self.painttabs(paraname);
        return $(".paratab[data-paraname='" + paraname + "']").click();
      }
    },
    rmatab: function(paraname) {
      var i, t, _len, _ref, _results;
      _ref = this.tabsonpage;
      _results = [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        t = _ref[i];
        if (t === paraname) {
          $(".paratab[data-paraname='" + this.tabsonpage[i - 1] + "']").click();
          this.tabsonpage.splice(i, 1);
          _results.push($(".paratab[data-paraname='" + paraname + "']").closest(".paratabwrap").remove());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  });

}).call(this);

});

require.define("/paras/paratabs.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div');
buf.push(attrs({ 'style':('margin-top:2px') }));
buf.push('><ul');
buf.push(attrs({ 'style':('margin-bottom:0px'), "class": ('nav') + ' ' + ('nav-tabs') + ' ' + ('paratabmom') }));
buf.push('>');
// iterate tabs
(function(){
  if ('number' == typeof tabs.length) {
    for (var i = 0, $$l = tabs.length; i < $$l; i++) {
      var tab = tabs[i];

if ( i === activetab)
{
buf.push('<li');
buf.push(attrs({ "class": ('active') + ' ' + ('paratabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '\n</a></li>');
}
else
{
buf.push('<li');
buf.push(attrs({ "class": ('paratabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '\n</a></li>');
}
    }
  } else {
    for (var i in tabs) {
      var tab = tabs[i];

if ( i === activetab)
{
buf.push('<li');
buf.push(attrs({ "class": ('active') + ' ' + ('paratabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '\n</a></li>');
}
else
{
buf.push('<li');
buf.push(attrs({ "class": ('paratabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '\n</a></li>');
}
   }
  }
}).call(this);

buf.push('</ul></div>');
}
return buf.join("");
};
});

require.define("/paras/onepara.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var basicPM, oneParaT, oneParaactionsM;

  oneParaT = require('./onepara.jade');

  basicPM = require('../plugins/basic');

  oneParaactionsM = require('./oneparaactions');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    events: {
      "dblclick": "doedit"
    },
    render: function() {
      var p, self, x;
      self = this;
      if (this.model.get("plugin")) {
        x = 1;
        console.log('xx');
      } else {
        p = new basicPM({
          model: this.model,
          parent: $(".htmlarea")
        });
      }
      return this.ora = new oneParaactionsM({
        model: this.model,
        paraview: this
      });
    },
    doedit: function(ev) {
      return this.ora.doedit();
    },
    gethtml: function() {
      var text;
      text = this.model.get("contents");
      return text;
    },
    showedit: function() {
      var h;
      if (!$(".wysihtml5-toolbar").hasClass("editspot")) {
        $(".wysihtml5-toolbar").addClass("editspot").appendTo(".menubar").css({
          position: 'absolute',
          top: '0px',
          left: '0px'
        });
      }
      $(".htmlarea").hide();
      $(".editspot").show();
      h = this.gethtml();
      return Paradoc.editor.setValue(h);
    },
    showview: function() {
      $(".editarea").val('');
      $(".editspot").hide();
      return $(".htmlarea").html(this.gethtml()).show();
    },
    getPararaw: function() {
      return $(".editarea").val();
    }
  });

}).call(this);

});

require.define("/paras/onepara.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><div');
buf.push(attrs({ 'style':('text-align:left;background-color:#ffffff;padding:0px 10px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd'), "class": ('paraonpage') }));
buf.push('><div');
buf.push(attrs({ 'style':('color:#cccccc'), "class": ('pull-right') + ' ' + ('paraactions') }));
buf.push('></div><div');
buf.push(attrs({ 'style':('clear:both;padding:0px 10px;margin-right:16px;height:' + (h) + 'px'), "class": ('paracontents') }));
buf.push('><div');
buf.push(attrs({ 'style':('padding:4px 6px'), "class": ('htmlarea') }));
buf.push('></div><div');
buf.push(attrs({ 'style':('display:none'), "class": ('editspot') }));
buf.push('><textarea');
buf.push(attrs({ 'style':('width:100%;height:' + (h-10) + 'px;'), "class": ('editarea') }));
buf.push('></textarea></div></div></div></div>');
}
return buf.join("");
};
});

require.define("/plugins/basic.coffee", function (require, module, exports, __dirname, __filename) {

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    render: function() {
      return $(this.options.parent).html(this.gethtml());
    },
    gethtml: function() {
      var text;
      text = this.model.get("contents");
      return text;
    }
  });

});

require.define("/paras/oneparaactions.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var dropio, oneParaactionsRoT, oneParaactionsT;

  oneParaactionsT = require('./oneparaactions.jade');

  oneParaactionsRoT = require('./oneparaactions-ro.jade');

  dropio = require('../db/dropio');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    events: {
      "click .doedit": "doedit",
      "click .dosave": "dosave",
      "click .doxncl": "doxncl",
      "click .doclose": "doclose",
      "click .dodel": "dodel"
    },
    render: function() {
      if (Paradoc.readonly) {
        $(this.el).html(oneParaactionsRoT({
          para: this.model.toJSON()
        }));
      } else {
        $(this.el).html(oneParaactionsT({
          para: this.model.toJSON()
        }));
      }
      return $(".paraactions").html(this.el);
    },
    doedit: function(ev) {
      Paradoc.isediting = true;
      this.options.paraview.showedit();
      $(".savegroup", this.el).show();
      return $(".editgroup", this.el).hide();
    },
    doxncl: function(ev) {
      Paradoc.isediting = false;
      this.options.paraview.showview();
      $(".savegroup", self.el).hide();
      return $(".editgroup", self.el).show();
    },
    doclose: function(ev) {
      return Paradoc.paratabs.rmatab(this.model.get("name"));
    },
    dosave: function(ev) {
      var paraname, paratext, self;
      self = this;
      paratext = this.options.paraview.getPararaw();
      paraname = this.options.paraview.model.get("name");
      return Paradoc.paras.each(function(m) {
        var d;
        if (m.get("name") === paraname) {
          m.set("contents", paratext);
          self.options.paraview.model.set('contents', paratext);
          d = {
            paras: Paradoc.paras.toJSON()
          };
          console.log('saving to ' + Paradoc.doc);
          return dropio.save(Paradoc.doc, JSON.stringify(d), function() {
            Paradoc.isediting = false;
            self.options.paraview.showview();
            $(".savegroup", self.el).hide();
            return $(".editgroup", self.el).show();
          });
        }
      });
    },
    dodel: function(ev) {
      var mrs, paraslug;
      paraslug = this.options.paraview.model.get("slug");
      mrs = Paradoc.paras.where({
        slug: paraslug
      });
      if (mrs) {
        this.doxncl();
        Paradoc.paras.remove(mrs[0]);
        Paradoc.paratabs.rmatab(mrs[0].get("name"));
        return dropio.save(Paradoc.doc, JSON.stringify({
          paras: Paradoc.paras.toJSON()
        }));
      }
    }
  });

}).call(this);

});

require.define("/paras/oneparaactions.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div');
buf.push(attrs({ "class": ('editgroup') }));
buf.push('><span');
buf.push(attrs({ "class": ('doedit') + ' ' + ('pointer') + ' ' + ('word') }));
buf.push('>edit</span>');
if ( para.slug != 'home')
{
buf.push('<span');
buf.push(attrs({ "class": ('doclose') + ' ' + ('pointer') + ' ' + ('word') }));
buf.push('>close</span>');
}
buf.push('</div><div');
buf.push(attrs({ 'style':('display:none'), "class": ('savegroup') }));
buf.push('>');
if ( para.slug != 'home')
{
buf.push('<span');
buf.push(attrs({ 'style':('color:red;padding-right:15px'), "class": ('dodel') + ' ' + ('pointer') }));
buf.push('>delete</span>');
}
buf.push('<span');
buf.push(attrs({ "class": ('dosave') + ' ' + ('pointer') + ' ' + ('word') }));
buf.push('>save</span><span');
buf.push(attrs({ "class": ('doxncl') + ' ' + ('pointer') + ' ' + ('word') }));
buf.push('>cancel</span></div>');
}
return buf.join("");
};
});

require.define("/paras/oneparaactions-ro.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div');
buf.push(attrs({ "class": ('editgroup') }));
buf.push('>');
if ( para.slug != 'home')
{
buf.push('<span');
buf.push(attrs({ "class": ('doclose') + ' ' + ('pointer') + ' ' + ('word') }));
buf.push('>close</span>');
}
buf.push('</div><div');
buf.push(attrs({ 'style':('display:none'), "class": ('savegroup') }));
buf.push('>');
if ( para.slug != 'home')
{
buf.push('<span');
buf.push(attrs({ "class": ('doclose') + ' ' + ('pointer') + ' ' + ('word') }));
buf.push('>close</span>');
}
buf.push('</div>');
}
return buf.join("");
};
});

require.define("/db/dropio.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var startdb;

  startdb = require('./startdb');

  module.exports = {
    start: function(cb) {
      var self;
      self = this;
      this.client = new Dropbox.Client({
        key: 'd1F4ZEi4WFA=|vpqGx6/s9BAtYdIgqBBv30UIpAuQajpBRVUGrb2hBg==',
        sandbox: true
      });
      this.client.authDriver(new Dropbox.Drivers.Redirect({
        rememberUser: true
      }));
      return this.client.authenticate(function(err, data) {
        if (err) {
          alert('error');
          return;
        }
        return self.client.getUserInfo(function(err, userInfo) {
          return cb(userInfo);
        });
      });
    },
    save: function(filename, contents, cb) {
      return this.client.writeFile(filename, contents, {}, function(err, stat) {
        if (cb) return cb();
      });
    },
    create: function(filename, cb) {
      var contents;
      contents = JSON.stringify(startdb);
      return this.client.writeFile(filename, contents, {}, function(err, stat) {
        if (cb) return cb();
      });
    },
    remove: function(filename, cb) {
      return this.client.remove(filename, function(err, stat) {
        if (cb) return cb();
      });
    },
    copyto: function(fromfile, tofile, cb) {
      return this.client.copy(fromfile, tofile, function(err, stat) {
        if (cb) return cb();
      });
    },
    rename: function(fromfile, tofile, cb) {
      return this.client.move(fromfile, tofile, function(err, stat) {
        if (cb) return cb();
      });
    },
    read: function(filename, cb) {
      return this.client.readFile(filename, {}, function(err, data) {
        if (err) {
          console.log('error ' + err.status);
          return cb(JSON.stringify(startdb));
        } else {
          return cb(data);
        }
      });
    },
    readdir: function(dir, cb) {
      return this.client.readdir(dir, {}, function(err, data) {
        if (!data) data = JSON.stringify(data);
        return cb(data);
      });
    },
    geturl: function(filename, cb) {
      return this.client.makeUrl(filename, {
        long: true,
        downloadHack: true
      }, function(err, data) {
        return cb(err, data);
      });
    }
  };

}).call(this);

});

require.define("/db/startdb.coffee", function (require, module, exports, __dirname, __filename) {

  module.exports = {
    "paras": [
      {
        "name": "Home",
        "slug": "home",
        "contents": "<h4>This is a Pure Jasper document.</h4> It contains many paragraphs that link to each other, can be navigated in tabs and have a mix of text, links, html, widgets and scripts.<br><br><ul><li>To Edit this para:&nbsp;Click edit on the top right of this message box</li><li>To Create a new para:&nbsp;Type `[[Para Name]] (without the backtick)&nbsp;</li><ul><li>This will create a special link which when clicked will open a new para in a tab</li><li>Something like this:&nbsp;<a class=\"paralink\" href=\"#para/about\" data-para=\"about\" title=\"Link: #para/about\">About</a></li></ul></ul>Click on the FileName to bring up the File Manager, which allows you to create new documents etc.<br>"
      }, {
        "name": "About",
        "slug": "about",
        "contents": "About this document<br><br>edit me or go back <a class=\"paralink\" href=\"#para/home\" data-para=\"home\">Home</a>&nbsp;"
      }
    ]
  };

});

require.define("/utils/wiki_link.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var WIKI_REGEX, utils, _convertWikiLink, _getTempElement, _parseNode, _wrapMatchesInNode;

  utils = require('./utils');

  WIKI_REGEX = /(?:^|\s)\[\[(.*)\]\](?=\s|$)/;

  _convertWikiLink = function(str) {
    var matches, slug;
    matches = str.match(WIKI_REGEX);
    if (matches) {
      slug = utils.slugify(matches[1]);
      str = str.replace(WIKI_REGEX, " <a class='paralink' href='#para/" + slug + "' data-para='" + slug + "'>" + matches[1] + "</a>");
    }
    return str;
  };

  _getTempElement = function(context) {
    var tempElement;
    tempElement = context._wysihtml5_tempElement;
    if (!tempElement) {
      tempElement = context._wysihtml5_tempElement = context.createElement("div");
    }
    return tempElement;
  };

  _wrapMatchesInNode = function(textNode) {
    var parentNode, tempElement;
    parentNode = textNode.parentNode;
    tempElement = _getTempElement(parentNode.ownerDocument);
    tempElement.innerHTML = "<span></span>" + _convertWikiLink(textNode.data);
    tempElement.removeChild(tempElement.firstChild);
    while (tempElement.firstChild) {
      parentNode.insertBefore(tempElement.firstChild, textNode);
    }
    return parentNode.removeChild(textNode);
  };

  _parseNode = function(element) {
    var childNodes, childNodesLength, i, node, _i, _len;
    if (element.nodeType === wysihtml5.TEXT_NODE && element.data.match(WIKI_REGEX)) {
      _wrapMatchesInNode(element);
      return;
    }
    childNodes = wysihtml5.lang.array(element.childNodes).get();
    childNodesLength = childNodes.length;
    i = 0;
    for (_i = 0, _len = childNodes.length; _i < _len; _i++) {
      node = childNodes[_i];
      _parseNode(node);
    }
    return element;
  };

  module.exports = function(element) {
    return _parseNode(element);
  };

}).call(this);

});

require.define("/utils/utils.coffee", function (require, module, exports, __dirname, __filename) {

  module.exports.slugify = function(text) {
    text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
    text = text.replace(/-/gi, "_");
    text = text.replace(/\s/gi, "-");
    text = text.toLowerCase();
    return text;
  };

});

require.define("/pjview.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AppRouter, WIKI_REGEX, appRouter, pageT, paraTabsM, utils, v, wikilink;

  pageT = require('./page');

  paraTabsM = require('./paras/paratabs');

  wikilink = require('./utils/wiki_link');

  utils = require('./utils/utils');

  WIKI_REGEX = /\[\[(.*)\]\]/;

  v = Backbone.View.extend({
    el: "body",
    initialize: function() {
      var self;
      self = this;
      this.filename = "";
      Paradoc.paras = new Backbone.Collection(jdoc['paras']);
      Paradoc.paras.each(function(m) {
        if (!m.get("slug")) return m.set("slug", utils.slugify(m.get("name")));
      });
      Paradoc.doc = self.filename;
      return self.render();
    },
    events: {
      "click .paralink": "doparalink"
    },
    doparalink: function(ev) {
      var paraname, paraslug;
      paraslug = $(ev.target).attr('data-para');
      paraname = $(ev.target).text();
      Paradoc.paratabs.addatab(paraslug, paraname);
      return ev.preventDefault();
    },
    render: function() {
      var h, self, w;
      self = this;
      h = $(window).height() - 150;
      if (h < 150) h = 150;
      w = $(".container.main").width();
      $(self.el).html(pageT({
        h: h,
        w: w,
        doc: Paradoc.doc
      }));
      Paradoc.paratabs = new paraTabsM({
        parent: $(".paratabs", self.el)
      });
      return Paradoc.seteditor();
    }
  });

  AppRouter = Backbone.Router.extend({
    routes: {
      '': 'home',
      'home': 'home',
      'doc/:doc': 'home',
      '*notFound': 'notFound'
    },
    home: function(doc) {
      var mainV;
      if (!doc) doc = 'notes.pjs';
      if (doc.indexOf('.pjs') === -1) doc = doc + '.pjs';
      return mainV = new v({
        doc: doc
      });
    },
    notFound: function() {
      return this.navigate('', true);
    }
  });

  appRouter = new AppRouter();

  $(function() {
    window.Paradoc = {
      ext: "pjs",
      init: function() {
        return this.readonly = true;
      },
      navigate: function(path, trigger) {
        if (trigger == null) trigger = true;
        return appRouter.navigate(path, {
          trigger: trigger
        });
      },
      seteditor: function() {
        var self;
        self = this;
        this.editor = $('.editarea').wysihtml5({
          stylesheets: ["http://purejasper.com/e/bootstrap/css/bootstrap.min.css"]
        }).data("wysihtml5").editor;
        return this.editor.on('newword:composer', function() {
          var composer, edittext, matches;
          edittext = self.editor.getValue();
          matches = edittext.match(WIKI_REGEX);
          console.log('m ' + matches);
          if (matches) {
            composer = self.editor.composer;
            return composer.selection.executeAndRestore(function(startContainer, endContainer) {
              return wikilink(endContainer.parentNode);
            });
          }
        });
      }
    };
    window.Paradoc.init();
    return Backbone.history.start();
  });

}).call(this);

});
require("/pjview.coffee");

