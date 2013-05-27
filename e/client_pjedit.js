(function(){
jade = (function(exports){
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
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function nulls(val) {
  return val != null;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
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
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
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
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
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
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json",".jade"];

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
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
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
            var pkgfile = path.normalize(x + '/package.json');
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
        for (var key in obj) res.push(key);
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

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
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

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/page.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="container"><div style="position:relative" class="menubar"></div><div style="margin-top:30px" class="main"><div class="paratabs"></div><div class="paraview"><div style="text-align:left;background-color:#ffffff;padding:0px 10px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd" class="paraonpage"><div style="color:#cccccc" class="pull-right paraactions"></div><div');
buf.push(attrs({ 'style':('clear:both;padding:0px 10px;margin-right:16px;height:' + (h) + 'px;overflow:auto'), "class": ('paracontents') }, {"style":true}));
buf.push('> <div style="padding:4px 6px" class="htmlarea paraspot"></div><div style="display:none" class="editspot paraspot"><textarea');
buf.push(attrs({ 'style':('width:100%;height:' + (h-10) + 'px;'), "class": ('editarea') }, {"style":true}));
buf.push('></textarea></div><div style="display:none" class="widgetspot paraspot"></div></div></div></div><div style="text-align:center"><div style="color:#ccc;margin-top:20px;letter-spacing:3px">&copy; 2013 purejasper.com</div></div></div></div><div style="display:none" class="modal ymodal"></div>');
}
return buf.join("");
};
});

require.define("/db/dropio.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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
        if (cb) {
          return cb();
        }
      });
    },
    create: function(filename, cb) {
      var contents;
      contents = JSON.stringify(startdb);
      return this.client.writeFile(filename, contents, {}, function(err, stat) {
        if (cb) {
          return cb();
        }
      });
    },
    remove: function(filename, cb) {
      return this.client.remove(filename, function(err, stat) {
        if (cb) {
          return cb();
        }
      });
    },
    copyto: function(fromfile, tofile, cb) {
      return this.client.copy(fromfile, tofile, function(err, stat) {
        if (cb) {
          return cb();
        }
      });
    },
    rename: function(fromfile, tofile, cb) {
      return this.client.move(fromfile, tofile, function(err, stat) {
        if (cb) {
          return cb();
        }
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
        if (!data) {
          data = JSON.stringify(data);
        }
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

require.define("/db/startdb.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {

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

}).call(this);

});

require.define("/paras/paratabs.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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
      if (self.tabsonpage.length === 0) {
        self.tabsonpage = ["Home", "About"];
      }
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
      var activetab, i, t, _i, _len, _ref;
      if (activepara) {
        _ref = this.tabsonpage;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          t = _ref[i];
          if (t === activepara) {
            activetab = i;
          }
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
      if (Paradoc.isediting) {
        return;
      }
      $(".paratabwrap").removeClass("active");
      $(ev.target).closest(".paratabwrap").addClass('active');
      paraname = $(ev.target).attr('data-paraname');
      ev.preventDefault();
      console.log('pn ' + paraname);
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
      if (mrs) {
        para = mrs[0];
      }
      if (!para) {
        console.log('xxno para');
        m = new Backbone.Model({
          name: paraname,
          slug: paraslug,
          contents: ""
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
      var i, t, _i, _len, _ref, _results;
      _ref = this.tabsonpage;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
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

require.define("/paras/paratabs.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div style="margin-top:2px"><ul style="margin-bottom:0px" class="nav nav-tabs paratabmom">');
// iterate tabs
;(function(){
  if ('number' == typeof tabs.length) {

    for (var i = 0, $$l = tabs.length; i < $$l; i++) {
      var tab = tabs[i];

if ( i === activetab)
{
buf.push('<li class="active paratabwrap"><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }, {"data-paraname":true}));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '</a></li>');
}
else
{
buf.push('<li class="paratabwrap"><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }, {"data-paraname":true}));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '</a></li>');
}
    }

  } else {
    var $$l = 0;
    for (var i in tabs) {
      $$l++;      var tab = tabs[i];

if ( i === activetab)
{
buf.push('<li class="active paratabwrap"><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }, {"data-paraname":true}));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '</a></li>');
}
else
{
buf.push('<li class="paratabwrap"><a');
buf.push(attrs({ 'data-paraname':('' + (tab) + ''), "class": ('paratab') }, {"data-paraname":true}));
buf.push('>' + escape((interp = tab) == null ? '' : interp) + '</a></li>');
}
    }

  }
}).call(this);

buf.push('</ul></div>');
}
return buf.join("");
};
});

require.define("/paras/onepara.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var basicPM, oneParaT, oneParaactionsM, plateselPM;

  oneParaT = require('./onepara.jade');

  basicPM = require('../plugins/basic');

  plateselPM = require('../plugins/platesel');

  oneParaactionsM = require('./oneparaactions');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    render: function() {
      var self;
      self = this;
      this.ora = new oneParaactionsM({
        model: this.model,
        thepara: this
      });
      if (!this.model.get("contents")) {
        return this.plugin = new plateselPM({
          model: this.model,
          parent: $(".htmlarea")
        });
      } else if (this.model.get("source")) {
        return $.getScript(this.model.get("source")).done(function(data) {
          console.log('aa');
          self.plugin = window.Paradoc._para;
          return self.plugin.zview = new window.Paradoc._para.showview({
            model: self.model,
            parent: $(".htmlarea"),
            thepara: self
          });
        }).fail(function(xhr, settings, exception) {
          return console.log('err ' + exception);
        });
      } else {
        self.plugin = basicPM;
        return self.plugin.zview = new self.plugin.showview({
          model: this.model,
          parent: $(".htmlarea"),
          thepara: self
        });
      }
    },
    showedit: function() {
      if (this.plugin.zedit) {
        this.plugin.zedit.remove();
        this.plugin.zedit.unbind();
      }
      if (this.plugin.zview) {
        this.plugin.zview.remove();
        this.plugin.zview.unbind();
      }
      $(".paraspot").hide();
      this.plugin.zedit = new this.plugin.editview({
        model: this.model,
        thepara: self
      });
      if (this.plugin.noeditor) {
        $(".widgetspot").html(this.plugin.zedit.el).show();
        return this.plugin.zedit.delegateEvents();
      } else {
        if (!$(".wysihtml5-toolbar").hasClass("editspot")) {
          $(".wysihtml5-toolbar").addClass("editspot").addClass("paraspot").appendTo(".menubar").css({
            position: 'absolute',
            top: '0px',
            left: '0px'
          });
        }
        $(".editspot").show();
        return Paradoc.editor.setValue($(this.plugin.zedit.el).html());
      }
    },
    showview: function() {
      var self;
      self = this;
      if (this.plugin.zedit) {
        this.plugin.zedit.remove();
        this.plugin.zedit.unbind();
      }
      if (this.plugin.zview) {
        this.plugin.zview.remove();
        this.plugin.zview.unbind();
      }
      $(".paraspot").hide();
      $(".editarea").val('');
      self.plugin.zview = new self.plugin.showview({
        model: this.model,
        parent: $(".htmlarea"),
        thepara: self
      });
      return $(".htmlarea").show();
    },
    getModel: function() {
      var m;
      m = this.plugin.zedit.getModel($(".editarea").val());
      return m;
    }
  });

}).call(this);

});

require.define("/paras/onepara.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><div style="text-align:left;background-color:#ffffff;padding:0px 10px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd" class="paraonpage"><div style="color:#cccccc" class="pull-right paraactions"></div><div');
buf.push(attrs({ 'style':('clear:both;padding:0px 10px;margin-right:16px;height:' + (h) + 'px'), "class": ('paracontents') }, {"style":true}));
buf.push('> <div style="padding:4px 6px" class="htmlarea paraspot"></div><div style="display:none" class="editspot paraspot"><textarea');
buf.push(attrs({ 'style':('width:100%;height:' + (h-10) + 'px;'), "class": ('editarea') }, {"style":true}));
buf.push('></textarea></div><div style="display:none" class="widgetspot paraspot"></div></div></div></div>');
}
return buf.join("");
};
});

require.define("/plugins/basic.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {

  module.exports = {
    showview: Backbone.View.extend({
      initialize: function() {
        return this.render();
      },
      render: function() {
        var html;
        html = this.model.get("contents");
        $(this.el).html(html);
        return $(this.options.parent).html(this.el);
      }
    }),
    editview: Backbone.View.extend({
      initialize: function() {
        return this.render();
      },
      render: function() {
        var html;
        html = this.model.get("contents");
        return $(this.el).html(html);
      },
      getModel: function(contents) {
        this.model.set("contents", contents);
        return this.model;
      }
    })
  };

}).call(this);

});

require.define("/plugins/platesel.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var plateselT, utils;

  plateselT = require('./platesel.jade');

  utils = require('../utils/utils');

  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.render();
    },
    events: {
      "click .dotemplate": "dotemplate",
      "click .platesel": "doplatesel"
    },
    render: function() {
      var self;
      self = this;
      console.log('a');
      return utils.getJson("/data/plates/list.jsonp", function(data) {
        $(self.el).html(plateselT({
          plates: data['plates']
        }));
        $(self.options.parent).html(self.el);
        return $(".doedit").hide();
      });
    },
    gethtml: function() {
      var text;
      text = this.model.get("contents");
      return text;
    },
    doplatesel: function(ev) {
      var source;
      source = $(".platesel").val();
      console.log('ss ' + source);
      return $.getScript(source, function(data) {
        var _para;
        _para = window.Paradoc._para;
        return $(".plateview").html(_para.html()).css({
          zoom: '50%'
        });
      });
    },
    dotemplate: function(ev) {
      var self, source;
      self = this;
      source = $(".platesel").val();
      return $.getScript(source, function(data) {
        var _para;
        _para = window.Paradoc._para;
        self.model.set("contents", _para.html());
        self.model.set("data", _para.data);
        self.model.set("source", source);
        self.unbind();
        self.remove();
        return $(".paratab[data-paraname='" + self.model.get("name") + "']").click();
      });
    }
  });

}).call(this);

});

require.define("/plugins/platesel.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<h3>Choose a template</h3><div style="margin:10px 5px" class="row-fluid"><div class="span3"><select size="10" style="width:90%" class="platesel">');
// iterate plates
;(function(){
  if ('number' == typeof plates.length) {

    for (var $index = 0, $$l = plates.length; $index < $$l; $index++) {
      var plate = plates[$index];

buf.push('<option');
buf.push(attrs({ 'value':('' + (plate.source) + '') }, {"value":true}));
buf.push('>' + escape((interp = plate.label) == null ? '' : interp) + '</option>');
    }

  } else {
    var $$l = 0;
    for (var $index in plates) {
      $$l++;      var plate = plates[$index];

buf.push('<option');
buf.push(attrs({ 'value':('' + (plate.source) + '') }, {"value":true}));
buf.push('>' + escape((interp = plate.label) == null ? '' : interp) + '</option>');
    }

  }
}).call(this);

buf.push('</select></div><div class="span9"><div style="margin:30px;padding:20px;min-height:250px;zoom:50%;border:1px solid #cccccc" class="plateview">select a template</div></div></div><div style="margin:10px" class="row-fluid"><div class="pull-right"><button class="btn dotemplate">Create</button></div></div>');
}
return buf.join("");
};
});

require.define("/utils/utils.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {

  module.exports.slugify = function(text) {
    text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
    text = text.replace(/-/gi, "_");
    text = text.replace(/\s/gi, "-");
    text = text.toLowerCase();
    return text;
  };

  module.exports.getJson = function(url, cb) {
    return $.ajax({
      url: url,
      type: "GET",
      dataType: "jsonp",
      jsonpCallback: "paradocJson",
      success: function(data) {
        return cb(data);
      },
      error: function(xhr, text, err) {
        console.log('err ' + err);
        return console.log('url ' + url);
      }
    });
  };

}).call(this);

});

require.define("/paras/oneparaactions.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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
      this.options.thepara.showedit();
      $(".savegroup", this.el).show();
      return $(".editgroup", this.el).hide();
    },
    doxncl: function(ev) {
      Paradoc.isediting = false;
      this.options.thepara.showview();
      $(".savegroup", self.el).hide();
      return $(".editgroup", self.el).show();
    },
    doclose: function(ev) {
      return Paradoc.paratabs.rmatab(this.model.get("name"));
    },
    dosave: function(ev) {
      var paramodel, paraname, self;
      self = this;
      paramodel = this.options.thepara.getModel();
      paraname = paramodel.get("name");
      return Paradoc.paras.each(function(m) {
        var d;
        if (m.get("name") === paraname) {
          m = paramodel;
          d = {
            paras: Paradoc.paras.toJSON()
          };
          return dropio.save(Paradoc.doc, JSON.stringify(d), function() {
            return self.doxncl();
          });
        }
      });
    },
    dodel: function(ev) {
      var mrs, paraslug;
      paraslug = this.options.thepara.model.get("slug");
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

require.define("/paras/oneparaactions.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="editgroup"><span class="doedit pointer word">edit</span>');
if ( para.slug != 'home')
{
buf.push('<span class="doclose pointer word">close</span>');
}
buf.push('</div><div style="display:none" class="savegroup">');
if ( para.slug != 'home')
{
buf.push('<span style="color:red;padding-right:15px" class="dodel pointer">delete</span>');
}
buf.push('<span class="dosave pointer word">save</span><span class="doxncl pointer word">cancel</span></div>');
}
return buf.join("");
};
});

require.define("/paras/oneparaactions-ro.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="editgroup">');
if ( para.slug != 'home')
{
buf.push('<span class="doclose pointer word">close</span>');
}
buf.push('</div><div style="display:none" class="savegroup">');
if ( para.slug != 'home')
{
buf.push('<span class="doclose pointer word">close</span>');
}
buf.push('</div>');
}
return buf.join("");
};
});

require.define("/filemanager/actions.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/filemanager/actions.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div style="position:absolute;top:0px;right:0px"><div style="margin-top:0px" class="btn-toolbar"><div class="btn-group"><button class="btn"><span style="font-size:30px">' + escape((interp = filename.replace('.pjs', '')) == null ? '' : interp) + '</span></button><button data-toggle="dropdown" style="padding:7px 15px 8px 15px" class="btn dropdown-toggle"> <span class="caret"></span></button><ul class="dropdown-menu"><li><a class="domanager">File Manager</a></li></ul></div></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/manager.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var copytoT, deleteT, dropio, managerT, newT, noselT, publishT, publishmlT, renameT;

  managerT = require('./manager.jade');

  dropio = require('../db/dropio');

  copytoT = require('./copyto.jade');

  renameT = require('./rename.jade');

  deleteT = require('./delete.jade');

  newT = require('./new.jade');

  noselT = require('./nosel.jade');

  publishT = require('./publish.jade');

  publishmlT = require('./publishml.jade');

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
      "click .dopublish": "dopublish",
      "click .showcopyto": "showcopyto",
      "click .showrename": "showrename",
      "click .showdelete": "showdelete",
      "click .shownew": "shownew"
    },
    render: function(ev) {
      var self;
      self = this;
      return dropio.readdir("/", function(flist) {
        var f, _i, _len;
        self.flist = [];
        for (_i = 0, _len = flist.length; _i < _len; _i++) {
          f = flist[_i];
          if (f.indexOf('.pjs') !== -1) {
            self.flist.push(f);
          }
        }
        $(self.el).html(managerT({
          flist: self.flist
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
        if (tofile.replace('.pjs', '') === f.replace('.pjs', '')) {
          fxists = true;
        }
      }
      if (fxists) {
        $(".errspot", this.el).html("File exists");
        return;
      }
      if (tofile.indexOf('.pjs') === -1) {
        tofile = tofile + ".pjs";
      }
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
        if (tofile.replace('.pjs', '') === f.replace('.pjs', '')) {
          fxists = true;
        }
      }
      if (fxists) {
        $(".errspot", this.el).html("File exists");
        return;
      }
      if (tofile.indexOf('.pjs') === -1) {
        tofile = tofile + ".pjs";
      }
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
        if (nufile.replace('.pjs', '') === f.replace('.pjs', '')) {
          fxists = true;
        }
      }
      if (fxists) {
        $(".errspot", this.el).html("File exists");
        return;
      }
      if (nufile.indexOf('.pjs') === -1) {
        nufile = nufile + ".pjs";
      }
      return dropio.create(nufile, function() {
        Paradoc.navigate('#doc/' + nufile, false);
        return location.reload();
      });
    },
    doopen: function(ev) {
      if (this.getthefile()) {
        Paradoc.navigate('#doc/' + this.thefile, false);
        return location.reload();
      }
    },
    dopublish: function(ev) {
      var d, fname, html, self;
      self = this;
      this.thefile = $(".thefile").val();
      if (this.thefile) {
        d = {
          paras: Paradoc.paras.toJSON()
        };
        html = publishmlT({
          paras: JSON.stringify(d),
          now: new Date().getTime()
        });
        fname = this.thefile.replace('.pjs', '') + '.html';
        console.log(html);
        return dropio.save(fname, html, function() {
          console.log('saved');
          return dropio.geturl(fname, function(err, url) {
            console.log('url is ' + url.url);
            return $(".actionspot", this.el).html(publishT({
              thefile: self.thefile,
              theurl: url.url.replace('www.', 'dl.').replace('https', 'http')
            }));
          });
        });
      }
    }
  });

}).call(this);

});

require.define("/filemanager/manager.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="modal-header"><button type="button" data-dismiss="modal" class="close">x</button><h3>File Manager</h3></div><div class="modal-body"><div class="row-fluid"><div style="height:250px" class="span5"><select size="16" style="width:100%" class="thefile">');
// iterate flist
;(function(){
  if ('number' == typeof flist.length) {

    for (var $index = 0, $$l = flist.length; $index < $$l; $index++) {
      var f = flist[$index];

buf.push('<option>' + escape((interp = f) == null ? '' : interp) + '</option>');
    }

  } else {
    var $$l = 0;
    for (var $index in flist) {
      $$l++;      var f = flist[$index];

buf.push('<option>' + escape((interp = f) == null ? '' : interp) + '</option>');
    }

  }
}).call(this);

buf.push('</select></div><div class="span2"><div class="btn-group btn-group-vertical"><button class="btn"><span class="doopen">Open</span></button><button style="margin-top:20px" class="btn"><span class="showcopyto">Copy to</span></button><button class="btn"><span class="showrename">Rename</span></button><button style="margin-top:20px" class="btn"><span class="showdelete">Delete</span></button><button style="margin-top:30px" class="btn"><span class="shownew">New File</span></button><button style="margin-top:30px" class="btn"><span class="dopublish">Publish</span></button></div></div><div style="height:250px;border:2px solid #ddd;padding-left:2px" class="span5 actionspot"></div></div></div><div class="modal-footer"><a href="#" data-dismiss="modal" class="btn">Cancel</a></div>');
}
return buf.join("");
};
});

require.define("/filemanager/copyto.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Copy To<div><label>From</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (thefile) + ''), 'style':('width:90%') }, {"type":true,"readonly":true,"value":true,"style":true}));
buf.push('/></div><div><label>To</label><input type="text" name="tofile" placeholder="filename" style="width:90%"/></div><div style="margin:10px;text-align:center"><button class="docopyto">Copy</button></div></h3><div style="color:red;text-align:center" class="errspot"></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/rename.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Rename<div><label>From</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (thefile) + ''), 'style':('width:90%') }, {"type":true,"readonly":true,"value":true,"style":true}));
buf.push('/></div><div><label>To</label><input type="text" name="tofile" placeholder="filename" style="width:90%"/></div><div style="margin:10px;text-align:center"><button class="dorename">rename</button></div></h3><div style="color:red;text-align:center" class="errspot"></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/delete.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Delete<div><label>File</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (thefile) + ''), 'style':('width:90%') }, {"type":true,"readonly":true,"value":true,"style":true}));
buf.push('/></div><div style="margin:10px;text-align:center"><button class="dodelete">Confirm Delete</button></div></h3></div>');
}
return buf.join("");
};
});

require.define("/filemanager/new.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>New File</h3><div><label>File name</label><input type="text" name="nufile" placeholder="filename" style="width:90%"/></div><div style="margin:10px;text-align:center"><button class="donew">Create & open file</button></div><div style="color:red;text-align:center" class="errspot"></div></div>');
}
return buf.join("");
};
});

require.define("/filemanager/nosel.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Error<div><label>Please select a file</label></div></h3></div>');
}
return buf.join("");
};
});

require.define("/filemanager/publish.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div><h3>Published url<div><label>File</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (thefile) + ''), 'style':('width:90%') }, {"type":true,"readonly":true,"value":true,"style":true}));
buf.push('/></div><div><label>url</label><input');
buf.push(attrs({ 'type':('text'), 'readonly':('true'), 'value':('' + (theurl) + ''), 'style':('width:90%') }, {"type":true,"readonly":true,"value":true,"style":true}));
buf.push('/></div></h3></div>');
}
return buf.join("");
};
});

require.define("/filemanager/publishml.jade",function(require,module,exports,__dirname,__filename,process,global){module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<html><head><title>PureJasper - Personal wikis</title><link href="http://purejasper.com/e/bootstrap/css/bootstrap.min.css" rel="stylesheet" media="screen"/><link href="http://purejasper.com/e/css/bootstrap-wysihtml5.css" rel="stylesheet" media="screen"/><link rel="http://purejasper.com/e/stylesheet/less" type="text/css" href="./app.less"/><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/underscore-min.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/dropbox.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/wysihtml5-0.3.0.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/jquery.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/backbone-min.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/bootstrap/js/bootstrap.min.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/less.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/showdown.js"></script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/lib/bs-wysi5.js"></script></head><body style="background-color:#f4f4f4"><div style="text-align:center"><h1 style="margin:100px auto">Loading...</h1></div><script>var jdoc = ' + ((interp = paras) == null ? '' : interp) + ';\n</script><script type="text/javascript" src="//ssr1ram.github.io/purejasper/e/client_pjview.min.js?v=#_now}"></script></body></html>');
}
return buf.join("");
};
});

require.define("/utils/wiki_link.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/app.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var AppRouter, WIKI_REGEX, appRouter, dropio, fileactionsM, pageT, paraTabsM, utils, v, wikilink;

  pageT = require('./page');

  dropio = require('./db/dropio');

  paraTabsM = require('./paras/paratabs');

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
            paras: []
          };
        }
        if (jdoc['rams']) {
          Paradoc.paras = new Backbone.Collection(jdoc['rams']);
        } else {
          Paradoc.paras = new Backbone.Collection(jdoc['paras']);
        }
        Paradoc.paras.each(function(m) {
          if (!m.get("slug")) {
            return m.set("slug", utils.slugify(m.get("name")));
          }
        });
        Paradoc.doc = self.filename;
        return self.render();
      });
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
      var fa, h, self, w;
      self = this;
      h = $(window).height() - 150;
      if (h < 150) {
        h = 150;
      }
      w = $(".container.main").width();
      $(self.el).html(pageT({
        h: h,
        w: w,
        doc: Paradoc.doc
      }));
      $("#user-name").text(Paradoc.userInfo.name);
      fa = new fileactionsM({
        filename: this.filename
      });
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
      if (!doc) {
        doc = 'notes.pjs';
      }
      if (doc.indexOf('.pjs') === -1) {
        doc = doc + '.pjs';
      }
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
        return this.readonly = false;
      },
      navigate: function(path, trigger) {
        if (trigger == null) {
          trigger = true;
        }
        return appRouter.navigate(path, {
          trigger: trigger
        });
      },
      seteditor: function() {
        var self;
        self = this;
        this.editor = $('.editarea').wysihtml5({
          stylesheets: ["bootstrap/css/bootstrap.min.css", "app.css"]
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
    window.Paradoc.init();
    return dropio.start(function(userInfo) {
      Paradoc.userInfo = userInfo;
      return Backbone.history.start();
    });
  });

}).call(this);

});
require("/app.coffee");
})();

