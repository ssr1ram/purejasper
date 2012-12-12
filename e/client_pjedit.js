
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
buf.push(attrs({ "class": ('ramtabs') }));
buf.push('></div><div');
buf.push(attrs({ "class": ('ramview') }));
buf.push('><div');
buf.push(attrs({ 'style':('text-align:left;background-color:#ffffff;padding:0px 10px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd'), "class": ('ramonpage') }));
buf.push('><div');
buf.push(attrs({ 'style':('color:#cccccc'), "class": ('pull-right') + ' ' + ('ramactions') }));
buf.push('></div><div');
buf.push(attrs({ 'style':('clear:both;padding:0px 10px;margin-right:16px;height:' + (h) + 'px'), "class": ('ramcontents') }));
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
    }
  };

}).call(this);

});

require.define("/db/startdb.coffee", function (require, module, exports, __dirname, __filename) {

  module.exports = {
    "rams": [
      {
        "name": "Home",
        "slug": "home",
        "contents": "<h4>This is a Pure Jasper document.</h4> It contains many Richly Annotated&nbsp;fragMents (Rams) that link to each other, can be navigated in tabs and have a mix of text, links, html, widgets and scripts.<br><br><ul><li>To Edit this Ram:&nbsp;Click edit on the top right of this message box</li><li>To Create a new Ram:&nbsp;Type `[[Fragment Name]] (without the backtick)&nbsp;</li><ul><li>This will create a special link which when clicked will open a new Ram in a tab</li><li>Something like this:&nbsp;<a class=\"ramlink\" href=\"#ram/about\" data-ram=\"about\" title=\"Link: #ram/about\">About</a></li></ul></ul>Click on the FileName to bring up the File Manager, which allows you to create new documents etc.<br>"
      }, {
        "name": "About",
        "slug": "about",
        "contents": "About this document<br><br>edit me or go back <a class=\"ramlink\" href=\"#ram/home\" data-ram=\"home\">Home</a>&nbsp;"
      }
    ]
  };

});

require.define("/rams/ramtabs.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var oneRamM, ramTabsT;

  ramTabsT = require('./ramtabs.jade');

  oneRamM = require('./oneram.coffee');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    events: {
      "click .ramtab": "doramtab"
    },
    render: function() {
      var ramname, self;
      self = this;
      self.tabsonpage = [];
      Ramdoc.rams.each(function(m) {
        var el;
        if (m.get("name") === "Sys-tabs") {
          el = $(m.get("contents"));
          return $("a", el).each(function() {
            return self.tabsonpage.push($(this).attr('data-ram'));
          });
        }
      });
      if (self.tabsonpage.length === 0) self.tabsonpage = ["Home", "About"];
      /*
              $(this.el).html(ramTabsT({
                  tabs: self.tabsonpage
              }))
              $(this.options.parent).append(this.el)
      */
      this.painttabs();
      ramname = "Home";
      return Ramdoc.rams.each(function(m) {
        if (m.get("name") === ramname) {
          return new oneRamM({
            model: m
          });
        }
      });
    },
    painttabs: function(activeram) {
      var activetab, i, t, _len, _ref;
      if (activeram) {
        _ref = this.tabsonpage;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          t = _ref[i];
          if (t === activeram) activetab = i;
        }
      } else {
        activetab = 0;
      }
      $(this.el).html(ramTabsT({
        tabs: this.tabsonpage,
        activetab: activetab
      }));
      $(this.options.parent).html(this.el);
      return this.delegateEvents();
    },
    doramtab: function(ev) {
      var ramname;
      if (Ramdoc.isediting) return;
      $(".ramtabwrap").removeClass("active");
      $(ev.target).closest(".ramtabwrap").addClass('active');
      ramname = $(ev.target).attr('data-ramname');
      ev.preventDefault();
      return Ramdoc.rams.each(function(m) {
        if (m.get("name") === ramname) {
          return new oneRamM({
            model: m
          });
        }
      });
    },
    addatab: function(ramslug, ramname) {
      var m, mrs, ramm, self;
      self = this;
      ramm = null;
      mrs = Ramdoc.rams.where({
        slug: ramslug
      });
      if (mrs) ramm = mrs[0];
      if (!ramm) {
        console.log('no ramm');
        m = new Backbone.Model({
          name: ramname,
          slug: ramslug,
          contents: "<div class='row-fluid'><div class='span6'>Penny for your thoughts</div><div class='span6'>another penny</div></div>"
        });
        Ramdoc.rams.add(m);
        self.tabsonpage.push(ramname);
        self.painttabs(ramname);
      }
      if ($(".ramtab[data-ramname='" + ramname + "']").length > 0) {
        return $(".ramtab[data-ramname='" + ramname + "']").click();
      } else {
        self.tabsonpage.push(ramname);
        self.painttabs(ramname);
        return $(".ramtab[data-ramname='" + ramname + "']").click();
      }
    },
    rmatab: function(ramname) {
      var i, t, _len, _ref, _results;
      _ref = this.tabsonpage;
      _results = [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        t = _ref[i];
        if (t === ramname) {
          $(".ramtab[data-ramname='" + this.tabsonpage[i - 1] + "']").click();
          this.tabsonpage.splice(i, 1);
          _results.push($(".ramtab[data-ramname='" + ramname + "']").closest(".ramtabwrap").remove());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  });

}).call(this);

});

require.define("/rams/ramtabs.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div');
buf.push(attrs({ 'style':('margin-top:2px') }));
buf.push('><ul');
buf.push(attrs({ 'style':('margin-bottom:0px'), "class": ('nav') + ' ' + ('nav-tabs') + ' ' + ('ramtabmom') }));
buf.push('>');
// iterate tabs
(function(){
  if ('number' == typeof tabs.length) {
    for (var i = 0, $$l = tabs.length; i < $$l; i++) {
      var tab = tabs[i];

if ( i === activetab)
{
buf.push('<li');
buf.push(attrs({ "class": ('active') + ' ' + ('ramtabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-ramname':('' + (tab) + ''), "class": ('ramtab') }));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '\n</a></li>');
}
else
{
buf.push('<li');
buf.push(attrs({ "class": ('ramtabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-ramname':('' + (tab) + ''), "class": ('ramtab') }));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '\n</a></li>');
}
    }
  } else {
    for (var i in tabs) {
      var tab = tabs[i];

if ( i === activetab)
{
buf.push('<li');
buf.push(attrs({ "class": ('active') + ' ' + ('ramtabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-ramname':('' + (tab) + ''), "class": ('ramtab') }));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '\n</a></li>');
}
else
{
buf.push('<li');
buf.push(attrs({ "class": ('ramtabwrap') }));
buf.push('><a');
buf.push(attrs({ 'data-ramname':('' + (tab) + ''), "class": ('ramtab') }));
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

require.define("/rams/oneram.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var oneRamT, oneRamactionsM;

  oneRamT = require('./oneram.jade');

  oneRamactionsM = require('./oneramactions');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    events: {
      "dblclick": "doedit"
    },
    render: function() {
      var self;
      self = this;
      /*
              h = $(window).height() - 150
              if h< 150
                  h = 150
              w = $(".container.main").width()
              $(this.el).html(oneRamT({
                  h: h
                  w: w
              }))
              $(".ramview").html(this.el)
      */
      $(".htmlarea").html(this.gethtml());
      return this.ora = new oneRamactionsM({
        model: this.model,
        ramview: this
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
    xgethtml: function() {
      var converter, html;
      converter = new Showdown.converter();
      html = converter.makeHtml(text);
      return html;
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
      return Ramdoc.editor.setValue(h);
    },
    showview: function() {
      $(".editarea").val('');
      $(".editspot").hide();
      return $(".htmlarea").html(this.gethtml()).show();
    },
    getRamraw: function() {
      return $(".editarea").val();
    }
  });

}).call(this);

});

require.define("/rams/oneram.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><div');
buf.push(attrs({ 'style':('text-align:left;background-color:#ffffff;padding:0px 10px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd'), "class": ('ramonpage') }));
buf.push('><div');
buf.push(attrs({ 'style':('color:#cccccc'), "class": ('pull-right') + ' ' + ('ramactions') }));
buf.push('></div><div');
buf.push(attrs({ 'style':('clear:both;padding:0px 10px;margin-right:16px;height:' + (h) + 'px'), "class": ('ramcontents') }));
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

require.define("/rams/oneramactions.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var dropio, oneRamactionsT;

  oneRamactionsT = require('./oneramactions.jade');

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
      $(this.el).html(oneRamactionsT({
        ram: this.model.toJSON()
      }));
      return $(".ramactions").html(this.el);
    },
    doedit: function(ev) {
      Ramdoc.isediting = true;
      this.options.ramview.showedit();
      $(".savegroup", this.el).show();
      return $(".editgroup", this.el).hide();
    },
    doxncl: function(ev) {
      Ramdoc.isediting = false;
      this.options.ramview.showview();
      $(".savegroup", self.el).hide();
      return $(".editgroup", self.el).show();
    },
    doclose: function(ev) {
      return Ramdoc.ramtabs.rmatab(this.model.get("name"));
    },
    dosave: function(ev) {
      var ramname, ramtext, self;
      self = this;
      ramtext = this.options.ramview.getRamraw();
      ramname = this.options.ramview.model.get("name");
      return Ramdoc.rams.each(function(m) {
        var d;
        if (m.get("name") === ramname) {
          m.set("contents", ramtext);
          self.options.ramview.model.set('contents', ramtext);
          d = {
            rams: Ramdoc.rams.toJSON()
          };
          console.log('saving to ' + Ramdoc.doc);
          return dropio.save(Ramdoc.doc, JSON.stringify(d), function() {
            Ramdoc.isediting = false;
            self.options.ramview.showview();
            $(".savegroup", self.el).hide();
            return $(".editgroup", self.el).show();
          });
        }
      });
    },
    dodel: function(ev) {
      var mrs, ramslug;
      ramslug = this.options.ramview.model.get("slug");
      mrs = Ramdoc.rams.where({
        slug: ramslug
      });
      if (mrs) {
        this.doxncl();
        Ramdoc.rams.remove(mrs[0]);
        Ramdoc.ramtabs.rmatab(mrs[0].get("name"));
        return dropio.save(Ramdoc.doc, JSON.stringify({
          rams: Ramdoc.rams.toJSON()
        }));
      }
    }
  });

}).call(this);

});

require.define("/rams/oneramactions.jade", function (require, module, exports, __dirname, __filename) {
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
if ( ram.slug != 'home')
{
buf.push('<span');
buf.push(attrs({ "class": ('doclose') + ' ' + ('pointer') + ' ' + ('word') }));
buf.push('>close</span>');
}
buf.push('</div><div');
buf.push(attrs({ 'style':('display:none'), "class": ('savegroup') }));
buf.push('>');
if ( ram.slug != 'home')
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

require.define("/filemanager/actions.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var dropio, fileactionsT, managerM;

  fileactionsT = require('./actions.jade');

  managerM = require('./manager.coffee');

  dropio = require('../db/dropio');

  module.exports = Backbone.View.extend({
    initialize: function() {
      this.filename = this.options.filename;
      return this.render();
    },
    events: {
      "click .domanager": "domanager"
    },
    render: function() {
      $(this.el).html(fileactionsT({
        filename: this.filename
      }));
      return $(".menubar").html(this.el);
    },
    domanager: function(ev) {
      var m;
      m = new managerM();
      return ev.preventDefault();
    },
    xdomanager: function(ev) {
      dropio.readdir("/", function(flist) {
        $(".ymodal").empty().html(managerT({
          flist: flist
        })).show();
        return $(".ymodal").modal("show");
      });
      return ev.preventDefault();
    }
  });

}).call(this);

});

require.define("/filemanager/actions.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div');
buf.push(attrs({ 'style':('position:absolute;top:0px;right:0px') }));
buf.push('><div');
buf.push(attrs({ 'style':('margin-top:0px'), "class": ('btn-toolbar') }));
buf.push('><div');
buf.push(attrs({ "class": ('btn-group') }));
buf.push('><a');
buf.push(attrs({ 'data-toggle':('dropdown'), "class": ('btn') + ' ' + ('dropdown-toggle') }));
buf.push('>' + escape((interp = filename.replace('.ram', '')) == null ? '' : interp) + '\n<span');
buf.push(attrs({ "class": ('caret') }));
buf.push('></span></a><ul');
buf.push(attrs({ "class": ('dropdown-menu') }));
buf.push('><li><a');
buf.push(attrs({ "class": ('domanager') }));
buf.push('>File Manager</a></li></ul></div></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/manager.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var copytoT, deleteT, dropio, managerT, newT, noselT, renameT;

  managerT = require('./manager.jade');

  dropio = require('../db/dropio');

  copytoT = require('./copyto.jade');

  renameT = require('./rename.jade');

  deleteT = require('./delete.jade');

  newT = require('./new.jade');

  noselT = require('./nosel.jade');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    events: {
      "click .docopyto": "docopyto",
      "click .dorename": "dorename",
      "click .dodelete": "dodelete",
      "click .donew": "donew",
      "click .doopen": "doopen",
      "click .showcopyto": "showcopyto",
      "click .showrename": "showrename",
      "click .showdelete": "showdelete",
      "click .shownew": "shownew"
    },
    render: function(ev) {
      var self;
      self = this;
      return dropio.readdir("/", function(flist) {
        self.flist = flist;
        $(self.el).html(managerT({
          flist: flist
        }));
        self.delegateEvents();
        $(".ymodal").empty().html(self.el).show();
        return $(".ymodal").modal("show");
      });
    },
    getthefile: function() {
      this.thefile = $(".thefile").val();
      if (!this.thefile) {
        $(".actionspot", this.el).html(noselT);
        return false;
      }
      return true;
    },
    showcopyto: function(ev) {
      if (this.getthefile()) {
        return $(".actionspot", this.el).html(copytoT({
          thefile: this.thefile
        }));
      }
    },
    showrename: function(ev) {
      if (this.getthefile()) {
        return $(".actionspot", this.el).html(renameT({
          thefile: this.thefile
        }));
      }
    },
    showdelete: function(ev) {
      if (this.getthefile()) {
        return $(".actionspot", this.el).html(deleteT({
          thefile: this.thefile
        }));
      }
    },
    shownew: function(ev) {
      return $(".actionspot", this.el).html(newT);
    },
    docopyto: function(ev) {
      var f, fxists, self, tofile, _i, _len, _ref;
      self = this;
      tofile = $("input[name='tofile']").val();
      if (!tofile) {
        $(".errspot", this.el).html("Please enter a file name");
        return;
      }
      fxists = false;
      _ref = this.flist;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (tofile.replace('.pjs', '') === f.replace('.pjs', '')) fxists = true;
      }
      if (fxists) {
        $(".errspot", this.el).html("File exists");
        return;
      }
      if (tofile.indexOf('.pjs') === -1) tofile = tofile + ".pjs";
      return dropio.copyto(this.thefile, tofile, function() {
        $(".ymodal").modal("hide");
        $(self.el).remove();
        return self.render();
      });
    },
    dorename: function(ev) {
      var f, fxists, self, tofile, _i, _len, _ref;
      self = this;
      tofile = $("input[name='tofile']").val();
      if (!tofile) {
        $(".errspot", this.el).html("Please enter a file name");
        return;
      }
      fxists = false;
      _ref = this.flist;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (tofile.replace('.pjs', '') === f.replace('.pjs', '')) fxists = true;
      }
      if (fxists) {
        $(".errspot", this.el).html("File exists");
        return;
      }
      if (tofile.indexOf('.pjs') === -1) tofile = tofile + ".pjs";
      return dropio.rename(this.thefile, tofile, function() {
        $(".ymodal").modal("hide");
        $(self.el).remove();
        return self.render();
      });
    },
    dodelete: function(ev) {
      var self, x;
      self = this;
      dropio.remove(this.thefile, function() {
        $(".ymodal").modal("hide");
        $(self.el).remove();
        return self.render();
      });
      return x = 1;
    },
    donew: function(ev) {
      var f, fxists, nufile, _i, _len, _ref;
      nufile = $("input[name='nufile']").val();
      if (!nufile) {
        $(".errspot", this.el).html("Please enter a file name");
        return;
      }
      fxists = false;
      _ref = this.flist;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (nufile.replace('.pjs', '') === f.replace('.pjs', '')) fxists = true;
      }
      if (fxists) {
        $(".errspot", this.el).html("File exists");
        return;
      }
      if (nufile.indexOf('.pjs') === -1) nufile = nufile + ".pjs";
      return dropio.create(nufile, function() {
        Ramdoc.navigate('#doc/' + nufile, false);
        return location.reload();
      });
    },
    doopen: function(ev) {
      if (this.getthefile()) {
        Ramdoc.navigate('#doc/' + this.thefile, false);
        return location.reload();
      }
    }
  });

}).call(this);

});

require.define("/filemanager/manager.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div');
buf.push(attrs({ "class": ('modal-header') }));
buf.push('><button');
buf.push(attrs({ 'type':('button'), 'data-dismiss':('modal'), "class": ('close') }));
buf.push('>x</button><h3>File Manager</h3></div><div');
buf.push(attrs({ "class": ('modal-body') }));
buf.push('><div');
buf.push(attrs({ "class": ('row-fluid') }));
buf.push('><div');
buf.push(attrs({ 'style':('height:250px'), "class": ('span5') }));
buf.push('><select');
buf.push(attrs({ 'size':('16'), 'style':('width:100%'), "class": ('thefile') }));
buf.push('>');
// iterate flist
(function(){
  if ('number' == typeof flist.length) {
    for (var $index = 0, $$l = flist.length; $index < $$l; $index++) {
      var f = flist[$index];

buf.push('<option>' + escape((interp = f) == null ? '' : interp) + '</option>');
    }
  } else {
    for (var $index in flist) {
      var f = flist[$index];

buf.push('<option>' + escape((interp = f) == null ? '' : interp) + '</option>');
   }
  }
}).call(this);

buf.push('</select></div><div');
buf.push(attrs({ "class": ('span2') }));
buf.push('><div');
buf.push(attrs({ "class": ('btn-group') + ' ' + ('btn-group-vertical') }));
buf.push('><button');
buf.push(attrs({ "class": ('btn') }));
buf.push('><span');
buf.push(attrs({ "class": ('doopen') }));
buf.push('>Open</span></button><button');
buf.push(attrs({ 'style':('margin-top:20px'), "class": ('btn') }));
buf.push('><span');
buf.push(attrs({ "class": ('showcopyto') }));
buf.push('>Copy to</span></button><button');
buf.push(attrs({ "class": ('btn') }));
buf.push('><span');
buf.push(attrs({ "class": ('showrename') }));
buf.push('>Rename</span></button><button');
buf.push(attrs({ 'style':('margin-top:20px'), "class": ('btn') }));
buf.push('><span');
buf.push(attrs({ "class": ('showdelete') }));
buf.push('>Delete</span></button><button');
buf.push(attrs({ 'style':('margin-top:30px'), "class": ('btn') }));
buf.push('><span');
buf.push(attrs({ "class": ('shownew') }));
buf.push('>New File</span></button></div></div><div');
buf.push(attrs({ 'style':('height:250px;border:2px solid #ddd;padding-left:2px'), "class": ('span5') + ' ' + ('actionspot') }));
buf.push('></div></div></div><div');
buf.push(attrs({ "class": ('modal-footer') }));
buf.push('><a');
buf.push(attrs({ 'href':('#'), 'data-dismiss':('modal'), "class": ('btn') }));
buf.push('>Cancel</a></div>');
}
return buf.join("");
};
});

require.define("/filemanager/copyto.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Copy To<div><label>From</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (thefile) + ''), 'style':('width:90%') }));
buf.push('/></div><div><label>To</label><input');
buf.push(attrs({ 'type':('text'), 'name':('tofile'), 'placeholder':('filename'), 'style':('width:90%') }));
buf.push('/></div><div');
buf.push(attrs({ 'style':('margin:10px;text-align:center') }));
buf.push('><button');
buf.push(attrs({ "class": ('docopyto') }));
buf.push('>Copy</button></div></h3><div');
buf.push(attrs({ 'style':('color:red;text-align:center'), "class": ('errspot') }));
buf.push('></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/rename.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Rename<div><label>From</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (thefile) + ''), 'style':('width:90%') }));
buf.push('/></div><div><label>To</label><input');
buf.push(attrs({ 'type':('text'), 'name':('tofile'), 'placeholder':('filename'), 'style':('width:90%') }));
buf.push('/></div><div');
buf.push(attrs({ 'style':('margin:10px;text-align:center') }));
buf.push('><button');
buf.push(attrs({ "class": ('dorename') }));
buf.push('>rename</button></div></h3><div');
buf.push(attrs({ 'style':('color:red;text-align:center'), "class": ('errspot') }));
buf.push('></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/delete.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Delete<div><label>File</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (thefile) + ''), 'style':('width:90%') }));
buf.push('/></div><div');
buf.push(attrs({ 'style':('margin:10px;text-align:center') }));
buf.push('><button');
buf.push(attrs({ "class": ('dodelete') }));
buf.push('>Confirm Delete</button></div></h3></div>');
}
return buf.join("");
};
});

require.define("/filemanager/new.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>New File</h3><div><label>File name</label><input');
buf.push(attrs({ 'type':('text'), 'name':('nufile'), 'placeholder':('filename'), 'style':('width:90%') }));
buf.push('/></div><div');
buf.push(attrs({ 'style':('margin:10px;text-align:center') }));
buf.push('><button');
buf.push(attrs({ "class": ('donew') }));
buf.push('>Create & open file</button></div><div');
buf.push(attrs({ 'style':('color:red;text-align:center'), "class": ('errspot') }));
buf.push('></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/nosel.jade", function (require, module, exports, __dirname, __filename) {
module.exports = function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Error<div><label>Please select a file</label></div></h3></div>');
}
return buf.join("");
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
      str = str.replace(WIKI_REGEX, " <a class='ramlink' href='#ram/" + slug + "' data-ram='" + slug + "'>" + matches[1] + "</a>");
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

require.define("/app.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AppRouter, WIKI_REGEX, appRouter, dropio, fileactionsM, pageT, ramTabsM, utils, v, wikilink;

  pageT = require('./page');

  dropio = require('./db/dropio');

  ramTabsM = require('./rams/ramtabs');

  fileactionsM = require('./filemanager/actions');

  wikilink = require('./utils/wiki_link');

  utils = require('./utils/utils');

  WIKI_REGEX = /\[\[(.*)\]\]/;

  v = Backbone.View.extend({
    el: "body",
    initialize: function() {
      var self;
      self = this;
      this.filename = this.options.doc;
      return dropio.read(this.filename, function(data) {
        var jdoc;
        JSON.parse(data);
        try {
          jdoc = JSON.parse(data);
        } catch (e) {
          console.log('bad data');
          jdoc = {
            rams: []
          };
        }
        Ramdoc.rams = new Backbone.Collection(jdoc['rams']);
        Ramdoc.rams.each(function(m) {
          if (!m.get("slug")) return m.set("slug", utils.slugify(m.get("name")));
        });
        Ramdoc.doc = self.filename;
        return self.render();
      });
    },
    events: {
      "click .ramlink": "doramlink"
    },
    doramlink: function(ev) {
      var ramname, ramslug;
      ramslug = $(ev.target).attr('data-ram');
      ramname = $(ev.target).text();
      Ramdoc.ramtabs.addatab(ramslug, ramname);
      return ev.preventDefault();
    },
    render: function() {
      var fa, h, self, w;
      self = this;
      h = $(window).height() - 150;
      if (h < 150) h = 150;
      w = $(".container.main").width();
      $(self.el).html(pageT({
        h: h,
        w: w,
        doc: Ramdoc.doc
      }));
      $("#user-name").text(Ramdoc.userInfo.name);
      fa = new fileactionsM({
        filename: this.filename
      });
      Ramdoc.ramtabs = new ramTabsM({
        parent: $(".ramtabs", self.el)
      });
      return Ramdoc.seteditor();
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
    window.Ramdoc = {
      ext: "pjs",
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
          stylesheets: ["bootstrap/css/bootstrap.min.css"]
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
      },
      dropio: dropio
    };
    return dropio.start(function(userInfo) {
      Ramdoc.userInfo = userInfo;
      return Backbone.history.start();
    });
  });

}).call(this);

});
require("/app.coffee");

