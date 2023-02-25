(function () {
  var m,
    aa = function (a) {
      var b = 0;
      return function () {
        return b < a.length ? { done: !1, value: a[b++] } : { done: !0 };
      };
    },
    ba =
      'function' == typeof Object.defineProperties
        ? Object.defineProperty
        : function (a, b, c) {
            if (a == Array.prototype || a == Object.prototype) return a;
            a[b] = c.value;
            return a;
          },
    ca = function (a) {
      a = [
        'object' == typeof globalThis && globalThis,
        a,
        'object' == typeof window && window,
        'object' == typeof self && self,
        'object' == typeof global && global,
      ];
      for (var b = 0; b < a.length; ++b) {
        var c = a[b];
        if (c && c.Math == Math) return c;
      }
      throw Error('Cannot find global object');
    },
    da = ca(this),
    r = function (a, b) {
      if (b)
        a: {
          var c = da;
          a = a.split('.');
          for (var d = 0; d < a.length - 1; d++) {
            var e = a[d];
            if (!(e in c)) break a;
            c = c[e];
          }
          a = a[a.length - 1];
          d = c[a];
          b = b(d);
          b != d && null != b && ba(c, a, { configurable: !0, writable: !0, value: b });
        }
    };
  r('Symbol', function (a) {
    if (a) return a;
    var b = function (f, g) {
      this.ia = f;
      ba(this, 'description', { configurable: !0, writable: !0, value: g });
    };
    b.prototype.toString = function () {
      return this.ia;
    };
    var c = 'jscomp_symbol_' + ((1e9 * Math.random()) >>> 0) + '_',
      d = 0,
      e = function (f) {
        if (this instanceof e) throw new TypeError('Symbol is not a constructor');
        return new b(c + (f || '') + '_' + d++, f);
      };
    return e;
  });
  r('Symbol.iterator', function (a) {
    if (a) return a;
    a = Symbol('Symbol.iterator');
    for (
      var b =
          'Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array'.split(
            ' '
          ),
        c = 0;
      c < b.length;
      c++
    ) {
      var d = da[b[c]];
      'function' === typeof d &&
        'function' != typeof d.prototype[a] &&
        ba(d.prototype, a, {
          configurable: !0,
          writable: !0,
          value: function () {
            return ea(aa(this));
          },
        });
    }
    return a;
  });
  var ea = function (a) {
      a = { next: a };
      a[Symbol.iterator] = function () {
        return this;
      };
      return a;
    },
    fa = function (a, b, c) {
      if (null == a)
        throw new TypeError("The 'this' value for String.prototype." + c + ' must not be null or undefined');
      if (b instanceof RegExp)
        throw new TypeError('First argument to String.prototype.' + c + ' must not be a regular expression');
      return a + '';
    };
  r('String.prototype.endsWith', function (a) {
    return a
      ? a
      : function (b, c) {
          var d = fa(this, b, 'endsWith');
          b += '';
          void 0 === c && (c = d.length);
          c = Math.max(0, Math.min(c | 0, d.length));
          for (var e = b.length; 0 < e && 0 < c; ) if (d[--c] != b[--e]) return !1;
          return 0 >= e;
        };
  });
  var ha = function (a, b) {
    a instanceof String && (a += '');
    var c = 0,
      d = !1,
      e = {
        next: function () {
          if (!d && c < a.length) {
            var f = c++;
            return { value: b(f, a[f]), done: !1 };
          }
          d = !0;
          return { done: !0, value: void 0 };
        },
      };
    e[Symbol.iterator] = function () {
      return e;
    };
    return e;
  };
  r('Array.prototype.entries', function (a) {
    return a
      ? a
      : function () {
          return ha(this, function (b, c) {
            return [b, c];
          });
        };
  });
  r('Array.prototype.keys', function (a) {
    return a
      ? a
      : function () {
          return ha(this, function (b) {
            return b;
          });
        };
  });
  r('Object.is', function (a) {
    return a
      ? a
      : function (b, c) {
          return b === c ? 0 !== b || 1 / b === 1 / c : b !== b && c !== c;
        };
  });
  r('Array.prototype.includes', function (a) {
    return a
      ? a
      : function (b, c) {
          var d = this;
          d instanceof String && (d = String(d));
          var e = d.length;
          c = c || 0;
          for (0 > c && (c = Math.max(c + e, 0)); c < e; c++) {
            var f = d[c];
            if (f === b || Object.is(f, b)) return !0;
          }
          return !1;
        };
  });
  r('String.prototype.includes', function (a) {
    return a
      ? a
      : function (b, c) {
          return -1 !== fa(this, b, 'includes').indexOf(b, c || 0);
        };
  });
  window.gapi = window.gapi || {};
  window.gapi.ua = new Date().getTime(); /*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
  var t = this || self,
    ia = function (a) {
      var b = typeof a;
      return 'object' != b ? b : a ? (Array.isArray(a) ? 'array' : b) : 'null';
    },
    la = function (a) {
      var b = ia(a);
      return 'array' == b || ('object' == b && 'number' == typeof a.length);
    },
    u = function (a) {
      var b = typeof a;
      return ('object' == b && null != a) || 'function' == b;
    },
    ma = 'closure_uid_' + ((1e9 * Math.random()) >>> 0),
    na = 0,
    oa = function (a, b, c) {
      return a.call.apply(a.bind, arguments);
    },
    pa = function (a, b, c) {
      if (!a) throw Error();
      if (2 < arguments.length) {
        var d = Array.prototype.slice.call(arguments, 2);
        return function () {
          var e = Array.prototype.slice.call(arguments);
          Array.prototype.unshift.apply(e, d);
          return a.apply(b, e);
        };
      }
      return function () {
        return a.apply(b, arguments);
      };
    },
    qa = function (a, b, c) {
      qa = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf('native code') ? oa : pa;
      return qa.apply(null, arguments);
    },
    ra = function (a, b) {
      function c() {}
      c.prototype = b.prototype;
      a.ya = b.prototype;
      a.prototype = new c();
      a.prototype.constructor = a;
      a.B = function (d, e, f) {
        for (var g = Array(arguments.length - 2), k = 2; k < arguments.length; k++) g[k - 2] = arguments[k];
        return b.prototype[e].apply(d, g);
      };
    },
    sa = function (a) {
      return a;
    },
    ta = function (a) {
      var b = null,
        c = t.trustedTypes;
      if (!c || !c.createPolicy) return b;
      try {
        b = c.createPolicy(a, { createHTML: sa, createScript: sa, createScriptURL: sa });
      } catch (d) {
        t.console && t.console.error(d.message);
      }
      return b;
    };
  function ua(a, b) {
    if (Error.captureStackTrace) Error.captureStackTrace(this, ua);
    else {
      var c = Error().stack;
      c && (this.stack = c);
    }
    a && (this.message = String(a));
    void 0 !== b && (this.cause = b);
  }
  ra(ua, Error);
  ua.prototype.name = 'CustomError';
  var va;
  function wa(a, b) {
    a = a.split('%s');
    for (var c = '', d = a.length - 1, e = 0; e < d; e++) c += a[e] + (e < b.length ? b[e] : '%s');
    ua.call(this, c + a[d]);
  }
  ra(wa, ua);
  wa.prototype.name = 'AssertionError';
  function xa(a, b, c, d) {
    var e = 'Assertion failed';
    if (c) {
      e += ': ' + c;
      var f = d;
    } else a && ((e += ': ' + a), (f = b));
    throw new wa('' + e, f || []);
  }
  var ya = function (a, b, c) {
      a || xa('', null, b, Array.prototype.slice.call(arguments, 2));
      return a;
    },
    za = function (a, b) {
      throw new wa('Failure' + (a ? ': ' + a : ''), Array.prototype.slice.call(arguments, 1));
    },
    Aa = function (a, b, c) {
      'string' !== typeof a &&
        xa('Expected string but got %s: %s.', [ia(a), a], b, Array.prototype.slice.call(arguments, 2));
    };
  var Ba = Array.prototype.forEach
    ? function (a, b) {
        ya(null != a.length);
        Array.prototype.forEach.call(a, b, void 0);
      }
    : function (a, b) {
        for (var c = a.length, d = 'string' === typeof a ? a.split('') : a, e = 0; e < c; e++)
          e in d && b.call(void 0, d[e], e, a);
      };
  function Ca(a) {
    var b = a.length;
    if (0 < b) {
      for (var c = Array(b), d = 0; d < b; d++) c[d] = a[d];
      return c;
    }
    return [];
  }
  function Da(a, b) {
    for (var c in a) b.call(void 0, a[c], c, a);
  }
  var Ea;
  var v = function (a, b) {
    this.U = (a === Fa && b) || '';
    this.ja = Ga;
  };
  v.prototype.G = !0;
  v.prototype.F = function () {
    return this.U;
  };
  v.prototype.toString = function () {
    return 'Const{' + this.U + '}';
  };
  var Ia = function (a) {
      if (a instanceof v && a.constructor === v && a.ja === Ga) return a.U;
      za("expected object of type Const, got '" + a + "'");
      return 'type_error:Const';
    },
    Ga = {},
    Fa = {};
  var x = function (a, b) {
    this.S = b === Ja ? a : '';
  };
  x.prototype.toString = function () {
    return this.S.toString();
  };
  x.prototype.G = !0;
  x.prototype.F = function () {
    return this.S.toString();
  };
  var Ka = function (a) {
      if (a instanceof x && a.constructor === x) return a.S;
      za("expected object of type SafeUrl, got '" + a + "' of type " + ia(a));
      return 'type_error:SafeUrl';
    },
    La = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i,
    Ma = function (a) {
      if (a instanceof x) return a;
      a = 'object' == typeof a && a.G ? a.F() : String(a);
      ya(La.test(a), '%s does not match the safe URL pattern', a) || (a = 'about:invalid#zClosurez');
      return new x(a, Ja);
    },
    Ja = {};
  var Na = {},
    Oa = function (a, b) {
      this.R = b === Na ? a : '';
      this.G = !0;
    };
  Oa.prototype.F = function () {
    return this.R.toString();
  };
  Oa.prototype.toString = function () {
    return this.R.toString();
  };
  var Pa = function (a, b) {
    this.name = a;
    this.value = b;
  };
  Pa.prototype.toString = function () {
    return this.name;
  };
  var Qa = new Pa('OFF', Infinity),
    Ra = new Pa('WARNING', 900),
    Sa = new Pa('CONFIG', 700),
    Ta = function () {
      this.C = 0;
      this.clear();
    },
    Ua;
  Ta.prototype.clear = function () {
    this.X = Array(this.C);
    this.Z = -1;
    this.ba = !1;
  };
  var Va = function (a, b, c) {
    this.reset(a || Qa, b, c, void 0, void 0);
  };
  Va.prototype.reset = function () {};
  var Wa = function (a, b) {
      this.level = null;
      this.na = [];
      this.parent = (void 0 === b ? null : b) || null;
      this.children = [];
      this.pa = {
        N: function () {
          return a;
        },
      };
    },
    Xa = function (a) {
      if (a.level) return a.level;
      if (a.parent) return Xa(a.parent);
      za('Root logger has no level set.');
      return Qa;
    },
    Ya = function (a, b) {
      for (; a; )
        a.na.forEach(function (c) {
          c(b);
        }),
          (a = a.parent);
    },
    Za = function () {
      this.entries = {};
      var a = new Wa('');
      a.level = Sa;
      this.entries[''] = a;
    },
    $a,
    ab = function (a, b) {
      var c = a.entries[b];
      if (c) return c;
      c = ab(a, b.slice(0, Math.max(b.lastIndexOf('.'), 0)));
      var d = new Wa(b, c);
      a.entries[b] = d;
      c.children.push(d);
      return d;
    },
    bb = function () {
      $a || ($a = new Za());
      return $a;
    }; /*

 SPDX-License-Identifier: Apache-2.0
*/
  var cb = [],
    db = function (a) {
      var b;
      if ((b = ab(bb(), 'safevalues').pa)) {
        var c = "A URL with content '" + a + "' was sanitized away.",
          d = Ra;
        if ((a = b))
          if ((a = b && d)) {
            a = d.value;
            var e = b ? Xa(ab(bb(), b.N())) : Qa;
            a = a >= e.value;
          }
        if (a) {
          d = d || Qa;
          a = ab(bb(), b.N());
          'function' === typeof c && (c = c());
          Ua || (Ua = new Ta());
          e = Ua;
          b = b.N();
          if (0 < e.C) {
            var f = (e.Z + 1) % e.C;
            e.Z = f;
            e.ba ? ((e = e.X[f]), e.reset(d, c, b), (b = e)) : ((e.ba = f == e.C - 1), (b = e.X[f] = new Va(d, c, b)));
          } else b = new Va(d, c, b);
          Ya(a, b);
        }
      }
    };
  -1 === cb.indexOf(db) && cb.push(db);
  var eb = function (a, b) {
    if (
      !u(a) ||
      !u(a) ||
      !u(a) ||
      1 !== a.nodeType ||
      (a.namespaceURI && 'http://www.w3.org/1999/xhtml' !== a.namespaceURI) ||
      a.tagName.toUpperCase() !== b.toString()
    ) {
      b = b.toString() + '; got: ';
      if (u(a))
        try {
          var c = a.constructor.displayName || a.constructor.name || Object.prototype.toString.call(a);
        } catch (d) {
          c = '<object could not be stringified>';
        }
      else c = void 0 === a ? 'undefined' : null === a ? 'null' : typeof a;
      za('Argument is not an HTML Element with tag name ' + (b + c));
    }
    return a;
  };
  var hb = function (a, b) {
      Da(b, function (c, d) {
        c && 'object' == typeof c && c.G && (c = c.F());
        'style' == d
          ? (a.style.cssText = c)
          : 'class' == d
          ? (a.className = c)
          : 'for' == d
          ? (a.htmlFor = c)
          : fb.hasOwnProperty(d)
          ? a.setAttribute(fb[d], c)
          : 0 == d.lastIndexOf('aria-', 0) || 0 == d.lastIndexOf('data-', 0)
          ? a.setAttribute(d, c)
          : (a[d] = c);
      });
    },
    fb = {
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing',
      colspan: 'colSpan',
      frameborder: 'frameBorder',
      height: 'height',
      maxlength: 'maxLength',
      nonce: 'nonce',
      role: 'role',
      rowspan: 'rowSpan',
      type: 'type',
      usemap: 'useMap',
      valign: 'vAlign',
      width: 'width',
    },
    ib = function (a, b, c, d) {
      function e(k) {
        k && b.appendChild('string' === typeof k ? a.createTextNode(k) : k);
      }
      for (; d < c.length; d++) {
        var f = c[d];
        if (!la(f) || (u(f) && 0 < f.nodeType)) e(f);
        else {
          a: {
            if (f && 'number' == typeof f.length) {
              if (u(f)) {
                var g = 'function' == typeof f.item || 'string' == typeof f.item;
                break a;
              }
              if ('function' === typeof f) {
                g = 'function' == typeof f.item;
                break a;
              }
            }
            g = !1;
          }
          Ba(g ? Ca(f) : f, e);
        }
      }
    },
    jb = function (a, b) {
      b = String(b);
      'application/xhtml+xml' === a.contentType && (b = b.toLowerCase());
      return a.createElement(b);
    },
    kb = function (a) {
      ya(a, 'Node cannot be null or undefined.');
      return 9 == a.nodeType ? a : a.ownerDocument || a.document;
    },
    lb = function (a) {
      this.D = a || t.document || document;
    };
  m = lb.prototype;
  m.getElementsByTagName = function (a, b) {
    return (b || this.D).getElementsByTagName(String(a));
  };
  m.ma = function (a, b, c) {
    var d = this.D,
      e = arguments,
      f = e[1],
      g = jb(d, String(e[0]));
    f && ('string' === typeof f ? (g.className = f) : Array.isArray(f) ? (g.className = f.join(' ')) : hb(g, f));
    2 < e.length && ib(d, g, e, 2);
    return g;
  };
  m.createElement = function (a) {
    return jb(this.D, a);
  };
  m.createTextNode = function (a) {
    return this.D.createTextNode(String(a));
  };
  m.appendChild = function (a, b) {
    ya(null != a && null != b, 'goog.dom.appendChild expects non-null arguments');
    a.appendChild(b);
  };
  m.append = function (a, b) {
    ib(kb(a), a, arguments, 1);
  };
  m.canHaveChildren = function (a) {
    if (1 != a.nodeType) return !1;
    switch (a.tagName) {
      case 'APPLET':
      case 'AREA':
      case 'BASE':
      case 'BR':
      case 'COL':
      case 'COMMAND':
      case 'EMBED':
      case 'FRAME':
      case 'HR':
      case 'IMG':
      case 'INPUT':
      case 'IFRAME':
      case 'ISINDEX':
      case 'KEYGEN':
      case 'LINK':
      case 'NOFRAMES':
      case 'NOSCRIPT':
      case 'META':
      case 'OBJECT':
      case 'PARAM':
      case 'SCRIPT':
      case 'SOURCE':
      case 'STYLE':
      case 'TRACK':
      case 'WBR':
        return !1;
    }
    return !0;
  };
  m.removeNode = function (a) {
    return a && a.parentNode ? a.parentNode.removeChild(a) : null;
  };
  m.contains = function (a, b) {
    if (!a || !b) return !1;
    if (a.contains && 1 == b.nodeType) return a == b || a.contains(b);
    if ('undefined' != typeof a.compareDocumentPosition) return a == b || !!(a.compareDocumentPosition(b) & 16);
    for (; b && a != b; ) b = b.parentNode;
    return b == a;
  }; /*
 gapi.loader.OBJECT_CREATE_TEST_OVERRIDE &&*/
  var y = window,
    A = document,
    mb = y.location,
    nb = function () {},
    ob = /\[native code\]/,
    B = function (a, b, c) {
      return (a[b] = a[b] || c);
    },
    pb = function (a) {
      for (var b = 0; b < this.length; b++) if (this[b] === a) return b;
      return -1;
    },
    qb = function (a) {
      a = a.sort();
      for (var b = [], c = void 0, d = 0; d < a.length; d++) {
        var e = a[d];
        e != c && b.push(e);
        c = e;
      }
      return b;
    },
    rb = /&/g,
    sb = /</g,
    tb = />/g,
    ub = /"/g,
    vb = /'/g,
    wb = function (a) {
      return String(a)
        .replace(rb, '&amp;')
        .replace(sb, '&lt;')
        .replace(tb, '&gt;')
        .replace(ub, '&quot;')
        .replace(vb, '&#39;');
    },
    C = function () {
      var a;
      if ((a = Object.create) && ob.test(a)) a = a(null);
      else {
        a = {};
        for (var b in a) a[b] = void 0;
      }
      return a;
    },
    D = function (a, b) {
      return Object.prototype.hasOwnProperty.call(a, b);
    },
    xb = function (a) {
      if (ob.test(Object.keys)) return Object.keys(a);
      var b = [],
        c;
      for (c in a) D(a, c) && b.push(c);
      return b;
    },
    E = function (a, b) {
      a = a || {};
      for (var c in a) D(a, c) && (b[c] = a[c]);
    },
    yb = function (a) {
      return function () {
        y.setTimeout(a, 0);
      };
    },
    F = function (a, b) {
      if (!a) throw Error(b || '');
    },
    H = B(y, 'gapi', {});
  var I = function (a, b, c) {
      var d = new RegExp('([#].*&|[#])' + b + '=([^&#]*)', 'g');
      b = new RegExp('([?#].*&|[?#])' + b + '=([^&#]*)', 'g');
      if ((a = a && (d.exec(a) || b.exec(a))))
        try {
          c = decodeURIComponent(a[2]);
        } catch (e) {}
      return c;
    },
    zb = new RegExp(
      /^/.source +
        /([a-zA-Z][-+.a-zA-Z0-9]*:)?/.source +
        /(\/\/[^\/?#]*)?/.source +
        /([^?#]*)?/.source +
        /(\?([^#]*))?/.source +
        /(#((#|[^#])*))?/.source +
        /$/.source
    ),
    Ab = /[\ud800-\udbff][\udc00-\udfff]|[^!-~]/g,
    Bb = new RegExp(
      /(%([^0-9a-fA-F%]|[0-9a-fA-F]([^0-9a-fA-F%])?)?)*/.source +
        /%($|[^0-9a-fA-F]|[0-9a-fA-F]($|[^0-9a-fA-F]))/.source,
      'g'
    ),
    Cb = /%([a-f]|[0-9a-fA-F][a-f])/g,
    Db = /^(https?|ftp|file|chrome-extension):$/i,
    Eb = function (a) {
      a = String(a);
      a = a
        .replace(Ab, function (e) {
          try {
            return encodeURIComponent(e);
          } catch (f) {
            return encodeURIComponent(e.replace(/^[^%]+$/g, '\ufffd'));
          }
        })
        .replace(Bb, function (e) {
          return e.replace(/%/g, '%25');
        })
        .replace(Cb, function (e) {
          return e.toUpperCase();
        });
      a = a.match(zb) || [];
      var b = C(),
        c = function (e) {
          return e
            .replace(/\\/g, '%5C')
            .replace(/\^/g, '%5E')
            .replace(/`/g, '%60')
            .replace(/\{/g, '%7B')
            .replace(/\|/g, '%7C')
            .replace(/\}/g, '%7D');
        },
        d = !!(a[1] || '').match(Db);
      b.B = c((a[1] || '') + (a[2] || '') + (a[3] || (a[2] && d ? '/' : '')));
      d = function (e) {
        return c(e.replace(/\?/g, '%3F').replace(/#/g, '%23'));
      };
      b.query = a[5] ? [d(a[5])] : [];
      b.j = a[7] ? [d(a[7])] : [];
      return b;
    },
    Fb = function (a) {
      return a.B + (0 < a.query.length ? '?' + a.query.join('&') : '') + (0 < a.j.length ? '#' + a.j.join('&') : '');
    },
    Gb = function (a, b) {
      var c = [];
      if (a)
        for (var d in a)
          if (D(a, d) && null != a[d]) {
            var e = b ? b(a[d]) : a[d];
            c.push(encodeURIComponent(d) + '=' + encodeURIComponent(e));
          }
      return c;
    },
    Hb = function (a, b, c, d) {
      a = Eb(a);
      a.query.push.apply(a.query, Gb(b, d));
      a.j.push.apply(a.j, Gb(c, d));
      return Fb(a);
    },
    Ib = new RegExp(
      /\/?\??#?/.source +
        '(' +
        /[\/?#]/i.source +
        '|' +
        /[\uD800-\uDBFF]/i.source +
        '|' +
        /%[c-f][0-9a-f](%[89ab][0-9a-f]){0,2}(%[89ab]?)?/i.source +
        '|' +
        /%[0-9a-f]?/i.source +
        ')$',
      'i'
    ),
    Jb = function (a, b) {
      var c = Eb(b);
      b = c.B;
      c.query.length && (b += '?' + c.query.join(''));
      c.j.length && (b += '#' + c.j.join(''));
      var d = '';
      2e3 < b.length && ((d = b), (b = b.substr(0, 2e3)), (b = b.replace(Ib, '')), (d = d.substr(b.length)));
      var e = a.createElement('div');
      a = a.createElement('a');
      c = Eb(b);
      b = c.B;
      c.query.length && (b += '?' + c.query.join(''));
      c.j.length && (b += '#' + c.j.join(''));
      b = null === b ? 'null' : void 0 === b ? 'undefined' : b;
      if ('string' !== typeof b) throw Error('Expected a string');
      b = new x(b, Ja);
      eb(a, 'A');
      b = b instanceof x ? b : Ma(b);
      a.href = Ka(b);
      e.appendChild(a);
      a = e.innerHTML;
      b = new v(Fa, 'Assignment to self.');
      Aa(Ia(b), 'must provide justification');
      ya(!/^[\s\xa0]*$/.test(Ia(b)), 'must provide non-empty justification');
      void 0 === Ea && (Ea = ta('gapi#html'));
      a = (b = Ea) ? b.createHTML(a) : a;
      a = new Oa(a, Na);
      if (void 0 !== e.tagName) {
        if ('script' === e.tagName.toLowerCase()) throw Error('Use setTextContent with a SafeScript.');
        if ('style' === e.tagName.toLowerCase()) throw Error('Use setTextContent with a SafeStyleSheet.');
      }
      a instanceof Oa && a.constructor === Oa
        ? (a = a.R)
        : (za("expected object of type SafeHtml, got '" + a + "' of type " + ia(a)), (a = 'type_error:SafeHtml'));
      e.innerHTML = a;
      b = String(e.firstChild.href);
      e.parentNode && e.parentNode.removeChild(e);
      c = Eb(b + d);
      d = c.B;
      c.query.length && (d += '?' + c.query.join(''));
      c.j.length && (d += '#' + c.j.join(''));
      return d;
    },
    Kb = /^https?:\/\/[^\/%\\?#\s]+\/[^\s]*$/i;
  var Lb;
  var Mb = function (a, b, c, d) {
      if (y[c + 'EventListener']) y[c + 'EventListener'](a, b, !1);
      else if (y[d + 'tachEvent']) y[d + 'tachEvent']('on' + a, b);
    },
    Nb = function () {
      var a = A.readyState;
      return 'complete' === a || ('interactive' === a && -1 == navigator.userAgent.indexOf('MSIE'));
    },
    Qb = function (a) {
      var b = Ob;
      if (!Nb())
        try {
          b();
        } catch (c) {}
      Pb(a);
    },
    Pb = function (a) {
      if (Nb()) a();
      else {
        var b = !1,
          c = function () {
            if (!b) return (b = !0), a.apply(this, arguments);
          };
        y.addEventListener
          ? (y.addEventListener('load', c, !1), y.addEventListener('DOMContentLoaded', c, !1))
          : y.attachEvent &&
            (y.attachEvent('onreadystatechange', function () {
              Nb() && c.apply(this, arguments);
            }),
            y.attachEvent('onload', c));
      }
    },
    Rb = function (a) {
      for (; a.firstChild; ) a.removeChild(a.firstChild);
    },
    Sb = { button: !0, div: !0, span: !0 };
  var M = {};
  M = B(y, '___jsl', C());
  B(M, 'I', 0);
  B(M, 'hel', 10);
  var Tb = function (a) {
      return M.dpo ? M.h : I(a, 'jsh', M.h);
    },
    Ub = function (a) {
      var b = B(M, 'sws', []);
      b.push.apply(b, a);
    },
    Vb = function (a) {
      return B(M, 'watt', C())[a];
    },
    Wb = function (a) {
      var b = B(M, 'PQ', []);
      M.PQ = [];
      var c = b.length;
      if (0 === c) a();
      else
        for (
          var d = 0,
            e = function () {
              ++d === c && a();
            },
            f = 0;
          f < c;
          f++
        )
          b[f](e);
    },
    Xb = function (a) {
      return B(B(M, 'H', C()), a, C());
    };
  var Yb = B(M, 'perf', C()),
    Zb = B(Yb, 'g', C()),
    $b = B(Yb, 'i', C());
  B(Yb, 'r', []);
  C();
  C();
  var ac = function (a, b, c) {
      var d = Yb.r;
      'function' === typeof d ? d(a, b, c) : d.push([a, b, c]);
    },
    N = function (a, b, c) {
      Zb[a] = (!b && Zb[a]) || c || new Date().getTime();
      ac(a);
    },
    cc = function (a, b, c) {
      b &&
        0 < b.length &&
        ((b = bc(b)),
        c && 0 < c.length && (b += '___' + bc(c)),
        28 < b.length && (b = b.substr(0, 28) + (b.length - 28)),
        (c = b),
        (b = B($b, '_p', C())),
        (B(b, c, C())[a] = new Date().getTime()),
        ac(a, '_p', c));
    },
    bc = function (a) {
      return a.join('__').replace(/\./g, '_').replace(/\-/g, '_').replace(/,/g, '_');
    };
  var dc = C(),
    O = [],
    P = function (a) {
      throw Error('Bad hint: ' + a);
    };
  O.push([
    'jsl',
    function (a) {
      for (var b in a)
        if (D(a, b)) {
          var c = a[b];
          'object' == typeof c ? (M[b] = B(M, b, []).concat(c)) : B(M, b, c);
        }
      if ((b = a.u)) (a = B(M, 'us', [])), a.push(b), (b = /^https:(.*)$/.exec(b)) && a.push('http:' + b[1]);
    },
  ]);
  var ec = /^(\/[a-zA-Z0-9_\-]+)+$/,
    fc = [/\/amp\//, /\/amp$/, /^\/amp$/],
    gc = /^[a-zA-Z0-9\-_\.,!]+$/,
    hc = /^gapi\.loaded_[0-9]+$/,
    ic = /^[a-zA-Z0-9,._-]+$/,
    mc = function (a, b, c, d, e) {
      var f = a.split(';'),
        g = f.shift(),
        k = dc[g],
        h = null;
      k ? (h = k(f, b, c, d)) : P('no hint processor for: ' + g);
      h || P('failed to generate load url');
      b = h;
      c = b.match(jc);
      ((d = b.match(kc)) && 1 === d.length && lc.test(b) && c && 1 === c.length) || P('failed sanity: ' + a);
      try {
        a = '?';
        if (e && 0 < e.length) {
          c = b = 0;
          for (d = {}; c < e.length; ) {
            var l = e[c++];
            f = void 0;
            f = u(l)
              ? 'o' + ((Object.prototype.hasOwnProperty.call(l, ma) && l[ma]) || (l[ma] = ++na))
              : (typeof l).charAt(0) + l;
            Object.prototype.hasOwnProperty.call(d, f) || ((d[f] = !0), (e[b++] = l));
          }
          e.length = b;
          h = h + '?le=' + e.join(',');
          a = '&';
        }
        if (M.rol) {
          var n = M.ol;
          n && n.length && (h = '' + h + a + 'ol=' + n.length);
        }
      } catch (q) {}
      return h;
    },
    pc = function (a, b, c, d) {
      a = nc(a);
      hc.test(c) || P('invalid_callback');
      b = oc(b);
      d = d && d.length ? oc(d) : null;
      var e = function (f) {
        return encodeURIComponent(f).replace(/%2C/g, ',');
      };
      return [
        encodeURIComponent(a.pathPrefix).replace(/%2C/g, ',').replace(/%2F/g, '/'),
        '/k=',
        e(a.version),
        '/m=',
        e(b),
        d ? '/exm=' + e(d) : '',
        '/rt=j/sv=1/d=1/ed=1',
        a.W ? '/am=' + e(a.W) : '',
        a.fa ? '/rs=' + e(a.fa) : '',
        a.ha ? '/t=' + e(a.ha) : '',
        '/cb=',
        e(c),
      ].join('');
    },
    nc = function (a) {
      '/' !== a.charAt(0) && P('relative path');
      for (var b = a.substring(1).split('/'), c = []; b.length; ) {
        a = b.shift();
        if (!a.length || 0 == a.indexOf('.')) P('empty/relative directory');
        else if (0 < a.indexOf('=')) {
          b.unshift(a);
          break;
        }
        c.push(a);
      }
      a = {};
      for (var d = 0, e = b.length; d < e; ++d) {
        var f = b[d].split('='),
          g = decodeURIComponent(f[0]),
          k = decodeURIComponent(f[1]);
        2 == f.length && g && k && (a[g] = a[g] || k);
      }
      b = '/' + c.join('/');
      ec.test(b) || P('invalid_prefix');
      c = 0;
      for (d = fc.length; c < d; ++c) fc[c].test(b) && P('invalid_prefix');
      c = qc(a, 'k', !0);
      d = qc(a, 'am');
      e = qc(a, 'rs');
      a = qc(a, 't');
      return { pathPrefix: b, version: c, W: d, fa: e, ha: a };
    },
    oc = function (a) {
      for (var b = [], c = 0, d = a.length; c < d; ++c) {
        var e = a[c].replace(/\./g, '_').replace(/-/g, '_');
        ic.test(e) && b.push(e);
      }
      return b.join(',');
    },
    qc = function (a, b, c) {
      a = a[b];
      !a && c && P('missing: ' + b);
      if (a) {
        if (gc.test(a)) return a;
        P('invalid: ' + b);
      }
      return null;
    },
    lc = /^https?:\/\/[a-z0-9_.-]+\.google(rs)?\.com(:\d+)?\/[a-zA-Z0-9_.,!=\-\/]+$/,
    kc = /\/cb=/g,
    jc = /\/\//g;
  dc.m = function (a, b, c, d) {
    (a = a[0]) || P('missing_hint');
    return 'https://apis.google.com' + pc(a, b, c, d);
  };
  var rc = decodeURI('%73cript'),
    sc = /^[-+_0-9\/A-Za-z]+={0,2}$/,
    tc = function (a, b) {
      for (var c = [], d = 0; d < a.length; ++d) {
        var e = a[d];
        e && 0 > pb.call(b, e) && c.push(e);
      }
      return c;
    },
    uc = function () {
      var a = M.nonce;
      return void 0 !== a
        ? a && a === String(a) && a.match(sc)
          ? a
          : (M.nonce = null)
        : A.querySelector
        ? (a = A.querySelector('script[nonce]'))
          ? ((a = a.nonce || a.getAttribute('nonce') || ''),
            a && a === String(a) && a.match(sc) ? (M.nonce = a) : (M.nonce = null))
          : null
        : null;
    },
    xc = function (a) {
      if ('loading' != A.readyState) vc(a);
      else {
        var b = uc(),
          c = '';
        null !== b && (c = ' nonce="' + b + '"');
        a = '<' + rc + ' src="' + encodeURI(a) + '"' + c + '></' + rc + '>';
        A.write(wc ? wc.createHTML(a) : a);
      }
    },
    vc = function (a) {
      var b = A.createElement(rc);
      b.setAttribute('src', wc ? wc.createScriptURL(a) : a);
      a = uc();
      null !== a && b.setAttribute('nonce', a);
      b.async = 'true';
      (a = A.getElementsByTagName(rc)[0])
        ? a.parentNode.insertBefore(b, a)
        : (A.head || A.body || A.documentElement).appendChild(b);
    },
    zc = function (a, b, c) {
      yc(function () {
        var d = b === Tb(mb.href) ? B(H, '_', C()) : C();
        d = B(Xb(b), '_', d);
        a(d);
      }, c);
    },
    Bc = function (a, b) {
      var c = b || {};
      'function' == typeof b && ((c = {}), (c.callback = b));
      var d = (b = c) && b._c;
      if (d)
        for (var e = 0; e < O.length; e++) {
          var f = O[e][0],
            g = O[e][1];
          g && D(d, f) && g(d[f], a, b);
        }
      b = [];
      a ? (b = a.split(':')) : c.features && (b = c.features);
      if (!(a = c.h) && ((a = Tb(mb.href)), !a)) throw Error('Bad hint: !hint');
      Ac(b || [], c, a);
    },
    Ac = function (a, b, c) {
      var d = !!M.glrp;
      a = qb(a) || [];
      var e = b.callback,
        f = b.config,
        g = b.timeout,
        k = b.ontimeout,
        h = b.onerror,
        l = void 0;
      'function' == typeof h && (l = h);
      var n = null,
        q = !1;
      if ((g && !k) || (!g && k)) throw 'Timeout requires both the timeout parameter and ontimeout parameter to be set';
      h = B(Xb(c), 'r', []).sort();
      var p = B(Xb(c), 'L', []).sort(),
        J = M.le || [],
        z = [].concat(h),
        w = function (R, ja) {
          if (q) return 0;
          y.clearTimeout(n);
          p.push.apply(p, G);
          var ka = ((H || {}).config || {}).update;
          ka ? ka(f) : f && B(M, 'cu', []).push(f);
          if (ja) {
            cc('me0', R, z);
            try {
              zc(ja, c, l);
            } finally {
              cc('me1', R, z);
            }
          }
          return 1;
        };
      0 < g &&
        (n = y.setTimeout(function () {
          q = !0;
          k();
        }, g));
      var G = tc(a, p);
      if (G.length) {
        G = tc(a, h);
        var K = B(M, 'CP', []),
          L = K.length;
        K[L] = function (R) {
          if (!R) return 0;
          cc('ml1', G, z);
          var ja = function (Ha) {
              d || (K[L] = null);
              w(G, R) &&
                (d && (K[L] = null),
                Wb(function () {
                  e && e();
                  Ha();
                }));
            },
            ka = function () {
              var Ha = K[L + 1];
              Ha && Ha();
            };
          0 < L && K[L - 1]
            ? (K[L] = function () {
                ja(ka);
              })
            : ja(ka);
        };
        if (G.length) {
          var gb = 'loaded_' + M.I++;
          H[gb] = function (R) {
            K[L](R);
            H[gb] = null;
          };
          a = mc(c, G, 'gapi.' + gb, h, J);
          h.push.apply(h, G);
          cc('ml0', G, z);
          b.sync || y.___gapisync ? xc(a) : vc(a);
        } else K[L](nb);
      } else w(G) && e && e();
    },
    wc = ta('gapi#gapi');
  var yc = function (a, b) {
    if (M.hee && 0 < M.hel)
      try {
        return a();
      } catch (c) {
        b && b(c),
          M.hel--,
          Bc('debug_error', function () {
            try {
              window.___jsl.hefn(c);
            } catch (d) {
              throw c;
            }
          });
      }
    else
      try {
        return a();
      } catch (c) {
        throw (b && b(c), c);
      }
  };
  var Cc = H.load;
  Cc && B(M, 'ol', []).push(Cc);
  H.load = function (a, b) {
    return yc(function () {
      return Bc(a, b);
    });
  };
  var Dc = function (a) {
      var b = (window.___jsl = window.___jsl || {});
      b[a] = b[a] || [];
      return b[a];
    },
    Ec = function (a) {
      var b = (window.___jsl = window.___jsl || {});
      b.cfg = (!a && b.cfg) || {};
      return b.cfg;
    },
    Fc = function (a) {
      return 'object' === typeof a && /\[native code\]/.test(a.push);
    },
    Q = function (a, b, c) {
      if (b && 'object' === typeof b)
        for (var d in b)
          !Object.prototype.hasOwnProperty.call(b, d) ||
            (c && '___goc' === d && 'undefined' === typeof b[d]) ||
            (a[d] && b[d] && 'object' === typeof a[d] && 'object' === typeof b[d] && !Fc(a[d]) && !Fc(b[d])
              ? Q(a[d], b[d])
              : b[d] && 'object' === typeof b[d]
              ? ((a[d] = Fc(b[d]) ? [] : {}), Q(a[d], b[d]))
              : (a[d] = b[d]));
    },
    Gc = function (a) {
      if (a && !/^\s+$/.test(a)) {
        for (; 0 == a.charCodeAt(a.length - 1); ) a = a.substring(0, a.length - 1);
        try {
          var b = window.JSON.parse(a);
        } catch (c) {}
        if ('object' === typeof b) return b;
        try {
          b = new Function('return (' + a + '\n)')();
        } catch (c) {}
        if ('object' === typeof b) return b;
        try {
          b = new Function('return ({' + a + '\n})')();
        } catch (c) {}
        return 'object' === typeof b ? b : {};
      }
    },
    Hc = function (a, b) {
      var c = { ___goc: void 0 };
      a.length &&
        a[a.length - 1] &&
        Object.hasOwnProperty.call(a[a.length - 1], '___goc') &&
        'undefined' === typeof a[a.length - 1].___goc &&
        (c = a.pop());
      Q(c, b);
      a.push(c);
    },
    Ic = function (a) {
      Ec(!0);
      var b = window.___gcfg,
        c = Dc('cu'),
        d = window.___gu;
      b && b !== d && (Hc(c, b), (window.___gu = b));
      b = Dc('cu');
      var e = document.scripts || document.getElementsByTagName('script') || [];
      d = [];
      var f = [];
      f.push.apply(f, Dc('us'));
      for (var g = 0; g < e.length; ++g)
        for (var k = e[g], h = 0; h < f.length; ++h) k.src && 0 == k.src.indexOf(f[h]) && d.push(k);
      0 == d.length && 0 < e.length && e[e.length - 1].src && d.push(e[e.length - 1]);
      for (e = 0; e < d.length; ++e)
        d[e].getAttribute('gapi_processed') ||
          (d[e].setAttribute('gapi_processed', !0),
          (f = d[e]) ? ((g = f.nodeType), (f = 3 == g || 4 == g ? f.nodeValue : f.textContent || '')) : (f = void 0),
          (f = Gc(f)) && b.push(f));
      a && Hc(c, a);
      d = Dc('cd');
      a = 0;
      for (b = d.length; a < b; ++a) Q(Ec(), d[a], !0);
      d = Dc('ci');
      a = 0;
      for (b = d.length; a < b; ++a) Q(Ec(), d[a], !0);
      a = 0;
      for (b = c.length; a < b; ++a) Q(Ec(), c[a], !0);
    },
    S = function (a) {
      var b = Ec();
      if (!a) return b;
      a = a.split('/');
      for (var c = 0, d = a.length; b && 'object' === typeof b && c < d; ++c) b = b[a[c]];
      return c === a.length && void 0 !== b ? b : void 0;
    },
    Jc = function (a, b) {
      var c;
      if ('string' === typeof a) {
        var d = (c = {});
        a = a.split('/');
        for (var e = 0, f = a.length; e < f - 1; ++e) {
          var g = {};
          d = d[a[e]] = g;
        }
        d[a[e]] = b;
      } else c = a;
      Ic(c);
    };
  var Kc = function () {
    var a = window.__GOOGLEAPIS;
    a &&
      (a.googleapis && !a['googleapis.config'] && (a['googleapis.config'] = a.googleapis),
      B(M, 'ci', []).push(a),
      (window.__GOOGLEAPIS = void 0));
  };
  var Lc = {
      callback: 1,
      clientid: 1,
      cookiepolicy: 1,
      openidrealm: -1,
      includegrantedscopes: -1,
      requestvisibleactions: 1,
      scope: 1,
    },
    Mc = !1,
    Nc = C(),
    Oc = function () {
      if (!Mc) {
        for (var a = document.getElementsByTagName('meta'), b = 0; b < a.length; ++b) {
          var c = a[b].name.toLowerCase();
          if (0 == c.lastIndexOf('google-signin-', 0)) {
            c = c.substring(14);
            var d = a[b].content;
            Lc[c] && d && (Nc[c] = d);
          }
        }
        if (window.self !== window.top) {
          a = document.location.toString();
          for (var e in Lc) 0 < Lc[e] && (b = I(a, e, '')) && (Nc[e] = b);
        }
        Mc = !0;
      }
      e = C();
      E(Nc, e);
      return e;
    },
    Pc = function (a) {
      return !!(a.clientid && a.scope && a.callback);
    };
  var Qc = function () {
    this.i = window.console;
  };
  Qc.prototype.log = function (a) {
    this.i && this.i.log && this.i.log(a);
  };
  Qc.prototype.error = function (a) {
    this.i && (this.i.error ? this.i.error(a) : this.i.log && this.i.log(a));
  };
  Qc.prototype.warn = function (a) {
    this.i && (this.i.warn ? this.i.warn(a) : this.i.log && this.i.log(a));
  };
  Qc.prototype.debug = function () {};
  var Rc = new Qc();
  var Sc = function () {
      return !!M.oa;
    },
    Tc = function () {};
  var T = B(M, 'rw', C()),
    Uc = function (a) {
      for (var b in T) a(T[b]);
    },
    Vc = function (a, b) {
      (a = T[a]) && a.state < b && (a.state = b);
    };
  var U = function (a) {
    var b = (window.___jsl = window.___jsl || {});
    b.cfg = b.cfg || {};
    b = b.cfg;
    if (!a) return b;
    a = a.split('/');
    for (var c = 0, d = a.length; b && 'object' === typeof b && c < d; ++c) b = b[a[c]];
    return c === a.length && void 0 !== b ? b : void 0;
  };
  var Wc = /^https?:\/\/(?:\w|[\-\.])+\.google\.(?:\w|[\-:\.])+(?:\/[^\?#]*)?\/u\/(\d)\//,
    Xc = /^https?:\/\/(?:\w|[\-\.])+\.google\.(?:\w|[\-:\.])+(?:\/[^\?#]*)?\/b\/(\d{10,21})\//,
    Yc = function () {
      var a = U('googleapis.config/sessionIndex');
      'string' === typeof a && 254 < a.length && (a = null);
      null == a && (a = window.__X_GOOG_AUTHUSER);
      'string' === typeof a && 254 < a.length && (a = null);
      if (null == a) {
        var b = window.google;
        b && (a = b.authuser);
      }
      'string' === typeof a && 254 < a.length && (a = null);
      null == a &&
        ((b = window.location.href),
        (a = I(b, 'authuser') || null),
        null == a && (a = (a = b.match(Wc)) ? a[1] : null));
      if (null == a) return null;
      a = String(a);
      254 < a.length && (a = null);
      return a;
    },
    Zc = function () {
      var a = U('googleapis.config/sessionDelegate');
      'string' === typeof a && 21 < a.length && (a = null);
      null == a && (a = (a = window.location.href.match(Xc)) ? a[1] : null);
      if (null == a) return null;
      a = String(a);
      21 < a.length && (a = null);
      return a;
    };
  var $c,
    V,
    W = void 0,
    X = function (a) {
      try {
        return t.JSON.parse.call(t.JSON, a);
      } catch (b) {
        return !1;
      }
    },
    Y = function (a) {
      return Object.prototype.toString.call(a);
    },
    ad = Y(0),
    bd = Y(new Date(0)),
    cd = Y(!0),
    dd = Y(''),
    ed = Y({}),
    fd = Y([]),
    gd = function (a, b) {
      if (b)
        for (var c = 0, d = b.length; c < d; ++c)
          if (a === b[c]) throw new TypeError('Converting circular structure to JSON');
      d = typeof a;
      if ('undefined' !== d) {
        c = Array.prototype.slice.call(b || [], 0);
        c[c.length] = a;
        b = [];
        var e = Y(a);
        if (
          null != a &&
          'function' === typeof a.toJSON &&
          (Object.prototype.hasOwnProperty.call(a, 'toJSON') ||
            ((e !== fd || (a.constructor !== Array && a.constructor !== Object)) &&
              (e !== ed || (a.constructor !== Array && a.constructor !== Object)) &&
              e !== dd &&
              e !== ad &&
              e !== cd &&
              e !== bd))
        )
          return gd(a.toJSON.call(a), c);
        if (null == a) b[b.length] = 'null';
        else if (e === ad)
          (a = Number(a)),
            isNaN(a) || isNaN(a - a) ? (a = 'null') : -0 === a && 0 > 1 / a && (a = '-0'),
            (b[b.length] = String(a));
        else if (e === cd) b[b.length] = String(!!Number(a));
        else {
          if (e === bd) return gd(a.toISOString.call(a), c);
          if (e === fd && Y(a.length) === ad) {
            b[b.length] = '[';
            var f = 0;
            for (d = Number(a.length) >> 0; f < d; ++f) f && (b[b.length] = ','), (b[b.length] = gd(a[f], c) || 'null');
            b[b.length] = ']';
          } else if (e == dd && Y(a.length) === ad) {
            b[b.length] = '"';
            f = 0;
            for (c = Number(a.length) >> 0; f < c; ++f)
              (d = String.prototype.charAt.call(a, f)),
                (e = String.prototype.charCodeAt.call(a, f)),
                (b[b.length] =
                  '\b' === d
                    ? '\\b'
                    : '\f' === d
                    ? '\\f'
                    : '\n' === d
                    ? '\\n'
                    : '\r' === d
                    ? '\\r'
                    : '\t' === d
                    ? '\\t'
                    : '\\' === d || '"' === d
                    ? '\\' + d
                    : 31 >= e
                    ? '\\u' + (e + 65536).toString(16).substr(1)
                    : 32 <= e && 65535 >= e
                    ? d
                    : '\ufffd');
            b[b.length] = '"';
          } else if ('object' === d) {
            b[b.length] = '{';
            d = 0;
            for (f in a)
              Object.prototype.hasOwnProperty.call(a, f) &&
                ((e = gd(a[f], c)),
                void 0 !== e &&
                  (d++ && (b[b.length] = ','), (b[b.length] = gd(f)), (b[b.length] = ':'), (b[b.length] = e)));
            b[b.length] = '}';
          } else return;
        }
        return b.join('');
      }
    },
    hd = /[\0-\x07\x0b\x0e-\x1f]/,
    id = /^([^"]*"([^\\"]|\\.)*")*[^"]*"([^"\\]|\\.)*[\0-\x1f]/,
    jd = /^([^"]*"([^\\"]|\\.)*")*[^"]*"([^"\\]|\\.)*\\[^\\\/"bfnrtu]/,
    kd = /^([^"]*"([^\\"]|\\.)*")*[^"]*"([^"\\]|\\.)*\\u([0-9a-fA-F]{0,3}[^0-9a-fA-F])/,
    ld = /"([^\0-\x1f\\"]|\\[\\\/"bfnrt]|\\u[0-9a-fA-F]{4})*"/g,
    md = /-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)?/g,
    nd = /[ \t\n\r]+/g,
    od = /[^"]:/,
    pd = /""/g,
    qd = /true|false|null/g,
    rd = /00/,
    sd = /[\{]([^0\}]|0[^:])/,
    td = /(^|\[)[,:]|[,:](\]|\}|[,:]|$)/,
    ud = /[^\[,:][\[\{]/,
    vd = /^(\{|\}|\[|\]|,|:|0)+/,
    wd = /\u2028/g,
    xd = /\u2029/g,
    yd = function (a) {
      a = String(a);
      if (hd.test(a) || id.test(a) || jd.test(a) || kd.test(a)) return !1;
      var b = a.replace(ld, '""');
      b = b.replace(md, '0');
      b = b.replace(nd, '');
      if (od.test(b)) return !1;
      b = b.replace(pd, '0');
      b = b.replace(qd, '0');
      if (rd.test(b) || sd.test(b) || td.test(b) || ud.test(b) || !b || (b = b.replace(vd, ''))) return !1;
      a = a.replace(wd, '\\u2028').replace(xd, '\\u2029');
      b = void 0;
      try {
        b = W
          ? [X(a)]
          : eval('(function (var_args) {\n  return Array.prototype.slice.call(arguments, 0);\n})(\n' + a + '\n)');
      } catch (c) {
        return !1;
      }
      return b && 1 === b.length ? b[0] : !1;
    },
    zd = function () {
      var a = ((t.document || {}).scripts || []).length;
      if ((void 0 === $c || void 0 === W || V !== a) && -1 !== V) {
        $c = W = !1;
        V = -1;
        try {
          try {
            W =
              !!t.JSON &&
              '{"a":[3,true,"1970-01-01T00:00:00.000Z"]}' ===
                t.JSON.stringify.call(t.JSON, { a: [3, !0, new Date(0)], c: function () {} }) &&
              !0 === X('true') &&
              3 === X('[{"a":3}]')[0].a;
          } catch (b) {}
          $c = W && !X('[00]') && !X('"\u0007"') && !X('"\\0"') && !X('"\\v"');
        } finally {
          V = a;
        }
      }
    },
    Ad = function (a) {
      if (-1 === V) return !1;
      zd();
      return ($c ? X : yd)(a);
    },
    Bd = function (a) {
      if (-1 !== V) return zd(), W ? t.JSON.stringify.call(t.JSON, a) : gd(a);
    },
    Cd =
      !Date.prototype.toISOString ||
      'function' !== typeof Date.prototype.toISOString ||
      '1970-01-01T00:00:00.000Z' !== new Date(0).toISOString(),
    Dd = function () {
      var a = Date.prototype.getUTCFullYear.call(this);
      return [
        0 > a
          ? '-' + String(1e6 - a).substr(1)
          : 9999 >= a
          ? String(1e4 + a).substr(1)
          : '+' + String(1e6 + a).substr(1),
        '-',
        String(101 + Date.prototype.getUTCMonth.call(this)).substr(1),
        '-',
        String(100 + Date.prototype.getUTCDate.call(this)).substr(1),
        'T',
        String(100 + Date.prototype.getUTCHours.call(this)).substr(1),
        ':',
        String(100 + Date.prototype.getUTCMinutes.call(this)).substr(1),
        ':',
        String(100 + Date.prototype.getUTCSeconds.call(this)).substr(1),
        '.',
        String(1e3 + Date.prototype.getUTCMilliseconds.call(this)).substr(1),
        'Z',
      ].join('');
    };
  Date.prototype.toISOString = Cd ? Dd : Date.prototype.toISOString;
  var Ed = function () {
    this.blockSize = -1;
  };
  var Fd = function () {
    this.blockSize = -1;
    this.blockSize = 64;
    this.g = [];
    this.M = [];
    this.ka = [];
    this.J = [];
    this.J[0] = 128;
    for (var a = 1; a < this.blockSize; ++a) this.J[a] = 0;
    this.K = this.v = 0;
    this.reset();
  };
  ra(Fd, Ed);
  Fd.prototype.reset = function () {
    this.g[0] = 1732584193;
    this.g[1] = 4023233417;
    this.g[2] = 2562383102;
    this.g[3] = 271733878;
    this.g[4] = 3285377520;
    this.K = this.v = 0;
  };
  var Gd = function (a, b, c) {
    c || (c = 0);
    var d = a.ka;
    if ('string' === typeof b)
      for (var e = 0; 16 > e; e++)
        (d[e] =
          (b.charCodeAt(c) << 24) | (b.charCodeAt(c + 1) << 16) | (b.charCodeAt(c + 2) << 8) | b.charCodeAt(c + 3)),
          (c += 4);
    else for (e = 0; 16 > e; e++) (d[e] = (b[c] << 24) | (b[c + 1] << 16) | (b[c + 2] << 8) | b[c + 3]), (c += 4);
    for (e = 16; 80 > e; e++) {
      var f = d[e - 3] ^ d[e - 8] ^ d[e - 14] ^ d[e - 16];
      d[e] = ((f << 1) | (f >>> 31)) & 4294967295;
    }
    b = a.g[0];
    c = a.g[1];
    var g = a.g[2],
      k = a.g[3],
      h = a.g[4];
    for (e = 0; 80 > e; e++) {
      if (40 > e)
        if (20 > e) {
          f = k ^ (c & (g ^ k));
          var l = 1518500249;
        } else (f = c ^ g ^ k), (l = 1859775393);
      else 60 > e ? ((f = (c & g) | (k & (c | g))), (l = 2400959708)) : ((f = c ^ g ^ k), (l = 3395469782));
      f = (((b << 5) | (b >>> 27)) + f + h + l + d[e]) & 4294967295;
      h = k;
      k = g;
      g = ((c << 30) | (c >>> 2)) & 4294967295;
      c = b;
      b = f;
    }
    a.g[0] = (a.g[0] + b) & 4294967295;
    a.g[1] = (a.g[1] + c) & 4294967295;
    a.g[2] = (a.g[2] + g) & 4294967295;
    a.g[3] = (a.g[3] + k) & 4294967295;
    a.g[4] = (a.g[4] + h) & 4294967295;
  };
  Fd.prototype.update = function (a, b) {
    if (null != a) {
      void 0 === b && (b = a.length);
      for (var c = b - this.blockSize, d = 0, e = this.M, f = this.v; d < b; ) {
        if (0 == f) for (; d <= c; ) Gd(this, a, d), (d += this.blockSize);
        if ('string' === typeof a)
          for (; d < b; ) {
            if (((e[f] = a.charCodeAt(d)), ++f, ++d, f == this.blockSize)) {
              Gd(this, e);
              f = 0;
              break;
            }
          }
        else
          for (; d < b; )
            if (((e[f] = a[d]), ++f, ++d, f == this.blockSize)) {
              Gd(this, e);
              f = 0;
              break;
            }
      }
      this.v = f;
      this.K += b;
    }
  };
  Fd.prototype.digest = function () {
    var a = [],
      b = 8 * this.K;
    56 > this.v ? this.update(this.J, 56 - this.v) : this.update(this.J, this.blockSize - (this.v - 56));
    for (var c = this.blockSize - 1; 56 <= c; c--) (this.M[c] = b & 255), (b /= 256);
    Gd(this, this.M);
    for (c = b = 0; 5 > c; c++) for (var d = 24; 0 <= d; d -= 8) (a[b] = (this.g[c] >> d) & 255), ++b;
    return a;
  };
  var Hd = function () {
    this.T = new Fd();
  };
  Hd.prototype.reset = function () {
    this.T.reset();
  };
  var Id = y.crypto,
    Jd = !1,
    Kd = 0,
    Ld = 0,
    Md = 1,
    Nd = 0,
    Od = '',
    Pd = function (a) {
      a = a || y.event;
      var b = (a.screenX + a.clientX) << 16;
      b += a.screenY + a.clientY;
      b *= new Date().getTime() % 1e6;
      Md = (Md * b) % Nd;
      0 < Kd && ++Ld == Kd && Mb('mousemove', Pd, 'remove', 'de');
    },
    Qd = function (a) {
      var b = new Hd();
      a = unescape(encodeURIComponent(a));
      for (var c = [], d = 0, e = a.length; d < e; ++d) c.push(a.charCodeAt(d));
      b.T.update(c);
      b = b.T.digest();
      a = '';
      for (c = 0; c < b.length; c++)
        a += '0123456789ABCDEF'.charAt(Math.floor(b[c] / 16)) + '0123456789ABCDEF'.charAt(b[c] % 16);
      return a;
    };
  Jd = !!Id && 'function' == typeof Id.getRandomValues;
  Jd ||
    ((Nd = 1e6 * (screen.width * screen.width + screen.height)),
    (Od = Qd(A.cookie + '|' + A.location + '|' + new Date().getTime() + '|' + Math.random())),
    (Kd = U('random/maxObserveMousemove') || 0),
    0 != Kd && Mb('mousemove', Pd, 'add', 'at'));
  var Rd = function () {
      var a = M.onl;
      if (!a) {
        a = C();
        M.onl = a;
        var b = C();
        a.e = function (c) {
          var d = b[c];
          d && (delete b[c], d());
        };
        a.a = function (c, d) {
          b[c] = d;
        };
        a.r = function (c) {
          delete b[c];
        };
      }
      return a;
    },
    Sd = function (a, b) {
      b = b.onload;
      return 'function' === typeof b ? (Rd().a(a, b), b) : null;
    },
    Td = function (a) {
      F(/^\w+$/.test(a), 'Unsupported id - ' + a);
      return 'onload="window.___jsl.onl.e(&#34;' + a + '&#34;)"';
    },
    Ud = function (a) {
      Rd().r(a);
    };
  var Vd = {
      allowtransparency: 'true',
      frameborder: '0',
      hspace: '0',
      marginheight: '0',
      marginwidth: '0',
      scrolling: 'no',
      style: '',
      tabindex: '0',
      vspace: '0',
      width: '100%',
    },
    Wd = { allowtransparency: !0, onload: !0 },
    Xd = 0,
    Yd = function (a) {
      F(!a || Kb.test(a), 'Illegal url for new iframe - ' + a);
    },
    Zd = function (a, b, c, d, e) {
      Yd(c.src);
      var f,
        g = Sd(d, c),
        k = g ? Td(d) : '';
      try {
        document.all &&
          (f = a.createElement(
            '<iframe frameborder="' +
              wb(String(c.frameborder)) +
              '" scrolling="' +
              wb(String(c.scrolling)) +
              '" ' +
              k +
              ' name="' +
              wb(String(c.name)) +
              '"/>'
          ));
      } catch (l) {
      } finally {
        f ||
          ((f = (a ? new lb(kb(a)) : va || (va = new lb())).ma('IFRAME')),
          g &&
            ((f.onload = function () {
              f.onload = null;
              g.call(this);
            }),
            Ud(d)));
      }
      f.setAttribute('ng-non-bindable', '');
      for (var h in c)
        (a = c[h]), 'style' === h && 'object' === typeof a ? E(a, f.style) : Wd[h] || f.setAttribute(h, String(a));
      (h = (e && e.beforeNode) || null) || (e && e.dontclear) || Rb(b);
      b.insertBefore(f, h);
      f = h ? h.previousSibling : b.lastChild;
      c.allowtransparency && (f.allowTransparency = !0);
      return f;
    };
  var $d = /^:[\w]+$/,
    ae = /:([a-zA-Z_]+):/g,
    be = function () {
      var a = Yc() || '0',
        b = Zc();
      var c = Yc() || a;
      var d = Zc(),
        e = '';
      c && (e += 'u/' + encodeURIComponent(String(c)) + '/');
      d && (e += 'b/' + encodeURIComponent(String(d)) + '/');
      c = e || null;
      (e = (d = !1 === U('isLoggedIn')) ? '_/im/' : '') && (c = '');
      var f = U('iframes/:socialhost:'),
        g = U('iframes/:im_socialhost:');
      return (Lb = {
        socialhost: f,
        ctx_socialhost: d ? g : f,
        session_index: a,
        session_delegate: b,
        session_prefix: c,
        im_prefix: e,
      });
    },
    ce = function (a, b) {
      return be()[b] || '';
    },
    de = function (a) {
      return function (b, c) {
        return a ? be()[c] || a[c] || '' : be()[c] || '';
      };
    };
  var ee = function (a) {
      var b;
      a.match(/^https?%3A/i) && (b = decodeURIComponent(a));
      a = b ? b : a;
      return Jb(document, a);
    },
    fe = function (a) {
      a = a || 'canonical';
      for (var b = document.getElementsByTagName('link'), c = 0, d = b.length; c < d; c++) {
        var e = b[c],
          f = e.getAttribute('rel');
        if (
          f &&
          f.toLowerCase() == a &&
          (e = e.getAttribute('href')) &&
          (e = ee(e)) &&
          null != e.match(/^https?:\/\/[\w\-_\.]+/i)
        )
          return e;
      }
      return window.location.href;
    };
  var ge = { se: '0' },
    he = { post: !0 },
    ie = { style: 'position:absolute;top:-10000px;width:450px;margin:0px;border-style:none' },
    je = 'onPlusOne _ready _close _open _resizeMe _renderstart oncircled drefresh erefresh'.split(' '),
    ke = B(M, 'WI', C()),
    le = function (a, b, c) {
      var d;
      var e = {};
      var f = (d = a);
      'plus' == a && b.action && ((d = a + '_' + b.action), (f = a + '/' + b.action));
      (d = S('iframes/' + d + '/url')) ||
        (d = ':im_socialhost:/:session_prefix::im_prefix:_/widget/render/' + f + '?usegapi=1');
      for (var g in ge) e[g] = g + '/' + (b[g] || ge[g]) + '/';
      e = Jb(A, d.replace(ae, de(e)));
      g = 'iframes/' + a + '/params/';
      f = {};
      E(b, f);
      (d = S('lang') || S('gwidget/lang')) && (f.hl = d);
      he[a] || (f.origin = window.location.origin || window.location.protocol + '//' + window.location.host);
      f.exp = S(g + 'exp');
      if ((g = S(g + 'location')))
        for (d = 0; d < g.length; d++) {
          var k = g[d];
          f[k] = y.location[k];
        }
      switch (a) {
        case 'plus':
        case 'follow':
          g = f.href;
          d = b.action ? void 0 : 'publisher';
          g = (g = 'string' == typeof g ? g : void 0) ? ee(g) : fe(d);
          f.url = g;
          delete f.href;
          break;
        case 'plusone':
          g = (g = b.href) ? ee(g) : fe();
          f.url = g;
          g = b.db;
          d = S();
          null == g && d && ((g = d.db), null == g && (g = d.gwidget && d.gwidget.db));
          f.db = g || void 0;
          g = b.ecp;
          d = S();
          null == g && d && ((g = d.ecp), null == g && (g = d.gwidget && d.gwidget.ecp));
          f.ecp = g || void 0;
          delete f.href;
          break;
        case 'signin':
          f.url = fe();
      }
      M.ILI && (f.iloader = '1');
      delete f['data-onload'];
      delete f.rd;
      for (var h in ge) f[h] && delete f[h];
      f.gsrc = S('iframes/:source:');
      h = S('inline/css');
      'undefined' !== typeof h && 0 < c && h >= c && (f.ic = '1');
      h = /^#|^fr-/;
      c = {};
      for (var l in f) D(f, l) && h.test(l) && ((c[l.replace(h, '')] = f[l]), delete f[l]);
      l = 'q' == S('iframes/' + a + '/params/si') ? f : c;
      h = Oc();
      for (var n in h) !D(h, n) || D(f, n) || D(c, n) || (l[n] = h[n]);
      n = [].concat(je);
      (l = S('iframes/' + a + '/methods')) && 'object' === typeof l && ob.test(l.push) && (n = n.concat(l));
      for (var q in b) D(b, q) && /^on/.test(q) && ('plus' != a || 'onconnect' != q) && (n.push(q), delete f[q]);
      delete f.callback;
      c._methods = n.join(',');
      return Hb(e, f, c);
    },
    me = ['style', 'data-gapiscan'],
    oe = function (a) {
      for (var b = C(), c = 0 != a.nodeName.toLowerCase().indexOf('g:'), d = a.attributes.length, e = 0; e < d; e++) {
        var f = a.attributes[e],
          g = f.name,
          k = f.value;
        0 <= pb.call(me, g) ||
          (c && 0 != g.indexOf('data-')) ||
          'null' === k ||
          ('specified' in f && !f.specified) ||
          (c && (g = g.substr(5)), (b[g.toLowerCase()] = k));
      }
      a = a.style;
      (c = ne(a && a.height)) && (b.height = String(c));
      (a = ne(a && a.width)) && (b.width = String(a));
      return b;
    },
    ne = function (a) {
      var b = void 0;
      'number' === typeof a ? (b = a) : 'string' === typeof a && (b = parseInt(a, 10));
      return b;
    },
    re = function () {
      var a = M.drw;
      Uc(function (b) {
        if (a !== b.id && 4 != b.state && 'share' != b.type) {
          var c = b.id,
            d = b.type,
            e = b.url;
          b = b.userParams;
          var f = A.getElementById(c);
          if (f) {
            var g = le(d, b, 0);
            g
              ? ((f = f.parentNode),
                pe(e) !== pe(g) &&
                  ((b.dontclear = !0),
                  (b.rd = !0),
                  (b.ri = !0),
                  (b.type = d),
                  qe(f, b),
                  (d = T[f.lastChild.id]) && (d.oid = c),
                  Vc(c, 4)))
              : delete T[c];
          } else delete T[c];
        }
      });
    },
    pe = function (a) {
      var b = RegExp('(\\?|&)ic=1');
      return a.replace(/#.*/, '').replace(b, '');
    };
  var se,
    te,
    ue,
    ve,
    we,
    xe = /(?:^|\s)g-((\S)*)(?:$|\s)/,
    ye = { plusone: !0, autocomplete: !0, profile: !0, signin: !0, signin2: !0 };
  se = B(M, 'SW', C());
  te = B(M, 'SA', C());
  ue = B(M, 'SM', C());
  ve = B(M, 'FW', []);
  we = null;
  var ze = function (a, b) {
      return ('string' === typeof a ? document.getElementById(a) : a) || b;
    },
    Be = function (a, b) {
      Ae(void 0, !1, a, b);
    },
    Ae = function (a, b, c, d) {
      N('ps0', !0);
      c = ze(c, A);
      var e = A.documentMode;
      if (c.querySelectorAll && (!e || 8 < e)) {
        e = d ? [d] : xb(se).concat(xb(te)).concat(xb(ue));
        for (var f = [], g = 0; g < e.length; g++) {
          var k = e[g];
          f.push('.g-' + k, 'g\\:' + k);
        }
        e = c.querySelectorAll(f.join(','));
      } else e = c.getElementsByTagName('*');
      c = C();
      for (f = 0; f < e.length; f++) {
        g = e[f];
        k = d;
        var h = g.nodeName.toLowerCase(),
          l = void 0;
        if (g.getAttribute('data-gapiscan')) k = null;
        else {
          var n = h.indexOf('g:');
          0 == n
            ? (l = h.substr(2))
            : (n = (n = String(g.className || g.getAttribute('class'))) && xe.exec(n)) && (l = n[1]);
          k = !l || !(se[l] || te[l] || ue[l]) || (k && l !== k) ? null : l;
        }
        k &&
          (ye[k] || 0 == g.nodeName.toLowerCase().indexOf('g:') || 0 != xb(oe(g)).length) &&
          (g.setAttribute('data-gapiscan', !0), B(c, k, []).push(g));
      }
      if (b) for (var q in c) for (b = c[q], d = 0; d < b.length; d++) b[d].setAttribute('data-onload', !0);
      for (var p in c) ve.push(p);
      N('ps1', !0);
      if ((q = ve.join(':')) || a)
        try {
          H.load(q, a);
        } catch (z) {
          Rc.log(z);
          return;
        }
      if (Ce(we || {}))
        for (var J in c) {
          a = c[J];
          p = 0;
          for (b = a.length; p < b; p++) a[p].removeAttribute('data-gapiscan');
          De(J);
        }
      else {
        d = [];
        for (J in c) for (a = c[J], p = 0, b = a.length; p < b; p++) (e = a[p]), Ee(J, e, oe(e), d, b);
        Fe(q, d);
      }
    },
    Ge = function (a) {
      var b = B(H, a, {});
      b.go ||
        ((b.go = function (c) {
          return Be(c, a);
        }),
        (b.render = function (c, d) {
          d = d || {};
          d.type = a;
          return qe(c, d);
        }));
    },
    He = function (a) {
      se[a] = !0;
    },
    Ie = function (a) {
      te[a] = !0;
    },
    Je = function (a) {
      ue[a] = !0;
    };
  var De = function (a, b) {
      var c = Vb(a);
      b && c
        ? (c(b), (c = b.iframeNode) && c.setAttribute('data-gapiattached', !0))
        : H.load(a, function () {
            var d = Vb(a),
              e = b && b.iframeNode,
              f = b && b.userParams;
            e && d
              ? (d(b), e.setAttribute('data-gapiattached', !0))
              : ((d = H[a].go), 'signin2' == a ? d(e, f) : d(e && e.parentNode, f));
          });
    },
    Ce = function () {
      return !1;
    },
    Fe = function () {},
    Ee = function (a, b, c, d, e, f) {
      switch (Ke(b, a, f)) {
        case 0:
          a = ue[a] ? a + '_annotation' : a;
          d = {};
          d.iframeNode = b;
          d.userParams = c;
          De(a, d);
          break;
        case 1:
          if (b.parentNode) {
            for (var g in c) {
              if ((f = D(c, g)))
                (f = c[g]),
                  (f =
                    !!f &&
                    'object' === typeof f &&
                    (!f.toString ||
                      f.toString === Object.prototype.toString ||
                      f.toString === Array.prototype.toString));
              if (f)
                try {
                  c[g] = Bd(c[g]);
                } catch (G) {
                  delete c[g];
                }
            }
            var k = !0;
            c.dontclear && (k = !1);
            delete c.dontclear;
            Tc();
            f = le(a, c, e);
            g = { allowPost: 1, attributes: ie };
            g.dontclear = !k;
            e = {};
            e.userParams = c;
            e.url = f;
            e.type = a;
            if (c.rd) var h = b;
            else
              (h = document.createElement('div')),
                b.setAttribute('data-gapistub', !0),
                (h.style.cssText = 'position:absolute;width:450px;left:-10000px;'),
                b.parentNode.insertBefore(h, b);
            e.siteElement = h;
            h.id || ((b = h), B(ke, a, 0), (k = '___' + a + '_' + ke[a]++), (b.id = k));
            b = C();
            b['>type'] = a;
            E(c, b);
            k = f;
            c = h;
            f = g || {};
            b = f.attributes || {};
            F(
              !(f.allowPost || f.forcePost) || !b.onload,
              'onload is not supported by post iframe (allowPost or forcePost)'
            );
            g = b = k;
            $d.test(b) &&
              ((g = U('iframes/' + g.substring(1) + '/url')), F(!!g, 'Unknown iframe url config for - ' + b));
            k = Jb(A, g.replace(ae, ce));
            b = c.ownerDocument || A;
            h = 0;
            do g = f.id || ['I', Xd++, '_', new Date().getTime()].join('');
            while (b.getElementById(g) && 5 > ++h);
            F(5 > h, 'Error creating iframe id');
            h = {};
            var l = {};
            b.documentMode && 9 > b.documentMode && (h.hostiemode = b.documentMode);
            E(f.queryParams || {}, h);
            E(f.fragmentParams || {}, l);
            var n = f.pfname;
            var q = C();
            U('iframes/dropLegacyIdParam') || (q.id = g);
            q._gfid = g;
            q.parent = b.location.protocol + '//' + b.location.host;
            var p = I(b.location.href, 'parent');
            n = n || '';
            !n &&
              p &&
              ((p = I(b.location.href, '_gfid', '') || I(b.location.href, 'id', '')),
              (n = I(b.location.href, 'pfname', '')),
              (n = p ? n + '/' + p : ''));
            n ||
              ((p = Ad(I(b.location.href, 'jcp', ''))) &&
                'object' == typeof p &&
                (n = (n = p.id) ? p.pfname + '/' + n : ''));
            q.pfname = n;
            f.connectWithJsonParam && ((p = {}), (p.jcp = Bd(q)), (q = p));
            p = I(k, 'rpctoken') || h.rpctoken || l.rpctoken;
            if (!p) {
              if (!(p = f.rpctoken)) {
                p = String;
                n = Math;
                var J = n.round;
                if (Jd) {
                  var z = new y.Uint32Array(1);
                  Id.getRandomValues(z);
                  z = Number('0.' + z[0]);
                } else (z = Md), (z += parseInt(Od.substr(0, 20), 16)), (Od = Qd(Od)), (z /= Nd + Math.pow(16, 20));
                p = p(J.call(n, 1e8 * z));
              }
              q.rpctoken = p;
            }
            f.rpctoken = p;
            E(q, f.connectWithQueryParams ? h : l);
            p = b.location.href;
            q = C();
            (n = I(p, '_bsh', M.bsh)) && (q._bsh = n);
            (p = Tb(p)) && (q.jsh = p);
            f.hintInFragment ? E(q, l) : E(q, h);
            k = Hb(k, h, l, f.paramsSerializer);
            l = C();
            E(Vd, l);
            E(f.attributes, l);
            l.name = l.id = g;
            l.src = k;
            f.eurl = k;
            h = f || {};
            q = !!h.allowPost;
            if (h.forcePost || (q && 2e3 < k.length)) {
              h = Eb(k);
              l.src = '';
              f.dropDataPostorigin || (l['data-postorigin'] = k);
              k = Zd(b, c, l, g);
              if (-1 != navigator.userAgent.indexOf('WebKit')) {
                var w = k.contentWindow.document;
                w.open();
                l = w.createElement('div');
                q = {};
                p = g + '_inner';
                q.name = p;
                q.src = '';
                q.style = 'display:none';
                Zd(b, l, q, p, f);
              }
              l = (f = h.query[0]) ? f.split('&') : [];
              f = [];
              for (q = 0; q < l.length; q++)
                (p = l[q].split('=', 2)), f.push([decodeURIComponent(p[0]), decodeURIComponent(p[1])]);
              h.query = [];
              l = Fb(h);
              F(Kb.test(l), 'Invalid URL: ' + l);
              h = b.createElement('form');
              h.method = 'POST';
              h.target = g;
              h.style.display = 'none';
              g = l instanceof x ? l : Ma(l);
              eb(h, 'FORM').action = Ka(g);
              for (g = 0; g < f.length; g++)
                (l = b.createElement('input')),
                  (l.type = 'hidden'),
                  (l.name = f[g][0]),
                  (l.value = f[g][1]),
                  h.appendChild(l);
              c.appendChild(h);
              h.submit();
              h.parentNode.removeChild(h);
              w && w.close();
              w = k;
            } else w = Zd(b, c, l, g, f);
            e.iframeNode = w;
            e.id = w.getAttribute('id');
            w = e.id;
            c = C();
            c.id = w;
            c.userParams = e.userParams;
            c.url = e.url;
            c.type = e.type;
            c.state = 1;
            T[w] = c;
            w = e;
          } else w = null;
          w && ((e = w.id) && d.push(e), De(a, w));
      }
    },
    Ke = function (a, b, c) {
      if (a && 1 === a.nodeType && b) {
        if (c) return 1;
        if (ue[b]) {
          if (Sb[a.nodeName.toLowerCase()]) return (a = a.innerHTML) && a.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '') ? 0 : 1;
        } else {
          if (te[b]) return 0;
          if (se[b]) return 1;
        }
      }
      return null;
    },
    qe = function (a, b) {
      var c = b.type;
      delete b.type;
      var d = ze(a);
      if (d) {
        a = {};
        for (var e in b) D(b, e) && (a[e.toLowerCase()] = b[e]);
        a.rd = 1;
        (b = !!a.ri) && delete a.ri;
        e = [];
        Ee(c, d, a, e, 0, b);
        Fe(c, e);
      } else Rc.log('string' === 'gapi.' + c + '.render: missing element ' + typeof a ? a : '');
    };
  B(H, 'platform', {}).go = Be;
  Ce = function (a) {
    for (var b = ['_c', 'jsl', 'h'], c = 0; c < b.length && a; c++) a = a[b[c]];
    b = Tb(mb.href);
    return !a || (0 != a.indexOf('n;') && 0 != b.indexOf('n;') && a !== b);
  };
  Fe = function (a, b) {
    Le(a, b);
  };
  var Ob = function (a) {
      Ae(a, !0);
    },
    Me = function (a, b) {
      b = b || [];
      for (var c = 0; c < b.length; ++c) a(b[c]);
      for (a = 0; a < b.length; a++) Ge(b[a]);
    };
  O.push([
    'platform',
    function (a, b, c) {
      we = c;
      (b || c.features) && ve.push(b || c.features.join(':'));
      Me(He, a);
      Me(Ie, c._c.annotation);
      Me(Je, c._c.bimodal);
      Kc();
      Ic();
      if ('explicit' != S('parsetags')) {
        Ub(a);
        Pc(Oc()) && !S('disableRealtimeCallback') && Tc();
        if (c && (a = c.callback)) {
          var d = yb(a);
          delete c.callback;
        }
        Qb(function () {
          Ob(d);
        });
      }
    },
  ]);
  H._pl = !0;
  var Ne = function (a) {
    a = (a = T[a]) ? a.oid : void 0;
    if (a) {
      var b = A.getElementById(a);
      b && b.parentNode.removeChild(b);
      delete T[a];
      Ne(a);
    }
  };
  var Oe = /^\{h:'/,
    Pe = /^!_/,
    Qe = '',
    Le = function (a, b) {
      function c() {
        Mb('message', d, 'remove', 'de');
      }
      function d(f) {
        var g = f.data,
          k = f.origin;
        if (Re(g, b)) {
          var h = e;
          e = !1;
          h && N('rqe');
          Se(a, function () {
            h && N('rqd');
            c();
            for (var l = B(M, 'RPMQ', []), n = 0; n < l.length; n++) l[n]({ data: g, origin: k });
          });
        }
      }
      if (0 !== b.length) {
        Qe = I(mb.href, 'pfname', '');
        var e = !0;
        Mb('message', d, 'add', 'at');
        Bc(a, c);
      }
    },
    Re = function (a, b) {
      a = String(a);
      if (Oe.test(a)) return !0;
      var c = !1;
      Pe.test(a) && ((c = !0), (a = a.substr(2)));
      if (!/^\{/.test(a)) return !1;
      var d = Ad(a);
      if (!d) return !1;
      a = d.f;
      if (d.s && a && -1 != pb.call(b, a)) {
        if ('_renderstart' === d.s || d.s === Qe + '/' + a + '::_renderstart')
          if (((d = d.a && d.a[c ? 0 : 1]), (b = A.getElementById(a)), Vc(a, 2), d && b && d.width && d.height)) {
            a: {
              c = b.parentNode;
              a = d || {};
              if (Sc()) {
                var e = b.id;
                if (e) {
                  d = (d = T[e]) ? d.state : void 0;
                  if (1 === d || 4 === d) break a;
                  Ne(e);
                }
              }
              (d = c.nextSibling) &&
                d.getAttribute &&
                d.getAttribute('data-gapistub') &&
                (c.parentNode.removeChild(d), (c.style.cssText = ''));
              d = a.width;
              var f = a.height,
                g = c.style;
              g.textIndent = '0';
              g.margin = '0';
              g.padding = '0';
              g.background = 'transparent';
              g.borderStyle = 'none';
              g.cssFloat = 'none';
              g.styleFloat = 'none';
              g.lineHeight = 'normal';
              g.fontSize = '1px';
              g.verticalAlign = 'baseline';
              c = c.style;
              c.display = 'inline-block';
              g = b.style;
              g.position = 'static';
              g.left = '0';
              g.top = '0';
              g.visibility = 'visible';
              d && (c.width = g.width = d + 'px');
              f && (c.height = g.height = f + 'px');
              a.verticalAlign && (c.verticalAlign = a.verticalAlign);
              e && Vc(e, 3);
            }
            b['data-csi-wdt'] = new Date().getTime();
          }
        return !0;
      }
      return !1;
    },
    Se = function (a, b) {
      Bc(a, b);
    };
  var Te = function (a, b) {
    this.P = a;
    a = b || {};
    this.qa = Number(a.maxAge) || 0;
    this.aa = a.domain;
    this.da = a.path;
    this.ra = !!a.secure;
  };
  Te.prototype.read = function () {
    for (var a = this.P + '=', b = document.cookie.split(/;\s*/), c = 0; c < b.length; ++c) {
      var d = b[c];
      if (0 == d.indexOf(a)) return d.substr(a.length);
    }
  };
  Te.prototype.write = function (a, b) {
    if (!Ue.test(this.P)) throw 'Invalid cookie name';
    if (!Ve.test(a)) throw 'Invalid cookie value';
    a = this.P + '=' + a;
    this.aa && (a += ';domain=' + this.aa);
    this.da && (a += ';path=' + this.da);
    b = 'number' === typeof b ? b : this.qa;
    if (0 <= b) {
      var c = new Date();
      c.setSeconds(c.getSeconds() + b);
      a += ';expires=' + c.toUTCString();
    }
    this.ra && (a += ';secure');
    document.cookie = a;
    return !0;
  };
  Te.prototype.clear = function () {
    this.write('', 0);
  };
  var Ve = /^[-+/_=.:|%&a-zA-Z0-9@]*$/,
    Ue = /^[A-Z_][A-Z0-9_]{0,63}$/;
  Te.iterate = function (a) {
    for (var b = document.cookie.split(/;\s*/), c = 0; c < b.length; ++c) {
      var d = b[c].split('='),
        e = d.shift();
      a(e, d.join('='));
    }
  };
  var We = function (a) {
    this.H = a;
  };
  We.prototype.read = function () {
    if (Z.hasOwnProperty(this.H)) return Z[this.H];
  };
  We.prototype.write = function (a) {
    Z[this.H] = a;
    return !0;
  };
  We.prototype.clear = function () {
    delete Z[this.H];
  };
  var Z = {};
  We.iterate = function (a) {
    for (var b in Z) Z.hasOwnProperty(b) && a(b, Z[b]);
  };
  var Xe = 'https:' === window.location.protocol,
    Ye = Xe || 'http:' === window.location.protocol ? Te : We,
    Ze = function (a) {
      var b = a.substr(1),
        c = '',
        d = window.location.hostname;
      if ('' !== b) {
        c = parseInt(b, 10);
        if (isNaN(c)) return null;
        b = d.split('.');
        if (b.length < c - 1) return null;
        b.length == c - 1 && (d = '.' + d);
      } else d = '';
      return { l: 'S' == a.charAt(0), domain: d, o: c };
    },
    $e = function () {
      var a,
        b = null;
      Ye.iterate(function (c, d) {
        0 === c.indexOf('G_AUTHUSER_') &&
          ((c = Ze(c.substring(11))), !a || (c.l && !a.l) || (c.l == a.l && c.o > a.o)) &&
          ((a = c), (b = d));
      });
      return { la: a, L: b };
    };
  function af(a) {
    if (0 !== a.indexOf('GCSC')) return null;
    var b = { ca: !1 };
    a = a.substr(4);
    if (!a) return b;
    var c = a.charAt(0);
    a = a.substr(1);
    var d = a.lastIndexOf('_');
    if (-1 == d) return b;
    var e = Ze(a.substr(d + 1));
    if (null == e) return b;
    a = a.substring(0, d);
    if ('_' !== a.charAt(0)) return b;
    d = 'E' === c && e.l;
    return (!d && ('U' !== c || e.l)) || (d && !Xe) ? b : { ca: !0, l: d, va: a.substr(1), domain: e.domain, o: e.o };
  }
  var bf = function (a) {
      if (!a) return [];
      a = a.split('=');
      return a[1] ? a[1].split('|') : [];
    },
    cf = function (a) {
      a = a.split(':');
      return { clientId: a[0].split('=')[1], ta: bf(a[1]), xa: bf(a[2]), wa: bf(a[3]) };
    },
    df = function () {
      var a = $e(),
        b = a.la;
      a = a.L;
      if (null !== a) {
        var c;
        Ye.iterate(function (f, g) {
          (f = af(f)) && f.ca && f.l == b.l && f.o == b.o && (c = g);
        });
        if (c) {
          var d = cf(c),
            e = d && d.ta[Number(a)];
          d = d && d.clientId;
          if (e) return { L: a, sa: e, clientId: d };
        }
      }
      return null;
    };
  var ff = function () {
    this.Y = ef;
  };
  m = ff.prototype;
  m.ga = function () {
    this.O || ((this.A = 0), (this.O = !0), this.ea());
  };
  m.ea = function () {
    this.O &&
      (this.Y() ? (this.A = this.V) : (this.A = Math.min(2 * (this.A || this.V), 120)),
      window.setTimeout(qa(this.ea, this), 1e3 * this.A));
  };
  m.A = 0;
  m.V = 2;
  m.Y = null;
  m.O = !1;
  var gf = null;
  Sc = function () {
    return (M.oa = !0);
  };
  Tc = function () {
    M.oa = !0;
    var a = df();
    (a = a && a.L) && Jc('googleapis.config/sessionIndex', a);
    gf || (gf = B(M, 'ss', new ff()));
    a = gf;
    a.ga && a.ga();
  };
  var ef = function () {
    var a = df(),
      b = (a && a.sa) || null,
      c = a && a.clientId;
    Bc('auth', {
      callback: function () {
        var d = y.gapi.auth,
          e = { client_id: c, session_state: b };
        d.checkSessionState(e, function (f) {
          var g = e.session_state,
            k = !!S('isLoggedIn');
          f = S('debug/forceIm') ? !1 : (g && f) || (!g && !f);
          if ((k = k !== f))
            Jc('isLoggedIn', f), Tc(), re(), f || ((f = d.signOut) ? f() : (f = d.setToken) && f(null));
          f = Oc();
          var h = S('savedUserState');
          g = d._guss(f.cookiepolicy);
          h = h != g && 'undefined' != typeof h;
          Jc('savedUserState', g);
          (k || h) && Pc(f) && !S('disableRealtimeCallback') && d._pimf(f, !0);
        });
      },
    });
    return !0;
  };
  O.unshift([
    'url',
    function (a, b, c) {
      !a ||
        (b && '' !== b) ||
        !a.endsWith('.js') ||
        ((a = a.substring(0, a.length - 3)),
        (b = a.lastIndexOf('/') + 1),
        b >= a.length ||
          ((a = a
            .substr(b)
            .split(':')
            .filter(function (d) {
              return !['api', 'platform'].includes(d);
            })),
          (c.features = a)));
    },
  ]);
  N('bs0', !0, window.gapi._bs);
  N('bs1', !0);
  delete window.gapi._bs;
  window.gapi.load('', {
    callback: window['gapi_onload'],
    _c: {
      url: 'https://apis.google.com/js/platform.js',
      jsl: {
        ci: {
          'oauth-flow': {
            authUrl: 'https://accounts.google.com/o/oauth2/auth',
            proxyUrl: 'https://accounts.google.com/o/oauth2/postmessageRelay',
            disableOpt: !0,
            idpIframeUrl: 'https://accounts.google.com/o/oauth2/iframe',
            usegapi: !1,
          },
          debug: { reportExceptionRate: 1, forceIm: !1, rethrowException: !0, host: 'https://apis.google.com' },
          enableMultilogin: !0,
          'googleapis.config': {
            auth: { useFirstPartyAuthV2: !0 },
            root: 'https://content.googleapis.com',
            'root-1p': 'https://clients6.google.com',
          },
          inline: { css: 1 },
          disableRealtimeCallback: !1,
          drive_share: { skipInitCommand: !0 },
          csi: { rate: 0.01 },
          client: { cors: !1 },
          signInDeprecation: { rate: 0 },
          include_granted_scopes: !0,
          llang: 'en',
          iframes: {
            youtube: {
              params: { location: ['search', 'hash'] },
              url: ':socialhost:/:session_prefix:_/widget/render/youtube?usegapi=1',
              methods: ['scroll', 'openwindow'],
            },
            ytsubscribe: { url: 'https://www.youtube.com/subscribe_embed?usegapi=1' },
            plus_circle: {
              params: { url: '' },
              url: ':socialhost:/:session_prefix::se:_/widget/plus/circle?usegapi=1',
            },
            plus_share: {
              params: { url: '' },
              url: ':socialhost:/:session_prefix::se:_/+1/sharebutton?plusShare=true&usegapi=1',
            },
            rbr_s: {
              params: { url: '' },
              url: ':socialhost:/:session_prefix::se:_/widget/render/recobarsimplescroller',
            },
            ':source:': '3p',
            playemm: { url: 'https://play.google.com/work/embedded/search?usegapi=1&usegapi=1' },
            savetoandroidpay: { url: 'https://pay.google.com/gp/v/widget/save' },
            blogger: {
              params: { location: ['search', 'hash'] },
              url: ':socialhost:/:session_prefix:_/widget/render/blogger?usegapi=1',
              methods: ['scroll', 'openwindow'],
            },
            evwidget: { params: { url: '' }, url: ':socialhost:/:session_prefix:_/events/widget?usegapi=1' },
            partnersbadge: { url: 'https://www.gstatic.com/partners/badge/templates/badge.html?usegapi=1' },
            dataconnector: { url: 'https://dataconnector.corp.google.com/:session_prefix:ui/widgetview?usegapi=1' },
            surveyoptin: { url: 'https://www.google.com/shopping/customerreviews/optin?usegapi=1' },
            ':socialhost:': 'https://apis.google.com',
            shortlists: { url: '' },
            hangout: { url: 'https://talkgadget.google.com/:session_prefix:talkgadget/_/widget' },
            plus_followers: { params: { url: '' }, url: ':socialhost:/_/im/_/widget/render/plus/followers?usegapi=1' },
            post: {
              params: { url: '' },
              url: ':socialhost:/:session_prefix::im_prefix:_/widget/render/post?usegapi=1',
            },
            signin: {
              params: { url: '' },
              url: ':socialhost:/:session_prefix:_/widget/render/signin?usegapi=1',
              methods: ['onauth'],
            },
            rbr_i: { params: { url: '' }, url: ':socialhost:/:session_prefix::se:_/widget/render/recobarinvitation' },
            share: { url: ':socialhost:/:session_prefix::im_prefix:_/widget/render/share?usegapi=1' },
            plusone: {
              params: { count: '', size: '', url: '' },
              url: ':socialhost:/:session_prefix::se:_/+1/fastbutton?usegapi=1',
            },
            comments: {
              params: { location: ['search', 'hash'] },
              url: ':socialhost:/:session_prefix:_/widget/render/comments?usegapi=1',
              methods: ['scroll', 'openwindow'],
            },
            ':im_socialhost:': 'https://plus.googleapis.com',
            backdrop: { url: 'https://clients3.google.com/cast/chromecast/home/widget/backdrop?usegapi=1' },
            visibility: {
              params: { url: '' },
              url: ':socialhost:/:session_prefix:_/widget/render/visibility?usegapi=1',
            },
            autocomplete: { params: { url: '' }, url: ':socialhost:/:session_prefix:_/widget/render/autocomplete' },
            ':signuphost:': 'https://plus.google.com',
            ratingbadge: { url: 'https://www.google.com/shopping/customerreviews/badge?usegapi=1' },
            appcirclepicker: { url: ':socialhost:/:session_prefix:_/widget/render/appcirclepicker' },
            follow: { url: ':socialhost:/:session_prefix:_/widget/render/follow?usegapi=1' },
            community: { url: ':ctx_socialhost:/:session_prefix::im_prefix:_/widget/render/community?usegapi=1' },
            sharetoclassroom: { url: 'https://classroom.google.com/sharewidget?usegapi=1' },
            ytshare: { params: { url: '' }, url: ':socialhost:/:session_prefix:_/widget/render/ytshare?usegapi=1' },
            plus: { url: ':socialhost:/:session_prefix:_/widget/render/badge?usegapi=1' },
            family_creation: {
              params: { url: '' },
              url: 'https://families.google.com/webcreation?usegapi=1&usegapi=1',
            },
            commentcount: { url: ':socialhost:/:session_prefix:_/widget/render/commentcount?usegapi=1' },
            configurator: { url: ':socialhost:/:session_prefix:_/plusbuttonconfigurator?usegapi=1' },
            zoomableimage: { url: 'https://ssl.gstatic.com/microscope/embed/' },
            appfinder: { url: 'https://workspace.google.com/:session_prefix:marketplace/appfinder?usegapi=1' },
            savetowallet: { url: 'https://pay.google.com/gp/v/widget/save' },
            person: { url: ':socialhost:/:session_prefix:_/widget/render/person?usegapi=1' },
            savetodrive: { url: 'https://drive.google.com/savetodrivebutton?usegapi=1', methods: ['save'] },
            page: { url: ':socialhost:/:session_prefix:_/widget/render/page?usegapi=1' },
            card: { url: ':socialhost:/:session_prefix:_/hovercard/card' },
          },
        },
        h: 'm;/_/scs/abc-static/_/js/k=gapi.lb.en.AMZ27oQJoUI.O/d=1/rs=AHpOoo9dsXwz2g0gTMdQFEKa7ZoVvtQf4g/m=__features__',
        u: 'https://apis.google.com/js/platform.js',
        hee: !0,
        dpo: !1,
        le: ['scs'],
        glrp: false,
      },
      platform:
        'backdrop blogger comments commentcount community donation family_creation follow hangout health page partnersbadge person playemm playreview plus plusone post ratingbadge savetoandroidpay savetodrive savetowallet sharetoclassroom shortlists signin2 surveyoptin visibility youtube ytsubscribe zoomableimage'.split(
          ' '
        ),
      annotation: ['interactivepost', 'recobar', 'signin2', 'autocomplete'],
    },
  });
}.call(this));
