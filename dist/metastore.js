;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Metastore = factory();
  }
}(this, function() {
/*!
  * @preserve Qwery - A selector engine
  * https://github.com/ded/qwery
  * (c) Dustin Diaz 2014 | License MIT
  */

(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
})('qwery', this, function () {

  var classOnly = /^\.([\w\-]+)$/
    , doc = document
    , win = window
    , html = doc.documentElement
    , nodeType = 'nodeType'
  var isAncestor = 'compareDocumentPosition' in html ?
    function (element, container) {
      return (container.compareDocumentPosition(element) & 16) == 16
    } :
    function (element, container) {
      container = container == doc || container == window ? html : container
      return container !== element && container.contains(element)
    }

  function toArray(ar) {
    return [].slice.call(ar, 0)
  }

  function isNode(el) {
    var t
    return el && typeof el === 'object' && (t = el.nodeType) && (t == 1 || t == 9)
  }

  function arrayLike(o) {
    return (typeof o === 'object' && isFinite(o.length))
  }

  function flatten(ar) {
    for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
    return r
  }

  function uniq(ar) {
    var a = [], i, j
    label:
    for (i = 0; i < ar.length; i++) {
      for (j = 0; j < a.length; j++) {
        if (a[j] == ar[i]) {
          continue label
        }
      }
      a[a.length] = ar[i]
    }
    return a
  }


  function normalizeRoot(root) {
    if (!root) return doc
    if (typeof root == 'string') return qwery(root)[0]
    if (!root[nodeType] && arrayLike(root)) return root[0]
    return root
  }

  /**
   * @param {string|Array.<Element>|Element|Node} selector
   * @param {string|Array.<Element>|Element|Node=} opt_root
   * @return {Array.<Element>}
   */
  function qwery(selector, opt_root) {
    var m, root = normalizeRoot(opt_root)
    if (!root || !selector) return []
    if (selector === win || isNode(selector)) {
      return !opt_root || (selector !== win && isNode(root) && isAncestor(selector, root)) ? [selector] : []
    }
    if (selector && arrayLike(selector)) return flatten(selector)


    if (doc.getElementsByClassName && selector == 'string' && (m = selector.match(classOnly))) {
      return toArray((root).getElementsByClassName(m[1]))
    }
    // using duck typing for 'a' window or 'a' document (not 'the' window || document)
    if (selector && (selector.document || (selector.nodeType && selector.nodeType == 9))) {
      return !opt_root ? [selector] : []
    }
    return toArray((root).querySelectorAll(selector))
  }

  qwery.uniq = uniq

  return qwery
}, this);

/*!
  * Bonzo: DOM Utility (c) Dustin Diaz 2012
  * https://github.com/ded/bonzo
  * License MIT
  */
(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
})('bonzo', this, function() {
  var win = window
    , doc = win.document
    , html = doc.documentElement
    , parentNode = 'parentNode'
    , specialAttributes = /^(checked|value|selected|disabled)$/i
      // tags that we have trouble inserting *into*
    , specialTags = /^(select|fieldset|table|tbody|tfoot|td|tr|colgroup)$/i
    , simpleScriptTagRe = /\s*<script +src=['"]([^'"]+)['"]>/
    , table = ['<table>', '</table>', 1]
    , td = ['<table><tbody><tr>', '</tr></tbody></table>', 3]
    , option = ['<select>', '</select>', 1]
    , noscope = ['_', '', 0, 1]
    , tagMap = { // tags that we have trouble *inserting*
          thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
        , tr: ['<table><tbody>', '</tbody></table>', 2]
        , th: td , td: td
        , col: ['<table><colgroup>', '</colgroup></table>', 2]
        , fieldset: ['<form>', '</form>', 1]
        , legend: ['<form><fieldset>', '</fieldset></form>', 2]
        , option: option, optgroup: option
        , script: noscope, style: noscope, link: noscope, param: noscope, base: noscope
      }
    , stateAttributes = /^(checked|selected|disabled)$/
    , hasClass, addClass, removeClass
    , uidMap = {}
    , uuids = 0
    , digit = /^-?[\d\.]+$/
    , dattr = /^data-(.+)$/
    , px = 'px'
    , setAttribute = 'setAttribute'
    , getAttribute = 'getAttribute'
    , features = function() {
        var e = doc.createElement('p')
        return {
          transform: function () {
            var props = ['transform', 'webkitTransform', 'MozTransform', 'OTransform', 'msTransform'], i
            for (i = 0; i < props.length; i++) {
              if (props[i] in e.style) return props[i]
            }
          }()
        , classList: 'classList' in e
        }
      }()
    , whitespaceRegex = /\s+/
    , toString = String.prototype.toString
    , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, boxFlex: 1, WebkitBoxFlex: 1, MozBoxFlex: 1 }
    , query = doc.querySelectorAll && function (selector) { return doc.querySelectorAll(selector) }


  function getStyle(el, property) {
    var value = null
      , computed = doc.defaultView.getComputedStyle(el, '')
    computed && (value = computed[property])
    return el.style[property] || value
  }


  function isNode(node) {
    return node && node.nodeName && (node.nodeType == 1 || node.nodeType == 11)
  }


  function normalize(node, host, clone) {
    var i, l, ret
    if (typeof node == 'string') return bonzo.create(node)
    if (isNode(node)) node = [ node ]
    if (clone) {
      ret = [] // don't change original array
      for (i = 0, l = node.length; i < l; i++) ret[i] = cloneNode(host, node[i])
      return ret
    }
    return node
  }

  /**
   * @param {string} c a class name to test
   * @return {boolean}
   */
  function classReg(c) {
    return new RegExp('(^|\\s+)' + c + '(\\s+|$)')
  }


  /**
   * @param {Bonzo|Array} ar
   * @param {function(Object, number, (Bonzo|Array))} fn
   * @param {Object=} opt_scope
   * @param {boolean=} opt_rev
   * @return {Bonzo|Array}
   */
  function each(ar, fn, opt_scope, opt_rev) {
    var ind, i = 0, l = ar.length
    for (; i < l; i++) {
      ind = opt_rev ? ar.length - i - 1 : i
      fn.call(opt_scope || ar[ind], ar[ind], ind, ar)
    }
    return ar
  }


  /**
   * @param {Bonzo|Array} ar
   * @param {function(Object, number, (Bonzo|Array))} fn
   * @param {Object=} opt_scope
   * @return {Bonzo|Array}
   */
  function deepEach(ar, fn, opt_scope) {
    for (var i = 0, l = ar.length; i < l; i++) {
      if (isNode(ar[i])) {
        deepEach(ar[i].childNodes, fn, opt_scope)
        fn.call(opt_scope || ar[i], ar[i], i, ar)
      }
    }
    return ar
  }


  /**
   * @param {string} s
   * @return {string}
   */
  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase()
    })
  }


  /**
   * @param {string} s
   * @return {string}
   */
  function decamelize(s) {
    return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
  }


  /**
   * @param {Element} el
   * @return {*}
   */
  function data(el) {
    el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
    var uid = el[getAttribute]('data-node-uid')
    return uidMap[uid] || (uidMap[uid] = {})
  }


  /**
   * removes the data associated with an element
   * @param {Element} el
   */
  function clearData(el) {
    var uid = el[getAttribute]('data-node-uid')
    if (uid) delete uidMap[uid]
  }


  function dataValue(d) {
    var f
    try {
      return (d === null || d === undefined) ? undefined :
        d === 'true' ? true :
          d === 'false' ? false :
            d === 'null' ? null :
              (f = parseFloat(d)) == d ? f : d;
    } catch(e) {}
    return undefined
  }


  /**
   * @param {Bonzo|Array} ar
   * @param {function(Object, number, (Bonzo|Array))} fn
   * @param {Object=} opt_scope
   * @return {boolean} whether `some`thing was found
   */
  function some(ar, fn, opt_scope) {
    for (var i = 0, j = ar.length; i < j; ++i) if (fn.call(opt_scope || null, ar[i], i, ar)) return true
    return false
  }


  /**
   * this could be a giant enum of CSS properties
   * but in favor of file size sans-closure deadcode optimizations
   * we're just asking for any ol string
   * then it gets transformed into the appropriate style property for JS access
   * @param {string} p
   * @return {string}
   */
  function styleProperty(p) {
      (p == 'transform' && (p = features.transform)) ||
        (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + 'Origin'))
      return p ? camelize(p) : null
  }

  // this insert method is intense
  function insert(target, host, fn, rev) {
    var i = 0, self = host || this, r = []
      // target nodes could be a css selector if it's a string and a selector engine is present
      // otherwise, just use target
      , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
    // normalize each node in case it's still a string and we need to create nodes on the fly
    each(normalize(nodes), function (t, j) {
      each(self, function (el) {
        fn(t, r[i++] = j > 0 ? cloneNode(self, el) : el)
      }, null, rev)
    }, this, rev)
    self.length = i
    each(r, function (e) {
      self[--i] = e
    }, null, !rev)
    return self
  }


  /**
   * sets an element to an explicit x/y position on the page
   * @param {Element} el
   * @param {?number} x
   * @param {?number} y
   */
  function xy(el, x, y) {
    var $el = bonzo(el)
      , style = $el.css('position')
      , offset = $el.offset()
      , rel = 'relative'
      , isRel = style == rel
      , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]

    if (style == 'static') {
      $el.css('position', rel)
      style = rel
    }

    isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
    isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)

    x != null && (el.style.left = x - offset.left + delta[0] + px)
    y != null && (el.style.top = y - offset.top + delta[1] + px)

  }

  // classList support for class management
  // altho to be fair, the api sucks because it won't accept multiple classes at once
  if (features.classList) {
    hasClass = function (el, c) {
      return el.classList.contains(c)
    }
    addClass = function (el, c) {
      el.classList.add(c)
    }
    removeClass = function (el, c) {
      el.classList.remove(c)
    }
  }
  else {
    hasClass = function (el, c) {
      return classReg(c).test(el.className)
    }
    addClass = function (el, c) {
      el.className = (el.className + ' ' + c).trim()
    }
    removeClass = function (el, c) {
      el.className = (el.className.replace(classReg(c), ' ')).trim()
    }
  }


  /**
   * this allows method calling for setting values
   *
   * @example
   * bonzo(elements).css('color', function (el) {
   *   return el.getAttribute('data-original-color')
   * })
   *
   * @param {Element} el
   * @param {function (Element)|string} v
   * @return {string}
   */
  function setter(el, v) {
    return typeof v == 'function' ? v.call(el, el) : v
  }

  function scroll(x, y, type) {
    var el = this[0]
    if (!el) return this
    if (x == null && y == null) {
      return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
    }
    if (isBody(el)) {
      win.scrollTo(x, y)
    } else {
      x != null && (el.scrollLeft = x)
      y != null && (el.scrollTop = y)
    }
    return this
  }

  /**
   * @constructor
   * @param {Array.<Element>|Element|Node|string} elements
   */
  function Bonzo(elements) {
    this.length = 0
    if (elements) {
      elements = typeof elements !== 'string' &&
        !elements.nodeType &&
        typeof elements.length !== 'undefined' ?
          elements :
          [elements]
      this.length = elements.length
      for (var i = 0; i < elements.length; i++) this[i] = elements[i]
    }
  }

  Bonzo.prototype = {

      /**
       * @param {number} index
       * @return {Element|Node}
       */
      get: function (index) {
        return this[index] || null
      }

      // itetators
      /**
       * @param {function(Element|Node)} fn
       * @param {Object=} opt_scope
       * @return {Bonzo}
       */
    , each: function (fn, opt_scope) {
        return each(this, fn, opt_scope)
      }

      /**
       * @param {Function} fn
       * @param {Object=} opt_scope
       * @return {Bonzo}
       */
    , deepEach: function (fn, opt_scope) {
        return deepEach(this, fn, opt_scope)
      }


      /**
       * @param {Function} fn
       * @param {Function=} opt_reject
       * @return {Array}
       */
    , map: function (fn, opt_reject) {
        var m = [], n, i
        for (i = 0; i < this.length; i++) {
          n = fn.call(this, this[i], i)
          opt_reject ? (opt_reject(n) && m.push(n)) : m.push(n)
        }
        return m
      }

    // text and html inserters!

    /**
     * @param {string} h the HTML to insert
     * @param {boolean=} opt_text whether to set or get text content
     * @return {Bonzo|string}
     */
    , html: function (h, opt_text) {
        var method = opt_text
              ? 'textContent'
              : 'innerHTML'
          , that = this
          , append = function (el, i) {
              each(normalize(h, that, i), function (node) {
                el.appendChild(node)
              })
            }
          , updateElement = function (el, i) {
              try {
                if (opt_text || (typeof h == 'string' && !specialTags.test(el.tagName))) {
                  return el[method] = h
                }
              } catch (e) {}
              append(el, i)
            }
        return typeof h != 'undefined'
          ? this.empty().each(updateElement)
          : this[0] ? this[0][method] : ''
      }

      /**
       * @param {string=} opt_text the text to set, otherwise this is a getter
       * @return {Bonzo|string}
       */
    , text: function (opt_text) {
        return this.html(opt_text, true)
      }

      // more related insertion methods

      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , append: function (node) {
        var that = this
        return this.each(function (el, i) {
          each(normalize(node, that, i), function (i) {
            el.appendChild(i)
          })
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , prepend: function (node) {
        var that = this
        return this.each(function (el, i) {
          var first = el.firstChild
          each(normalize(node, that, i), function (i) {
            el.insertBefore(i, first)
          })
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , appendTo: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          t.appendChild(el)
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , prependTo: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          t.insertBefore(el, t.firstChild)
        }, 1)
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , before: function (node) {
        var that = this
        return this.each(function (el, i) {
          each(normalize(node, that, i), function (i) {
            el[parentNode].insertBefore(i, el)
          })
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , after: function (node) {
        var that = this
        return this.each(function (el, i) {
          each(normalize(node, that, i), function (i) {
            el[parentNode].insertBefore(i, el.nextSibling)
          }, null, 1)
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , insertBefore: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          t[parentNode].insertBefore(el, t)
        })
      }


      /**
       * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , insertAfter: function (target, opt_host) {
        return insert.call(this, target, opt_host, function (t, el) {
          var sibling = t.nextSibling
          sibling ?
            t[parentNode].insertBefore(el, sibling) :
            t[parentNode].appendChild(el)
        }, 1)
      }


      /**
       * @param {Bonzo|string|Element|Array} node
       * @return {Bonzo}
       */
    , replaceWith: function (node) {
        var that = this
        return this.each(function (el, i) {
          each(normalize(node, that, i), function (i) {
            el[parentNode] && el[parentNode].replaceChild(i, el)
          })
        })
      }

      /**
       * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
       * @return {Bonzo}
       */
    , clone: function (opt_host) {
        var ret = [] // don't change original array
          , l, i
        for (i = 0, l = this.length; i < l; i++) ret[i] = cloneNode(opt_host || this, this[i])
        return bonzo(ret)
      }

      // class management

      /**
       * @param {string} c
       * @return {Bonzo}
       */
    , addClass: function (c) {
        c = toString.call(c).split(whitespaceRegex)
        return this.each(function (el) {
          // we `each` here so you can do $el.addClass('foo bar')
          each(c, function (c) {
            if (c && !hasClass(el, setter(el, c)))
              addClass(el, setter(el, c))
          })
        })
      }


      /**
       * @param {string} c
       * @return {Bonzo}
       */
    , removeClass: function (c) {
        c = toString.call(c).split(whitespaceRegex)
        return this.each(function (el) {
          each(c, function (c) {
            if (c && hasClass(el, setter(el, c)))
              removeClass(el, setter(el, c))
          })
        })
      }


      /**
       * @param {string} c
       * @return {boolean}
       */
    , hasClass: function (c) {
        c = toString.call(c).split(whitespaceRegex)
        return some(this, function (el) {
          return some(c, function (c) {
            return c && hasClass(el, c)
          })
        })
      }


      /**
       * @param {string} c classname to toggle
       * @param {boolean=} opt_condition whether to add or remove the class straight away
       * @return {Bonzo}
       */
    , toggleClass: function (c, opt_condition) {
        c = toString.call(c).split(whitespaceRegex)
        return this.each(function (el) {
          each(c, function (c) {
            if (c) {
              typeof opt_condition !== 'undefined' ?
                opt_condition ? !hasClass(el, c) && addClass(el, c) : removeClass(el, c) :
                hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
            }
          })
        })
      }

      // display togglers

      /**
       * @param {string=} opt_type useful to set back to anything other than an empty string
       * @return {Bonzo}
       */
    , show: function (opt_type) {
        opt_type = typeof opt_type == 'string' ? opt_type : ''
        return this.each(function (el) {
          el.style.display = opt_type
        })
      }


      /**
       * @return {Bonzo}
       */
    , hide: function () {
        return this.each(function (el) {
          el.style.display = 'none'
        })
      }


      /**
       * @param {Function=} opt_callback
       * @param {string=} opt_type
       * @return {Bonzo}
       */
    , toggle: function (opt_callback, opt_type) {
        opt_type = typeof opt_type == 'string' ? opt_type : '';
        typeof opt_callback != 'function' && (opt_callback = null)
        return this.each(function (el) {
          el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : opt_type;
          opt_callback && opt_callback.call(el)
        })
      }


      // DOM Walkers & getters

      /**
       * @return {Element|Node}
       */
    , first: function () {
        return bonzo(this.length ? this[0] : [])
      }


      /**
       * @return {Element|Node}
       */
    , last: function () {
        return bonzo(this.length ? this[this.length - 1] : [])
      }


      /**
       * @return {Element|Node}
       */
    , next: function () {
        return this.related('nextSibling')
      }


      /**
       * @return {Element|Node}
       */
    , previous: function () {
        return this.related('previousSibling')
      }


      /**
       * @return {Element|Node}
       */
    , parent: function() {
        return this.related(parentNode)
      }


      /**
       * @private
       * @param {string} method the directional DOM method
       * @return {Element|Node}
       */
    , related: function (method) {
        return bonzo(this.map(
          function (el) {
            el = el[method]
            while (el && el.nodeType !== 1) {
              el = el[method]
            }
            return el || 0
          },
          function (el) {
            return el
          }
        ))
      }


      /**
       * @return {Bonzo}
       */
    , focus: function () {
        this.length && this[0].focus()
        return this
      }


      /**
       * @return {Bonzo}
       */
    , blur: function () {
        this.length && this[0].blur()
        return this
      }

      // style getter setter & related methods

      /**
       * @param {Object|string} o
       * @param {string=} opt_v
       * @return {Bonzo|string}
       */
    , css: function (o, opt_v) {
        var p, iter = o
        // is this a request for just getting a style?
        if (opt_v === undefined && typeof o == 'string') {
          // repurpose 'v'
          opt_v = this[0]
          if (!opt_v) return null
          if (opt_v === doc || opt_v === win) {
            p = (opt_v === doc) ? bonzo.doc() : bonzo.viewport()
            return o == 'width' ? p.width : o == 'height' ? p.height : ''
          }
          return (o = styleProperty(o)) ? getStyle(opt_v, o) : null
        }

        if (typeof o == 'string') {
          iter = {}
          iter[o] = opt_v
        }

        function fn(el, p, v) {
          for (var k in iter) {
            if (iter.hasOwnProperty(k)) {
              v = iter[k];
              // change "5" to "5px" - unless you're line-height, which is allowed
              (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
              try { el.style[p] = setter(el, v) } catch(e) {}
            }
          }
        }
        return this.each(fn)
      }


      /**
       * @param {number=} opt_x
       * @param {number=} opt_y
       * @return {Bonzo|number}
       */
    , offset: function (opt_x, opt_y) {
        if (opt_x && typeof opt_x == 'object' && (typeof opt_x.top == 'number' || typeof opt_x.left == 'number')) {
          return this.each(function (el) {
            xy(el, opt_x.left, opt_x.top)
          })
        } else if (typeof opt_x == 'number' || typeof opt_y == 'number') {
          return this.each(function (el) {
            xy(el, opt_x, opt_y)
          })
        }
        if (!this[0]) return {
            top: 0
          , left: 0
          , height: 0
          , width: 0
        }
        var el = this[0]
          , de = el.ownerDocument.documentElement
          , bcr = el.getBoundingClientRect()
          , scroll = getWindowScroll()
          , width = el.offsetWidth
          , height = el.offsetHeight
          , top = bcr.top + scroll.y - Math.max(0, de && de.clientTop, doc.body.clientTop)
          , left = bcr.left + scroll.x - Math.max(0, de && de.clientLeft, doc.body.clientLeft)

        return {
            top: top
          , left: left
          , height: height
          , width: width
        }
      }


      /**
       * @return {number}
       */
    , dim: function () {
        if (!this.length) return { height: 0, width: 0 }
        var el = this[0]
          , de = el.nodeType == 9 && el.documentElement // document
          , orig = !de && !!el.style && !el.offsetWidth && !el.offsetHeight ?
             // el isn't visible, can't be measured properly, so fix that
             function (t) {
               var s = {
                   position: el.style.position || ''
                 , visibility: el.style.visibility || ''
                 , display: el.style.display || ''
               }
               t.first().css({
                   position: 'absolute'
                 , visibility: 'hidden'
                 , display: 'block'
               })
               return s
            }(this) : null
          , width = de
              ? Math.max(el.body.scrollWidth, el.body.offsetWidth, de.scrollWidth, de.offsetWidth, de.clientWidth)
              : el.offsetWidth
          , height = de
              ? Math.max(el.body.scrollHeight, el.body.offsetHeight, de.scrollHeight, de.offsetHeight, de.clientHeight)
              : el.offsetHeight

        orig && this.first().css(orig)
        return {
            height: height
          , width: width
        }
      }

      // attributes are hard. go shopping

      /**
       * @param {string} k an attribute to get or set
       * @param {string=} opt_v the value to set
       * @return {Bonzo|string}
       */
    , attr: function (k, opt_v) {
        var el = this[0]
          , n

        if (typeof k != 'string' && !(k instanceof String)) {
          for (n in k) {
            k.hasOwnProperty(n) && this.attr(n, k[n])
          }
          return this
        }

        return typeof opt_v == 'undefined' ?
          !el ? null : specialAttributes.test(k) ?
            stateAttributes.test(k) && typeof el[k] == 'string' ?
              true : el[k] :  el[getAttribute](k) :
          this.each(function (el) {
            specialAttributes.test(k) ? (el[k] = setter(el, opt_v)) : el[setAttribute](k, setter(el, opt_v))
          })
      }


      /**
       * @param {string} k
       * @return {Bonzo}
       */
    , removeAttr: function (k) {
        return this.each(function (el) {
          stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
        })
      }


      /**
       * @param {string=} opt_s
       * @return {Bonzo|string}
       */
    , val: function (s) {
        return (typeof s == 'string' || typeof s == 'number') ?
          this.attr('value', s) :
          this.length ? this[0].value : null
      }

      // use with care and knowledge. this data() method uses data attributes on the DOM nodes
      // to do this differently costs a lot more code. c'est la vie
      /**
       * @param {string|Object=} opt_k the key for which to get or set data
       * @param {Object=} opt_v
       * @return {Bonzo|Object}
       */
    , data: function (opt_k, opt_v) {
        var el = this[0], o, m
        if (typeof opt_v === 'undefined') {
          if (!el) return null
          o = data(el)
          if (typeof opt_k === 'undefined') {
            each(el.attributes, function (a) {
              (m = ('' + a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
            })
            return o
          } else {
            if (typeof o[opt_k] === 'undefined')
              o[opt_k] = dataValue(this.attr('data-' + decamelize(opt_k)))
            return o[opt_k]
          }
        } else {
          return this.each(function (el) { data(el)[opt_k] = opt_v })
        }
      }

      // DOM detachment & related

      /**
       * @return {Bonzo}
       */
    , remove: function () {
        this.deepEach(clearData)
        return this.detach()
      }


      /**
       * @return {Bonzo}
       */
    , empty: function () {
        return this.each(function (el) {
          deepEach(el.childNodes, clearData)

          while (el.firstChild) {
            el.removeChild(el.firstChild)
          }
        })
      }


      /**
       * @return {Bonzo}
       */
    , detach: function () {
        return this.each(function (el) {
          el[parentNode] && el[parentNode].removeChild(el)
        })
      }

      // who uses a mouse anyway? oh right.

      /**
       * @param {number} y
       */
    , scrollTop: function (y) {
        return scroll.call(this, null, y, 'y')
      }


      /**
       * @param {number} x
       */
    , scrollLeft: function (x) {
        return scroll.call(this, x, null, 'x')
      }

  }


  function cloneNode(host, el) {
    var c = el.cloneNode(true)
      , cloneElems
      , elElems
      , i

    // check for existence of an event cloner
    // preferably https://github.com/fat/bean
    // otherwise Bonzo won't do this for you
    if (host.$ && typeof host.cloneEvents == 'function') {
      host.$(c).cloneEvents(el)

      // clone events from every child node
      cloneElems = host.$(c).find('*')
      elElems = host.$(el).find('*')

      for (i = 0; i < elElems.length; i++)
        host.$(cloneElems[i]).cloneEvents(elElems[i])
    }
    return c
  }

  function isBody(element) {
    return element === win || (/^(?:body|html)$/i).test(element.tagName)
  }

  function getWindowScroll() {
    return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
  }

  function createScriptFromHtml(html) {
    var scriptEl = document.createElement('script')
      , matches = html.match(simpleScriptTagRe)
    scriptEl.src = matches[1]
    return scriptEl
  }

  /**
   * @param {Array.<Element>|Element|Node|string} els
   * @return {Bonzo}
   */
  function bonzo(els) {
    return new Bonzo(els)
  }

  bonzo.setQueryEngine = function (q) {
    query = q;
    delete bonzo.setQueryEngine
  }

  bonzo.aug = function (o, target) {
    // for those standalone bonzo users. this love is for you.
    for (var k in o) {
      o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
    }
  }

  bonzo.create = function (node) {
    // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
    return typeof node == 'string' && node !== '' ?
      function () {
        if (simpleScriptTagRe.test(node)) return [createScriptFromHtml(node)]
        var tag = node.match(/^\s*<([^\s>]+)/)
          , el = doc.createElement('div')
          , els = []
          , p = tag ? tagMap[tag[1].toLowerCase()] : null
          , dep = p ? p[2] + 1 : 1
          , ns = p && p[3]
          , pn = parentNode

        el.innerHTML = p ? (p[0] + node + p[1]) : node
        while (dep--) el = el.firstChild
        // for IE NoScope, we may insert cruft at the begining just to get it to work
        if (ns && el && el.nodeType !== 1) el = el.nextSibling
        do {
          if (!tag || el.nodeType == 1) {
            els.push(el)
          }
        } while (el = el.nextSibling)
        // IE < 9 gives us a parentNode which messes up insert() check for cloning
        // `dep` > 1 can also cause problems with the insert() check (must do this last)
        each(els, function(el) { el[pn] && el[pn].removeChild(el) })
        return els
      }() : isNode(node) ? [node.cloneNode(true)] : []
  }

  bonzo.doc = function () {
    var vp = bonzo.viewport()
    return {
        width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
      , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
    }
  }

  bonzo.firstChild = function (el) {
    for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
      if (c[i].nodeType === 1) e = c[j = i]
    }
    return e
  }

  bonzo.viewport = function () {
    return {
        width: win.innerWidth
      , height: win.innerHeight
    }
  }

  bonzo.isAncestor = 'compareDocumentPosition' in html ?
    function (container, element) {
      return (container.compareDocumentPosition(element) & 16) == 16
    } :
    function (container, element) {
      return container !== element && container.contains(element);
    }

  return bonzo
}); // the only line we care about using a semi-colon. placed here for concatenation tools

/*!
  * Bean - copyright (c) Jacob Thornton 2011-2012
  * https://github.com/fat/bean
  * MIT license
  */
(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
})('bean', this, function (name, context) {
  name    = name    || 'bean'
  context = context || this

  var win            = window
    , old            = context[name]
    , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
    , nameRegex      = /\..*/
    , addEvent       = 'addEventListener'
    , removeEvent    = 'removeEventListener'
    , doc            = document || {}
    , root           = doc.documentElement || {}
    , W3C_MODEL      = root[addEvent]
    , eventSupport   = W3C_MODEL ? addEvent : 'attachEvent'
    , ONE            = {} // singleton for quick matching making add() do one()

    , slice          = Array.prototype.slice
    , str2arr        = function (s, d) { return s.split(d || ' ') }
    , isString       = function (o) { return typeof o == 'string' }
    , isFunction     = function (o) { return typeof o == 'function' }

      // events that we consider to be 'native', anything not in this list will
      // be treated as a custom event
    , standardNativeEvents =
        'click dblclick mouseup mousedown contextmenu '                  + // mouse buttons
        'mousewheel mousemultiwheel DOMMouseScroll '                     + // mouse wheel
        'mouseover mouseout mousemove selectstart selectend '            + // mouse movement
        'keydown keypress keyup '                                        + // keyboard
        'orientationchange '                                             + // mobile
        'focus blur change reset select submit '                         + // form elements
        'load unload beforeunload resize move DOMContentLoaded '         + // window
        'readystatechange message '                                      + // window
        'error abort scroll '                                              // misc
      // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
      // that doesn't actually exist, so make sure we only do these on newer browsers
    , w3cNativeEvents =
        'show '                                                          + // mouse buttons
        'input invalid '                                                 + // form elements
        'touchstart touchmove touchend touchcancel '                     + // touch
        'gesturestart gesturechange gestureend '                         + // gesture
        'textinput '                                                     + // TextEvent
        'readystatechange pageshow pagehide popstate '                   + // window
        'hashchange offline online '                                     + // window
        'afterprint beforeprint '                                        + // printing
        'dragstart dragenter dragover dragleave drag drop dragend '      + // dnd
        'loadstart progress suspend emptied stalled loadmetadata '       + // media
        'loadeddata canplay canplaythrough playing waiting seeking '     + // media
        'seeked ended durationchange timeupdate play pause ratechange '  + // media
        'volumechange cuechange '                                        + // media
        'checking noupdate downloading cached updateready obsolete '       // appcache

      // convert to a hash for quick lookups
    , nativeEvents = (function (hash, events, i) {
        for (i = 0; i < events.length; i++) events[i] && (hash[events[i]] = 1)
        return hash
      }({}, str2arr(standardNativeEvents + (W3C_MODEL ? w3cNativeEvents : ''))))

      // custom events are events that we *fake*, they are not provided natively but
      // we can use native events to generate them
    , customEvents = (function () {
        var isAncestor = 'compareDocumentPosition' in root
              ? function (element, container) {
                  return container.compareDocumentPosition && (container.compareDocumentPosition(element) & 16) === 16
                }
              : 'contains' in root
                ? function (element, container) {
                    container = container.nodeType === 9 || container === window ? root : container
                    return container !== element && container.contains(element)
                  }
                : function (element, container) {
                    while (element = element.parentNode) if (element === container) return 1
                    return 0
                  }
          , check = function (event) {
              var related = event.relatedTarget
              return !related
                ? related == null
                : (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString())
                    && !isAncestor(related, this))
            }

        return {
            mouseenter: { base: 'mouseover', condition: check }
          , mouseleave: { base: 'mouseout', condition: check }
          , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
        }
      }())

      // we provide a consistent Event object across browsers by taking the actual DOM
      // event object and generating a new one from its properties.
    , Event = (function () {
            // a whitelist of properties (for different event types) tells us what to check for and copy
        var commonProps  = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget ' +
              'detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey '  +
              'srcElement target timeStamp type view which propertyName')
          , mouseProps   = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer '      +
              'fromElement offsetX offsetY pageX pageY screenX screenY toElement'))
          , mouseWheelProps = mouseProps.concat(str2arr('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ ' +
              'axis')) // 'axis' is FF specific
          , keyProps     = commonProps.concat(str2arr('char charCode key keyCode keyIdentifier '          +
              'keyLocation location'))
          , textProps    = commonProps.concat(str2arr('data'))
          , touchProps   = commonProps.concat(str2arr('touches targetTouches changedTouches scale rotation'))
          , messageProps = commonProps.concat(str2arr('data origin source'))
          , stateProps   = commonProps.concat(str2arr('state'))
          , overOutRegex = /over|out/
            // some event types need special handling and some need special properties, do that all here
          , typeFixers   = [
                { // key events
                    reg: /key/i
                  , fix: function (event, newEvent) {
                      newEvent.keyCode = event.keyCode || event.which
                      return keyProps
                    }
                }
              , { // mouse events
                    reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
                  , fix: function (event, newEvent, type) {
                      newEvent.rightClick = event.which === 3 || event.button === 2
                      newEvent.pos = { x: 0, y: 0 }
                      if (event.pageX || event.pageY) {
                        newEvent.clientX = event.pageX
                        newEvent.clientY = event.pageY
                      } else if (event.clientX || event.clientY) {
                        newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                        newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
                      }
                      if (overOutRegex.test(type)) {
                        newEvent.relatedTarget = event.relatedTarget
                          || event[(type == 'mouseover' ? 'from' : 'to') + 'Element']
                      }
                      return mouseProps
                    }
                }
              , { // mouse wheel events
                    reg: /mouse.*(wheel|scroll)/i
                  , fix: function () { return mouseWheelProps }
                }
              , { // TextEvent
                    reg: /^text/i
                  , fix: function () { return textProps }
                }
              , { // touch and gesture events
                    reg: /^touch|^gesture/i
                  , fix: function () { return touchProps }
                }
              , { // message events
                    reg: /^message$/i
                  , fix: function () { return messageProps }
                }
              , { // popstate events
                    reg: /^popstate$/i
                  , fix: function () { return stateProps }
                }
              , { // everything else
                    reg: /.*/
                  , fix: function () { return commonProps }
                }
            ]
          , typeFixerMap = {} // used to map event types to fixer functions (above), a basic cache mechanism

          , Event = function (event, element, isNative) {
              if (!arguments.length) return
              event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event
              this.originalEvent = event
              this.isNative       = isNative
              this.isBean         = true

              if (!event) return

              var type   = event.type
                , target = event.target || event.srcElement
                , i, l, p, props, fixer

              this.target = target && target.nodeType === 3 ? target.parentNode : target

              if (isNative) { // we only need basic augmentation on custom events, the rest expensive & pointless
                fixer = typeFixerMap[type]
                if (!fixer) { // haven't encountered this event type before, map a fixer function for it
                  for (i = 0, l = typeFixers.length; i < l; i++) {
                    if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
                      typeFixerMap[type] = fixer = typeFixers[i].fix
                      break
                    }
                  }
                }

                props = fixer(event, this, type)
                for (i = props.length; i--;) {
                  if (!((p = props[i]) in this) && p in event) this[p] = event[p]
                }
              }
            }

        // preventDefault() and stopPropagation() are a consistent interface to those functions
        // on the DOM, stop() is an alias for both of them together
        Event.prototype.preventDefault = function () {
          if (this.originalEvent.preventDefault) this.originalEvent.preventDefault()
          else this.originalEvent.returnValue = false
        }
        Event.prototype.stopPropagation = function () {
          if (this.originalEvent.stopPropagation) this.originalEvent.stopPropagation()
          else this.originalEvent.cancelBubble = true
        }
        Event.prototype.stop = function () {
          this.preventDefault()
          this.stopPropagation()
          this.stopped = true
        }
        // stopImmediatePropagation() has to be handled internally because we manage the event list for
        // each element
        // note that originalElement may be a Bean#Event object in some situations
        Event.prototype.stopImmediatePropagation = function () {
          if (this.originalEvent.stopImmediatePropagation) this.originalEvent.stopImmediatePropagation()
          this.isImmediatePropagationStopped = function () { return true }
        }
        Event.prototype.isImmediatePropagationStopped = function () {
          return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
        }
        Event.prototype.clone = function (currentTarget) {
          //TODO: this is ripe for optimisation, new events are *expensive*
          // improving this will speed up delegated events
          var ne = new Event(this, this.element, this.isNative)
          ne.currentTarget = currentTarget
          return ne
        }

        return Event
      }())

      // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
    , targetElement = function (element, isNative) {
        return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
      }

      /**
        * Bean maintains an internal registry for event listeners. We don't touch elements, objects
        * or functions to identify them, instead we store everything in the registry.
        * Each event listener has a RegEntry object, we have one 'registry' for the whole instance.
        */
    , RegEntry = (function () {
        // each handler is wrapped so we can handle delegation and custom events
        var wrappedHandler = function (element, fn, condition, args) {
            var call = function (event, eargs) {
                  return fn.apply(element, args ? slice.call(eargs, event ? 0 : 1).concat(args) : eargs)
                }
              , findTarget = function (event, eventElement) {
                  return fn.__beanDel ? fn.__beanDel.ft(event.target, element) : eventElement
                }
              , handler = condition
                  ? function (event) {
                      var target = findTarget(event, this) // deleated event
                      if (condition.apply(target, arguments)) {
                        if (event) event.currentTarget = target
                        return call(event, arguments)
                      }
                    }
                  : function (event) {
                      if (fn.__beanDel) event = event.clone(findTarget(event)) // delegated event, fix the fix
                      return call(event, arguments)
                    }
            handler.__beanDel = fn.__beanDel
            return handler
          }

        , RegEntry = function (element, type, handler, original, namespaces, args, root) {
            var customType     = customEvents[type]
              , isNative

            if (type == 'unload') {
              // self clean-up
              handler = once(removeListener, element, type, handler, original)
            }

            if (customType) {
              if (customType.condition) {
                handler = wrappedHandler(element, handler, customType.condition, args)
              }
              type = customType.base || type
            }

            this.isNative      = isNative = nativeEvents[type] && !!element[eventSupport]
            this.customType    = !W3C_MODEL && !isNative && type
            this.element       = element
            this.type          = type
            this.original      = original
            this.namespaces    = namespaces
            this.eventType     = W3C_MODEL || isNative ? type : 'propertychange'
            this.target        = targetElement(element, isNative)
            this[eventSupport] = !!this.target[eventSupport]
            this.root          = root
            this.handler       = wrappedHandler(element, handler, null, args)
          }

        // given a list of namespaces, is our entry in any of them?
        RegEntry.prototype.inNamespaces = function (checkNamespaces) {
          var i, j, c = 0
          if (!checkNamespaces) return true
          if (!this.namespaces) return false
          for (i = checkNamespaces.length; i--;) {
            for (j = this.namespaces.length; j--;) {
              if (checkNamespaces[i] == this.namespaces[j]) c++
            }
          }
          return checkNamespaces.length === c
        }

        // match by element, original fn (opt), handler fn (opt)
        RegEntry.prototype.matches = function (checkElement, checkOriginal, checkHandler) {
          return this.element === checkElement &&
            (!checkOriginal || this.original === checkOriginal) &&
            (!checkHandler || this.handler === checkHandler)
        }

        return RegEntry
      }())

    , registry = (function () {
        // our map stores arrays by event type, just because it's better than storing
        // everything in a single array.
        // uses '$' as a prefix for the keys for safety and 'r' as a special prefix for
        // rootListeners so we can look them up fast
        var map = {}

          // generic functional search of our registry for matching listeners,
          // `fn` returns false to break out of the loop
          , forAll = function (element, type, original, handler, root, fn) {
              var pfx = root ? 'r' : '$'
              if (!type || type == '*') {
                // search the whole registry
                for (var t in map) {
                  if (t.charAt(0) == pfx) {
                    forAll(element, t.substr(1), original, handler, root, fn)
                  }
                }
              } else {
                var i = 0, l, list = map[pfx + type], all = element == '*'
                if (!list) return
                for (l = list.length; i < l; i++) {
                  if ((all || list[i].matches(element, original, handler)) && !fn(list[i], list, i, type)) return
                }
              }
            }

          , has = function (element, type, original, root) {
              // we're not using forAll here simply because it's a bit slower and this
              // needs to be fast
              var i, list = map[(root ? 'r' : '$') + type]
              if (list) {
                for (i = list.length; i--;) {
                  if (!list[i].root && list[i].matches(element, original, null)) return true
                }
              }
              return false
            }

          , get = function (element, type, original, root) {
              var entries = []
              forAll(element, type, original, null, root, function (entry) {
                return entries.push(entry)
              })
              return entries
            }

          , put = function (entry) {
              var has = !entry.root && !this.has(entry.element, entry.type, null, false)
                , key = (entry.root ? 'r' : '$') + entry.type
              ;(map[key] || (map[key] = [])).push(entry)
              return has
            }

          , del = function (entry) {
              forAll(entry.element, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
                list.splice(i, 1)
                entry.removed = true
                if (list.length === 0) delete map[(entry.root ? 'r' : '$') + entry.type]
                return false
              })
            }

            // dump all entries, used for onunload
          , entries = function () {
              var t, entries = []
              for (t in map) {
                if (t.charAt(0) == '$') entries = entries.concat(map[t])
              }
              return entries
            }

        return { has: has, get: get, put: put, del: del, entries: entries }
      }())

      // we need a selector engine for delegated events, use querySelectorAll if it exists
      // but for older browsers we need Qwery, Sizzle or similar
    , selectorEngine
    , setSelectorEngine = function (e) {
        if (!arguments.length) {
          selectorEngine = doc.querySelectorAll
            ? function (s, r) {
                return r.querySelectorAll(s)
              }
            : function () {
                throw new Error('Bean: No selector engine installed') // eeek
              }
        } else {
          selectorEngine = e
        }
      }

      // we attach this listener to each DOM event that we need to listen to, only once
      // per event type per DOM element
    , rootListener = function (event, type) {
        if (!W3C_MODEL && type && event && event.propertyName != '_on' + type) return

        var listeners = registry.get(this, type || event.type, null, false)
          , l = listeners.length
          , i = 0

        event = new Event(event, this, true)
        if (type) event.type = type

        // iterate through all handlers registered for this type, calling them unless they have
        // been removed by a previous handler or stopImmediatePropagation() has been called
        for (; i < l && !event.isImmediatePropagationStopped(); i++) {
          if (!listeners[i].removed) listeners[i].handler.call(this, event)
        }
      }

      // add and remove listeners to DOM elements
    , listener = W3C_MODEL
        ? function (element, type, add) {
            // new browsers
            element[add ? addEvent : removeEvent](type, rootListener, false)
          }
        : function (element, type, add, custom) {
            // IE8 and below, use attachEvent/detachEvent and we have to piggy-back propertychange events
            // to simulate event bubbling etc.
            var entry
            if (add) {
              registry.put(entry = new RegEntry(
                  element
                , custom || type
                , function (event) { // handler
                    rootListener.call(element, event, custom)
                  }
                , rootListener
                , null
                , null
                , true // is root
              ))
              if (custom && element['_on' + custom] == null) element['_on' + custom] = 0
              entry.target.attachEvent('on' + entry.eventType, entry.handler)
            } else {
              entry = registry.get(element, custom || type, rootListener, true)[0]
              if (entry) {
                entry.target.detachEvent('on' + entry.eventType, entry.handler)
                registry.del(entry)
              }
            }
          }

    , once = function (rm, element, type, fn, originalFn) {
        // wrap the handler in a handler that does a remove as well
        return function () {
          fn.apply(this, arguments)
          rm(element, type, originalFn)
        }
      }

    , removeListener = function (element, orgType, handler, namespaces) {
        var type     = orgType && orgType.replace(nameRegex, '')
          , handlers = registry.get(element, type, null, false)
          , removed  = {}
          , i, l

        for (i = 0, l = handlers.length; i < l; i++) {
          if ((!handler || handlers[i].original === handler) && handlers[i].inNamespaces(namespaces)) {
            // TODO: this is problematic, we have a registry.get() and registry.del() that
            // both do registry searches so we waste cycles doing this. Needs to be rolled into
            // a single registry.forAll(fn) that removes while finding, but the catch is that
            // we'll be splicing the arrays that we're iterating over. Needs extra tests to
            // make sure we don't screw it up. @rvagg
            registry.del(handlers[i])
            if (!removed[handlers[i].eventType] && handlers[i][eventSupport])
              removed[handlers[i].eventType] = { t: handlers[i].eventType, c: handlers[i].type }
          }
        }
        // check each type/element for removed listeners and remove the rootListener where it's no longer needed
        for (i in removed) {
          if (!registry.has(element, removed[i].t, null, false)) {
            // last listener of this type, remove the rootListener
            listener(element, removed[i].t, false, removed[i].c)
          }
        }
      }

      // set up a delegate helper using the given selector, wrap the handler function
    , delegate = function (selector, fn) {
        //TODO: findTarget (therefore $) is called twice, once for match and once for
        // setting e.currentTarget, fix this so it's only needed once
        var findTarget = function (target, root) {
              var i, array = isString(selector) ? selectorEngine(selector, root) : selector
              for (; target && target !== root; target = target.parentNode) {
                for (i = array.length; i--;) {
                  if (array[i] === target) return target
                }
              }
            }
          , handler = function (e) {
              var match = findTarget(e.target, this)
              if (match) fn.apply(match, arguments)
            }

        // __beanDel isn't pleasant but it's a private function, not exposed outside of Bean
        handler.__beanDel = {
            ft       : findTarget // attach it here for customEvents to use too
          , selector : selector
        }
        return handler
      }

    , fireListener = W3C_MODEL ? function (isNative, type, element) {
        // modern browsers, do a proper dispatchEvent()
        var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
        evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
        element.dispatchEvent(evt)
      } : function (isNative, type, element) {
        // old browser use onpropertychange, just increment a custom property to trigger the event
        element = targetElement(element, isNative)
        isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
      }

      /**
        * Public API: off(), on(), add(), (remove()), one(), fire(), clone()
        */

      /**
        * off(element[, eventType(s)[, handler ]])
        */
    , off = function (element, typeSpec, fn) {
        var isTypeStr = isString(typeSpec)
          , k, type, namespaces, i

        if (isTypeStr && typeSpec.indexOf(' ') > 0) {
          // off(el, 't1 t2 t3', fn) or off(el, 't1 t2 t3')
          typeSpec = str2arr(typeSpec)
          for (i = typeSpec.length; i--;)
            off(element, typeSpec[i], fn)
          return element
        }

        type = isTypeStr && typeSpec.replace(nameRegex, '')
        if (type && customEvents[type]) type = customEvents[type].base

        if (!typeSpec || isTypeStr) {
          // off(el) or off(el, t1.ns) or off(el, .ns) or off(el, .ns1.ns2.ns3)
          if (namespaces = isTypeStr && typeSpec.replace(namespaceRegex, '')) namespaces = str2arr(namespaces, '.')
          removeListener(element, type, fn, namespaces)
        } else if (isFunction(typeSpec)) {
          // off(el, fn)
          removeListener(element, null, typeSpec)
        } else {
          // off(el, { t1: fn1, t2, fn2 })
          for (k in typeSpec) {
            if (typeSpec.hasOwnProperty(k)) off(element, k, typeSpec[k])
          }
        }

        return element
      }

      /**
        * on(element, eventType(s)[, selector], handler[, args ])
        */
    , on = function(element, events, selector, fn) {
        var originalFn, type, types, i, args, entry, first

        //TODO: the undefined check means you can't pass an 'args' argument, fix this perhaps?
        if (selector === undefined && typeof events == 'object') {
          //TODO: this can't handle delegated events
          for (type in events) {
            if (events.hasOwnProperty(type)) {
              on.call(this, element, type, events[type])
            }
          }
          return
        }

        if (!isFunction(selector)) {
          // delegated event
          originalFn = fn
          args       = slice.call(arguments, 4)
          fn         = delegate(selector, originalFn, selectorEngine)
        } else {
          args       = slice.call(arguments, 3)
          fn         = originalFn = selector
        }

        types = str2arr(events)

        // special case for one(), wrap in a self-removing handler
        if (this === ONE) {
          fn = once(off, element, events, fn, originalFn)
        }

        for (i = types.length; i--;) {
          // add new handler to the registry and check if it's the first for this element/type
          first = registry.put(entry = new RegEntry(
              element
            , types[i].replace(nameRegex, '') // event type
            , fn
            , originalFn
            , str2arr(types[i].replace(namespaceRegex, ''), '.') // namespaces
            , args
            , false // not root
          ))
          if (entry[eventSupport] && first) {
            // first event of this type on this element, add root listener
            listener(element, entry.eventType, true, entry.customType)
          }
        }

        return element
      }

      /**
        * add(element[, selector], eventType(s), handler[, args ])
        *
        * Deprecated: kept (for now) for backward-compatibility
        */
    , add = function (element, events, fn, delfn) {
        return on.apply(
            null
          , !isString(fn)
              ? slice.call(arguments)
              : [ element, fn, events, delfn ].concat(arguments.length > 3 ? slice.call(arguments, 5) : [])
        )
      }

      /**
        * one(element, eventType(s)[, selector], handler[, args ])
        */
    , one = function () {
        return on.apply(ONE, arguments)
      }

      /**
        * fire(element, eventType(s)[, args ])
        *
        * The optional 'args' argument must be an array, if no 'args' argument is provided
        * then we can use the browser's DOM event system, otherwise we trigger handlers manually
        */
    , fire = function (element, type, args) {
        var types = str2arr(type)
          , i, j, l, names, handlers

        for (i = types.length; i--;) {
          type = types[i].replace(nameRegex, '')
          if (names = types[i].replace(namespaceRegex, '')) names = str2arr(names, '.')
          if (!names && !args && element[eventSupport]) {
            fireListener(nativeEvents[type], type, element)
          } else {
            // non-native event, either because of a namespace, arguments or a non DOM element
            // iterate over all listeners and manually 'fire'
            handlers = registry.get(element, type, null, false)
            args = [false].concat(args)
            for (j = 0, l = handlers.length; j < l; j++) {
              if (handlers[j].inNamespaces(names)) {
                handlers[j].handler.apply(element, args)
              }
            }
          }
        }
        return element
      }

      /**
        * clone(dstElement, srcElement[, eventType ])
        *
        * TODO: perhaps for consistency we should allow the same flexibility in type specifiers?
        */
    , clone = function (element, from, type) {
        var handlers = registry.get(from, type, null, false)
          , l = handlers.length
          , i = 0
          , args, beanDel

        for (; i < l; i++) {
          if (handlers[i].original) {
            args = [ element, handlers[i].type ]
            if (beanDel = handlers[i].handler.__beanDel) args.push(beanDel.selector)
            args.push(handlers[i].original)
            on.apply(null, args)
          }
        }
        return element
      }

    , bean = {
          'on'                : on
        , 'add'               : add
        , 'one'               : one
        , 'off'               : off
        , 'remove'            : off
        , 'clone'             : clone
        , 'fire'              : fire
        , 'Event'             : Event
        , 'setSelectorEngine' : setSelectorEngine
        , 'noConflict'        : function () {
            context[name] = old
            return this
          }
      }

  // for IE, clean up on unload to avoid leaks
  if (win.attachEvent) {
    var cleanup = function () {
      var i, entries = registry.entries()
      for (i in entries) {
        if (entries[i].type && entries[i].type !== 'unload') off(entries[i].element, entries[i].type)
      }
      win.detachEvent('onunload', cleanup)
      win.CollectGarbage && win.CollectGarbage()
    }
    win.attachEvent('onunload', cleanup)
  }

  // initialize selector engine to internal default (qSA or throw Error)
  setSelectorEngine()

  return bean
});

/**
 * @module  qwery_bonzo_bean
 */

if(typeof $ == "undefined" && !window.jQuery){
	function $(selector, context) {
		return bonzo(qwery(selector, context));
	}
}
(function(window, $, undefined) {
    'use strict';

    if (!window) return; // Server side

    var _baron = baron; // Stored baron value for noConflict usage
    var pos = ['left', 'top', 'right', 'bottom', 'width', 'height'];
    // Global store for all baron instances (to be able to dispose them on html-nodes)
    var instances = [];
    var origin = {
        v: { // Vertical
            x: 'Y', pos: pos[1], oppos: pos[3], crossPos: pos[0], crossOpPos: pos[2],
            size: pos[5],
            crossSize: pos[4], crossMinSize: 'min-' + pos[4], crossMaxSize: 'max-' + pos[4],
            client: 'clientHeight', crossClient: 'clientWidth',
            crossScroll: 'scrollWidth',
            offset: 'offsetHeight', crossOffset: 'offsetWidth', offsetPos: 'offsetTop',
            scroll: 'scrollTop', scrollSize: 'scrollHeight'
        },
        h: { // Horizontal
            x: 'X', pos: pos[0], oppos: pos[2], crossPos: pos[1], crossOpPos: pos[3],
            size: pos[4],
            crossSize: pos[5], crossMinSize: 'min-' + pos[5], crossMaxSize: 'max-' + pos[5],
            client: 'clientWidth', crossClient: 'clientHeight',
            crossScroll: 'scrollHeight',
            offset: 'offsetWidth', crossOffset: 'offsetHeight', offsetPos: 'offsetLeft',
            scroll: 'scrollLeft', scrollSize: 'scrollWidth'
        }
    };

    function each(obj, iterator) {
        var i = 0;

        if (obj.length === undefined || obj === window) obj = [obj];

        while (obj[i]) {
            iterator.call(this, obj[i], i);
            i++;
        }
    }

    function baron(params) {
        var jQueryMode,
            roots,
            $;

        params = params || {};
        $ = params.$ || $ || window.jQuery;
        jQueryMode = this instanceof $;  // this - window or jQuery instance

        if (jQueryMode) {
            params.root = roots = this;
        } else {
            roots = $(params.root || params.scroller);
        }

        var instance = new baron.fn.constructor(roots, params, $);

        if (instance.autoUpdate) {
            instance.autoUpdate();
        }

        return instance;
    }

    // shortcut for getTime
    function getTime() {
        return new Date().getTime();
    }

    baron._instances = instances; // for debug

    baron.fn = {
        constructor: function(roots, input, $) {
            var params = validate(input);

            params.$ = $;
            this.length = 0;
            each.call(this, roots, function(root, i) {
                var id = +manageAttr(root, params.direction); // Could be NaN

                // baron() without params can return existing instances,
                // but baron(params) will throw an Error as a second initialization
                if (id == id && instances[id] && !input) {
                    this[i] = instances[id];
                } else {
                    var localParams = clone(params);

                    // root and scroller can be different nodes
                    if (params.root && params.scroller) {
                        localParams.scroller = params.$(params.scroller, root);
                        if (!localParams.scroller.length) {
                            localParams.scroller = root;
                        }
                    } else {
                        localParams.scroller = root;
                    }

                    localParams.root = root;
                    this[i] = init(localParams);
                }

                this.length = i + 1;
            });

            this.params = params;
        },

        dispose: function() {
            var params = this.params;

            each(this, function(item) {
                item.dispose(params);
            });

            this.params = null;
        },

        update: function() {
            var i = 0;

            while (this[i]) {
                this[i].update.apply(this[i], arguments);
                i++;
            }
        },

        baron: function(params) {
            params.root = [];
            params.scroller = this.params.scroller;

            each.call(this, this, function(elem) {
                params.root.push(elem.root);
            });
            params.direction = (this.params.direction == 'v') ? 'h' : 'v';
            params._chain = true;

            return baron(params);
        }
    };

    function manageEvents(item, eventManager, mode) {
        // Creating new functions for one baron item only one time
        item._eventHandlers = item._eventHandlers || [
            {
                // onScroll:
                element: item.scroller,

                handler: function(e) {
                    item.scroll(e);
                },

                type: 'scroll'
            }, {
                // css transitions & animations
                element: item.root,

                handler: function() {
                    item.update();
                },

                type: 'transitionend animationend'
            }, {
                // onKeyup (textarea):
                element: item.scroller,

                handler: function() {
                    item.update();
                },

                type: 'keyup'
            }, {
                // onMouseDown:
                element: item.bar,

                handler: function(e) {
                    e.preventDefault(); // Text selection disabling in Opera
                    item.selection(); // Disable text selection in ie8
                    item.drag.now = 1; // Save private byte
                    if (item.draggingCls) {
                        $(item.bar).addClass(item.draggingCls);
                    }
                },

                type: 'touchstart mousedown'
            }, {
                // onMouseUp:
                element: document,

                handler: function() {
                    item.selection(1); // Enable text selection
                    item.drag.now = 0;
                    if (item.draggingCls) {
                        $(item.bar).removeClass(item.draggingCls);
                    }
                },

                type: 'mouseup blur touchend'
            }, {
                // onCoordinateReset:
                element: document,

                handler: function(e) {
                    if (e.button != 2) { // Not RM
                        item._pos0(e);
                    }
                },

                type: 'touchstart mousedown'
            }, {
                // onMouseMove:
                element: document,

                handler: function(e) {
                    if (item.drag.now) {
                        item.drag(e);
                    }
                },

                type: 'mousemove touchmove'
            }, {
                // onResize:
                element: window,

                handler: function() {
                    item.update();
                },

                type: 'resize'
            }, {
                // sizeChange:
                element: item.root,

                handler: function() {
                    item.update();
                },

                type: 'sizeChange'
            }
        ];

        each(item._eventHandlers, function(event) {
            if (event.element) {
                eventManager(event.element, event.type, event.handler, mode);
            }
        });

        // if (item.scroller) {
        //     event(item.scroller, 'scroll', item._eventHandlers.onScroll, mode);
        // }
        // if (item.bar) {
        //     event(item.bar, 'touchstart mousedown', item._eventHandlers.onMouseDown, mode);
        // }
        // event(document, 'mouseup blur touchend', item._eventHandlers.onMouseUp, mode);
        // event(document, 'touchstart mousedown', item._eventHandlers.onCoordinateReset, mode);
        // event(document, 'mousemove touchmove', item._eventHandlers.onMouseMove, mode);
        // event(window, 'resize', item._eventHandlers.onResize, mode);
        // if (item.root) {
        //     event(item.root, 'sizeChange', item._eventHandlers.onResize, mode);
        //     // Custon event for alternate baron update mechanism
        // }
    }

    // set, remove or read baron-specific id-attribute
    function manageAttr(node, direction, mode, id) {
        var attrName = 'data-baron-' + direction + '-id';

        if (mode == 'on') {
            node.setAttribute(attrName, id);
        } else if (mode == 'off') {
            node.removeAttribute(attrName);
        } else {
            return node.getAttribute(attrName);
        }
    }

    function init(params) {
        if (manageAttr(params.root, params.direction)) {
            console.log('Error! Baron for this node already initialized', params.root);
        }

        // __proto__ of returning object is baron.prototype
        var out = new item.prototype.constructor(params);

        manageEvents(out, params.event, 'on');

        manageAttr(out.root, params.direction, 'on', instances.length);
        instances.push(out);

        out.update();

        return out;
    }

    function clone(input) {
        var output = {};

        input = input || {};

        for (var key in input) {
            if (input.hasOwnProperty(key)) {
                output[key] = input[key];
            }
        }

        return output;
    }

    function validate(input) {
        var output = clone(input);

        output.direction = output.direction || 'v';

        var event = input.event || function(elem, event, func, mode) {
            output.$(elem)[mode || 'on'](event, func);
        };

        output.event = function(elems, e, func, mode) {
            each(elems, function(elem) {
                event(elem, e, func, mode);
            });
        };

        return output;
    }

    function fire(eventName) {
        /* jshint validthis:true */
        if (this.events && this.events[eventName]) {
            for (var i = 0 ; i < this.events[eventName].length ; i++) {
                var args = Array.prototype.slice.call( arguments, 1 );

                this.events[eventName][i].apply(this, args);
            }
        }
    }

    var item = {};

    item.prototype = {
        // underscore.js realization
        _debounce: function(func, wait) {
            var self = this,
                timeout,
                // args, // right now there is no need for arguments
                // context, // and for context
                timestamp;
                // result; // and for result

            var later = function() {
                if (self._disposed) {
                    clearTimeout(timeout);
                    timeout = self = null;
                    return;
                }

                var last = getTime() - timestamp;

                if (last < wait && last >= 0) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    // result = func.apply(context, args);
                    func();
                    // context = args = null;
                }
            };

            return function() {
                // context = this;
                // args = arguments;
                timestamp = getTime();

                if (!timeout) {
                    timeout = setTimeout(later, wait);
                }

                // return result;
            };
        },

        constructor: function(params) {
            var $,
                barPos,
                scrollerPos0,
                track,
                resizePauseTimer,
                scrollPauseTimer,
                scrollingTimer,
                pause,
                scrollLastFire,
                resizeLastFire,
                oldBarSize;

            resizeLastFire = scrollLastFire = getTime();

            $ = this.$ = params.$;
            this.event = params.event;
            this.events = {};

            function getNode(sel, context) {
                return $(sel, context)[0]; // Can be undefined
            }

            // DOM elements
            this.root = params.root; // Always html node, not just selector
            this.scroller = getNode(params.scroller);
            this.bar = getNode(params.bar, this.root);
            track = this.track = getNode(params.track, this.root);
            if (!this.track && this.bar) {
                track = this.bar.parentNode;
            }
            this.clipper = this.scroller.parentNode;

            // Parameters
            this.direction = params.direction;
            this.origin = origin[this.direction];
            this.barOnCls = params.barOnCls || '_baron';
            this.scrollingCls = params.scrollingCls;
            this.draggingCls = params.draggingCls;
            this.barTopLimit = 0;
            pause = params.pause * 1000 || 0;

            if (params.pause) {
                console.warn('Baronjs: "pause" param will be removed in 0.8+ version');
            }

            // Updating height or width of bar
            function setBarSize(size) {
                /* jshint validthis:true */
                var barMinSize = this.barMinSize || 20;

                if (size > 0 && size < barMinSize) {
                    size = barMinSize;
                }

                if (this.bar) {
                    $(this.bar).css(this.origin.size, parseInt(size, 10) + 'px');
                }
            }

            // Updating top or left bar position
            function posBar(pos) {
                /* jshint validthis:true */
                if (this.bar) {
                    var was = $(this.bar).css(this.origin.pos),
                        will = +pos + 'px';

                    if (will && will != was) {
                        $(this.bar).css(this.origin.pos, will);
                    }
                }
            }

            // Free path for bar
            function k() {
                /* jshint validthis:true */
                return track[this.origin.client] - this.barTopLimit - this.bar[this.origin.offset];
            }

            // Relative content top position to bar top position
            function relToPos(r) {
                /* jshint validthis:true */
                return r * k.call(this) + this.barTopLimit;
            }

            // Bar position to relative content position
            function posToRel(t) {
                /* jshint validthis:true */
                return (t - this.barTopLimit) / k.call(this);
            }

            // Cursor position in main direction in px // Now with iOs support
            this.cursor = function(e) {
                return e['client' + this.origin.x] ||
                    (((e.originalEvent || e).touches || {})[0] || {})['page' + this.origin.x];
            };

            // Text selection pos preventing
            function dontPosSelect() {
                return false;
            }

            this.pos = function(x) { // Absolute scroller position in px
                var ie = 'page' + this.origin.x + 'Offset',
                    key = (this.scroller[ie]) ? ie : this.origin.scroll;

                if (x !== undefined) this.scroller[key] = x;

                return this.scroller[key];
            };

            this.rpos = function(r) { // Relative scroller position (0..1)
                var free = this.scroller[this.origin.scrollSize] - this.scroller[this.origin.client],
                    x;

                if (r) {
                    x = this.pos(r * free);
                } else {
                    x = this.pos();
                }

                return x / (free || 1);
            };

            // Switch on the bar by adding user-defined CSS classname to scroller
            this.barOn = function(dispose) {
                if (this.barOnCls) {
                    if (dispose ||
                        this.scroller[this.origin.client] >= this.scroller[this.origin.scrollSize])
                    {
                        if ($(this.root).hasClass(this.barOnCls)) {
                            $(this.root).removeClass(this.barOnCls);
                        }
                    } else {
                        if (!$(this.root).hasClass(this.barOnCls)) {
                            $(this.root).addClass(this.barOnCls);
                        }
                    }
                }
            };

            this._pos0 = function(e) {
                scrollerPos0 = this.cursor(e) - barPos;
            };

            this.drag = function(e) {
                var rel = posToRel.call(this, this.cursor(e) - scrollerPos0);
                var k = (this.scroller[this.origin.scrollSize] - this.scroller[this.origin.client]);
                this.scroller[this.origin.scroll] = rel * k;
            };

            // Text selection preventing on drag
            this.selection = function(enable) {
                this.event(document, 'selectpos selectstart', dontPosSelect, enable ? 'off' : 'on');
            };

            // onResize & DOM modified handler
            this.resize = function() {
                var self = this,
                    delay = 0;

                if (getTime() - resizeLastFire < pause) {
                    clearTimeout(resizePauseTimer);
                    delay = pause;
                }

                function upd() {
                    var was;
                    var will;
                    var offset = self.scroller[self.origin.crossOffset];
                    var client = self.scroller[self.origin.crossClient];

                    // Opera 12 bug https://github.com/Diokuz/baron/issues/105
                    if (client > 0 && offset === 0) {
                        // Only Opera 12 in some rare nested flexbox cases goes here
                        // Sorry guys for magic,
                        // but I dont want to create temporary html-nodes set
                        // just for measuring scrollbar size in Opera 12.
                        // 17px for Windows XP-8.1, 15px for Mac (really rare).
                        offset = client + 17;
                    }

                    if (offset) { // if there is no size, css should not be set
                        self.barOn();
                        client = self.scroller[self.origin.crossClient];

                        // Two different appropches for different directions
                        if (self.direction == 'v') { // vertical
                            var delta = offset - client;

                            was = $(self.clipper).css(self.origin.crossSize);
                            will = self.clipper[self.origin.crossClient] + delta + 'px';

                            if (was != will) {
                                self._setCrossSizes(self.scroller, will);
                            }
                        } else { // horizontal
                            was = $(self.clipper).css(self.origin.crossSize);
                            will = client + 'px';

                            if (was != will) {
                                self._setCrossSizes(self.clipper, will);
                            }
                        }
                    }

                    Array.prototype.unshift.call(arguments, 'resize');
                    fire.apply(self, arguments);

                    resizeLastFire = getTime();
                }

                if (delay) {
                    resizePauseTimer = setTimeout(upd, delay);
                } else {
                    upd();
                }
            };

            this.updatePositions = function() {
                var newBarSize,
                    self = this;

                if (self.bar) {
                    newBarSize = (track[self.origin.client] - self.barTopLimit) *
                        self.scroller[self.origin.client] / self.scroller[self.origin.scrollSize];

                    // Positioning bar
                    if (parseInt(oldBarSize, 10) != parseInt(newBarSize, 10)) {
                        setBarSize.call(self, newBarSize);
                        oldBarSize = newBarSize;
                    }

                    barPos = relToPos.call(self, self.rpos());

                    posBar.call(self, barPos);
                }

                Array.prototype.unshift.call( arguments, 'scroll' );
                fire.apply(self, arguments);

                scrollLastFire = getTime();
            };

            // onScroll handler
            this.scroll = function() {
                var delay = 0,
                    self = this;

                if (getTime() - scrollLastFire < pause) {
                    clearTimeout(scrollPauseTimer);
                    delay = pause;
                }

                if (delay) {
                    scrollPauseTimer = setTimeout(function() {
                        self.updatePositions();
                    }, delay);
                } else {
                    self.updatePositions();
                }

                if (self.scrollingCls) {
                    if (!scrollingTimer) {
                        this.$(this.scroller).addClass(this.scrollingCls);
                    }
                    clearTimeout(scrollingTimer);
                    scrollingTimer = setTimeout(function() {
                        self.$(self.scroller).removeClass(self.scrollingCls);
                        scrollingTimer = undefined;
                    }, 300);
                }

            };

            // Flexbox `align-items: stretch` (default) requires to set min-width for vertical
            // and max-height for horizontal scroll. Just set them all.
            // http://www.w3.org/TR/css-flexbox-1/#valdef-align-items-stretch
            this._setCrossSizes = function(node, size) {
                var css = {};

                css[this.origin.crossSize] = size;
                css[this.origin.crossMinSize] = size;
                css[this.origin.crossMaxSize] = size;

                this.$(node).css(css);
            };

            return this;
        },

        update: function(params) {
            fire.call(this, 'upd', params); // Update all plugins' params

            this.resize(1);
            this.updatePositions();

            return this;
        },

        // One instance
        dispose: function(params) {
            manageEvents(this, this.event, 'off');
            manageAttr(this.root, params.direction, 'off');
            if (params.direction == 'v') {
                this._setCrossSizes(this.scroller, '');
            } else {
                this._setCrossSizes(this.clipper, '');
            }
            this.barOn(true);
            fire.call(this, 'dispose');
            this._disposed = true;
        },

        on: function(eventName, func, arg) {
            var names = eventName.split(' ');

            for (var i = 0 ; i < names.length ; i++) {
                if (names[i] == 'init') {
                    func.call(this, arg);
                } else {
                    this.events[names[i]] = this.events[names[i]] || [];

                    this.events[names[i]].push(function(userArg) {
                        func.call(this, userArg || arg);
                    });
                }
            }
        }
    };

    baron.fn.constructor.prototype = baron.fn;
    item.prototype.constructor.prototype = item.prototype;

    // Use when you need "baron" global var for another purposes
    baron.noConflict = function() {
        window.baron = _baron; // Restoring original value of "baron" global var

        return baron;
    };

    baron.version = '0.7.10';

    if ($ && $.fn) { // Adding baron to jQuery as plugin
        $.fn.baron = baron;
    }

    window.baron = baron; // Use noConflict method if you need window.baron var for another purposes
    if (window['module'] && module.exports) {
        module.exports = baron.noConflict();
    }
})(window, window.$);

/* Fixable elements plugin for baron 0.6+ */
(function(window, undefined) {
    var fix = function(userParams) {
        var elements, viewPortSize,
            params = { // Default params
                outside: '',
                inside: '',
                before: '',
                after: '',
                past: '',
                future: '',
                radius: 0,
                minView: 0
            },
            topFixHeights = [], // inline style for element
            topRealHeights = [], // ? something related to negative margins for fixable elements
            headerTops = [], // offset positions when not fixed
            scroller = this.scroller,
            eventManager = this.event,
            $ = this.$,
            self = this;

        // i - number of fixing element, pos - fix-position in px, flag - 1: top, 2: bottom
        // Invocation only in case when fix-state changed
        function fixElement(i, pos, flag) {
            var ori = flag == 1 ? 'pos' : 'oppos';

            if (viewPortSize < (params.minView || 0)) { // No headers fixing when no enought space for viewport
                pos = undefined;
            }

            // Removing all fixing stuff - we can do this because fixElement triggers only when fixState really changed
            this.$(elements[i]).css(this.origin.pos, '').css(this.origin.oppos, '').removeClass(params.outside);

            // Fixing if needed
            if (pos !== undefined) {
                pos += 'px';
                this.$(elements[i]).css(this.origin[ori], pos).addClass(params.outside);
            }
        }

        function bubbleWheel(e) {
            try {
                i = document.createEvent('WheelEvent'); // i - for extra byte
                // evt.initWebKitWheelEvent(deltaX, deltaY, window, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey);
                i.initWebKitWheelEvent(e.originalEvent.wheelDeltaX, e.originalEvent.wheelDeltaY);
                scroller.dispatchEvent(i);
                e.preventDefault();
            } catch (e) {}
        }

        function init(_params) {
            var pos;

            for (var key in _params) {
                params[key] = _params[key];
            }

            elements = this.$(params.elements, this.scroller);

            if (elements) {
                viewPortSize = this.scroller[this.origin.client];
                for (var i = 0 ; i < elements.length ; i++) {
                    // Variable header heights
                    pos = {};
                    pos[this.origin.size] = elements[i][this.origin.offset];
                    if (elements[i].parentNode !== this.scroller) {
                        this.$(elements[i].parentNode).css(pos);
                    }
                    pos = {};
                    pos[this.origin.crossSize] = elements[i].parentNode[this.origin.crossClient];
                    this.$(elements[i]).css(pos);

                    // Between fixed headers
                    viewPortSize -= elements[i][this.origin.offset];

                    headerTops[i] = elements[i].parentNode[this.origin.offsetPos]; // No paddings for parentNode

                    // Summary elements height above current
                    topFixHeights[i] = (topFixHeights[i - 1] || 0); // Not zero because of negative margins
                    topRealHeights[i] = (topRealHeights[i - 1] || Math.min(headerTops[i], 0));

                    if (elements[i - 1]) {
                        topFixHeights[i] += elements[i - 1][this.origin.offset];
                        topRealHeights[i] += elements[i - 1][this.origin.offset];
                    }

                    if ( !(i == 0 && headerTops[i] == 0)/* && force */) {
                        this.event(elements[i], 'mousewheel', bubbleWheel, 'off');
                        this.event(elements[i], 'mousewheel', bubbleWheel);
                    }
                }

                if (params.limiter && elements[0]) { // Bottom edge of first header as top limit for track
                    if (this.track && this.track != this.scroller) {
                        pos = {};
                        pos[this.origin.pos] = elements[0].parentNode[this.origin.offset];
                        this.$(this.track).css(pos);
                    } else {
                        this.barTopLimit = elements[0].parentNode[this.origin.offset];
                    }
                    // this.barTopLimit = elements[0].parentNode[this.origin.offset];
                    this.scroll();
                }

                if (params.limiter === false) { // undefined (in second fix instance) should have no influence on bar limit
                    this.barTopLimit = 0;
                }
            }

            var event = {
                element: elements,

                handler: function() {
                    var parent = $(this)[0].parentNode,
                        top = parent.offsetTop,
                        num;

                    // finding num -> elements[num] === this
                    for (var i = 0 ; i < elements.length ; i++ ) {
                        if (elements[i] === this) num = i;
                    }

                    var pos = top - topFixHeights[num];

                    if (params.scroll) { // User defined callback
                        params.scroll({
                            x1: self.scroller.scrollTop,
                            x2: pos
                        });
                    } else {
                        self.scroller.scrollTop = pos;
                    }
                },

                type: 'click'
            };

            if (params.clickable) {
                this._eventHandlers.push(event); // For auto-dispose
                // eventManager(event.element, event.type, event.handler, 'off');
                eventManager(event.element, event.type, event.handler, 'on');
            }
        }

        this.on('init', init, userParams);

        var fixFlag = [], // 1 - past, 2 - future, 3 - current (not fixed)
            gradFlag = [];
        this.on('init scroll', function() {
            var fixState, hTop, gradState;

            if (elements) {
                var change;

                // fixFlag update
                for (var i = 0 ; i < elements.length ; i++) {
                    fixState = 0;
                    if (headerTops[i] - this.pos() < topRealHeights[i] + params.radius) {
                        // Header trying to go up
                        fixState = 1;
                        hTop = topFixHeights[i];
                    } else if (headerTops[i] - this.pos() > topRealHeights[i] + viewPortSize - params.radius) {
                        // Header trying to go down
                        fixState = 2;
                        // console.log('topFixHeights[i] + viewPortSize + topRealHeights[i]', topFixHeights[i], this.scroller[this.origin.client], topRealHeights[i]);
                        hTop = this.scroller[this.origin.client] - elements[i][this.origin.offset] - topFixHeights[i] - viewPortSize;
                        // console.log('hTop', hTop, viewPortSize, elements[this.origin.offset], topFixHeights[i]);
                        //(topFixHeights[i] + viewPortSize + elements[this.origin.offset]) - this.scroller[this.origin.client];
                    } else {
                        // Header in viewport
                        fixState = 3;
                        hTop = undefined;
                    }

                    gradState = false;
                    if (headerTops[i] - this.pos() < topRealHeights[i] || headerTops[i] - this.pos() > topRealHeights[i] + viewPortSize) {
                        gradState = true;
                    }

                    if (fixState != fixFlag[i] || gradState != gradFlag[i]) {
                        fixElement.call(this, i, hTop, fixState);
                        fixFlag[i] = fixState;
                        gradFlag[i] = gradState;
                        change = true;
                    }
                }

                // Adding positioning classes (on last top and first bottom header)
                if (change) { // At leats one change in elements flag structure occured
                    for (i = 0 ; i < elements.length ; i++) {
                        if (fixFlag[i] == 1 && params.past) {
                            this.$(elements[i]).addClass(params.past).removeClass(params.future);
                        }

                        if (fixFlag[i] == 2 && params.future) {
                            this.$(elements[i]).addClass(params.future).removeClass(params.past);
                        }

                        if (fixFlag[i] == 3) {
                            if (params.future || params.past) this.$(elements[i]).removeClass(params.past).removeClass(params.future);
                            if (params.inside) this.$(elements[i]).addClass(params.inside);
                        } else if (params.inside) {
                            this.$(elements[i]).removeClass(params.inside);
                        }

                        if (fixFlag[i] != fixFlag[i + 1] && fixFlag[i] == 1 && params.before) {
                            this.$(elements[i]).addClass(params.before).removeClass(params.after); // Last top fixed header
                        } else if (fixFlag[i] != fixFlag[i - 1] && fixFlag[i] == 2 && params.after) {
                            this.$(elements[i]).addClass(params.after).removeClass(params.before); // First bottom fixed header
                        } else {
                            this.$(elements[i]).removeClass(params.before).removeClass(params.after);
                        }

                        if (params.grad) {
                            if (gradFlag[i]) {
                                this.$(elements[i]).addClass(params.grad);
                            } else {
                                this.$(elements[i]).removeClass(params.grad);
                            }
                        }
                    }
                }
            }
        });

        this.on('resize upd', function(updParams) {
            init.call(this, updParams && updParams.fix);
        });
    };

    baron.fn.fix = function(params) {
        var i = 0;

        while (this[i]) {
            fix.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);
/* Autoupdate plugin for baron 0.6+ */
(function(window) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;

    var autoUpdate = function() {
        var self = this;
        var watcher;

        function actualizeWatcher() {
            if (!self.root[self.origin.offset]) {
                startWatch();
            } else {
                stopWatch();
            }
        }

        // Set interval timeout for watching when root node will be visible
        function startWatch() {
            if (watcher) return;

            watcher = setInterval(function() {
                if (self.root[self.origin.offset]) {
                    stopWatch();
                    self.update();
                }
            }, 300); // is it good enought for you?)
        }

        function stopWatch() {
            clearInterval(watcher);
            watcher = null;
        }

        var debouncedUpdater = self._debounce(function() {
            self.update();
        }, 300);

        this._observer = new MutationObserver(function() {
            actualizeWatcher();
            self.update();
            debouncedUpdater();
        });

        this.on('init', function() {
            self._observer.observe(self.root, {
                childList: true,
                subtree: true,
                characterData: true
                // attributes: true
                // No reasons to set attributes to true
                // The case when root/child node with already properly inited baron toggled to hidden and then back to visible,
                // and the size of parent was changed during that hidden state, is very rare
                // Other cases are covered by watcher, and you still can do .update by yourself
            });

            actualizeWatcher();
        });

        this.on('dispose', function() {
            self._observer.disconnect();
            stopWatch();
            delete self._observer;
        });
    };

    baron.fn.autoUpdate = function(params) {
        if (!MutationObserver) return this;

        var i = 0;

        while (this[i]) {
            autoUpdate.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);

/* Controls plugin for baron 0.6+ */
(function(window, undefined) {
    var controls = function(params) {
        var forward, backward, track, screen,
            self = this, // AAAAAA!!!!!11
            event;

        screen = params.screen || 0.9;

        if (params.forward) {
            forward = this.$(params.forward, this.clipper);

            event = {
                element: forward,

                handler: function() {
                    var y = self.pos() - params.delta || 30;

                    self.pos(y);
                },

                type: 'click'
            };

            this._eventHandlers.push(event); // For auto-dispose
            this.event(event.element, event.type, event.handler, 'on');
        }

        if (params.backward) {
            backward = this.$(params.backward, this.clipper);

            event = {
                element: backward,

                handler: function() {
                    var y = self.pos() + params.delta || 30;

                    self.pos(y);
                },

                type: 'click'
            };

            this._eventHandlers.push(event); // For auto-dispose
            this.event(event.element, event.type, event.handler, 'on');
        }

        if (params.track) {
            if (params.track === true) {
                track = this.track;
            } else {
                track = this.$(params.track, this.clipper)[0];
            }

            if (track) {
                event = {
                    element: track,

                    handler: function(e) {
                        var x = e['offset' + self.origin.x],
                            xBar = self.bar[self.origin.offsetPos],
                            sign = 0;

                        if (x < xBar) {
                            sign = -1;
                        } else if (x > xBar + self.bar[self.origin.offset]) {
                            sign = 1;
                        }

                        var y = self.pos() + sign * screen * self.scroller[self.origin.client];
                        self.pos(y);
                    },

                    type: 'mousedown'
                };

                this._eventHandlers.push(event); // For auto-dispose
                this.event(event.element, event.type, event.handler, 'on');
            }
        }
    };

    baron.fn.controls = function(params) {
        var i = 0;

        while (this[i]) {
            controls.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);
/* Pull to load plugin for baron 0.6+ */
(function(window, undefined) {
    var pull = function(params) {
        var block = this.$(params.block),
            size = params.size || this.origin.size,
            limit = params.limit || 80,
            onExpand = params.onExpand,
            elements = params.elements || [],
            inProgress = params.inProgress || '',
            self = this,
            _insistence = 0,
            _zeroXCount = 0,
            _interval,
            _timer,
            _x = 0,
            _onExpandCalled,
            _waiting = params.waiting || 500,
            _on;

        function getSize() {
            return self.scroller[self.origin.scroll] + self.scroller[self.origin.offset];
        }

        // Scroller content height
        function getContentSize() {
            return self.scroller[self.origin.scrollSize];
        }

        // Scroller height
        function getScrollerSize() {
            return self.scroller[self.origin.client];
        }

        function step(x, force) {
            var k = x * 0.0005;

            return Math.floor(force - k * (x + 550));
        }

        function toggle(on) {
            _on = on;

            if (on) {
                update(); // First time with no delay
                _interval = setInterval(update, 200);
            } else {
                clearInterval(_interval);
            }
        }

        function update() {
            var pos = {},
                height = getSize(),
                scrollHeight = getContentSize(),
                dx,
                op4,
                scrollInProgress = _insistence == 1;

            op4 = 0; // Возвращающая сила
            if (_insistence > 0) {
                op4 = 40;
            }
            //if (_insistence > -1) {
                dx = step(_x, op4);
                if (height >= scrollHeight - _x && _insistence > -1) {
                    if (scrollInProgress) {
                        _x += dx;
                    }
                } else {
                    _x = 0;
                }

                if (_x < 0) _x = 0;

                pos[size] = _x + 'px';
                if (getScrollerSize() <= getContentSize()) {
                    self.$(block).css(pos);
                    for (var i = 0 ; i < elements.length ; i++) {
                        self.$(elements[i].self).css(elements[i].property, Math.min(_x / limit * 100, 100) + '%');
                    }
                }

                if (inProgress && _x) {
                    self.$(self.root).addClass(inProgress);
                }

                if (_x == 0) {
                    if (params.onCollapse) {
                        params.onCollapse();
                    }
                }

                _insistence = 0;
                _timer = setTimeout(function() {
                    _insistence = -1;
                }, _waiting);
            //}

            if (onExpand && _x > limit && !_onExpandCalled) {
                onExpand();
                _onExpandCalled = true;
            }

            if (_x == 0) {
                _zeroXCount++;
            } else {
                _zeroXCount = 0;
            }
            if (_zeroXCount > 1) {
                toggle(false);
                _onExpandCalled = false;
                if (inProgress) {
                    self.$(self.root).removeClass(inProgress);
                }
            }
        }

        this.on('init', function() {
            toggle(true);
        });

        this.on('dispose', function() {
            toggle(false);
        });

        this.event(this.scroller, 'mousewheel DOMMouseScroll', function(e) {
            var down = e.wheelDelta < 0 || (e.originalEvent && e.originalEvent.wheelDelta < 0) || e.detail > 0;

            if (down) {
                _insistence = 1;
                clearTimeout(_timer);
                if (!_on && getSize() >= getContentSize()) {
                    toggle(true);
                }
            }
            //  else {
            //     toggle(false);
            // }
        });
    };

    baron.fn.pull = function(params) {
        var i = 0;

        while (this[i]) {
            pull.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);
/**
 * Динамическое dataview иерархического справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_dyn_dataview
 */

/**
 * ### Визуальный компонент - динамическое представление элементов справочника
 * - Отображает коллекцию объектов на основе пользовательских шаблонов (список, мозаика, иконы и т.д.)
 * - Унаследован от [dhtmlXDataView](http://docs.dhtmlx.com/dataview__index.html)
 * - Автоматически связывается с irest-сервисом библиотеки интеграции 1С
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachDynDataView` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class ODynDataView
 * @param mgr {DataManager}
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.type {Object} - шаблон и параметры
 * @param [attr.filter] {Object} - отбор + период
 * @param [callback] {Function} - если указано, будет вызвана после инициализации компонента
 * @constructor
 */
dhtmlXCellObject.prototype.attachDynDataView = function(mgr, attr) {

	if(!attr)
		attr = {};

	var conf = {
		type: attr.type || { template:"#name#" },
		select: attr.select || true
	},
		timer_id,
		dataview;

	if(attr.pager)
		conf.pager = attr.pager;
	if(attr.hasOwnProperty("drag"))
		conf.drag = attr.drag;
	if(attr.hasOwnProperty("select"))
		conf.select = attr.select;
	if(attr.hasOwnProperty("multiselect"))
		conf.multiselect = attr.multiselect;
	if(attr.hasOwnProperty("height"))
		conf.height = attr.height;
	if(attr.hasOwnProperty("tooltip"))
		conf.tooltip = attr.tooltip;
	if(attr.hasOwnProperty("autowidth"))
		conf.autowidth = attr.autowidth;
	if(!attr.selection)
		attr.selection = {};

	// список пользовательских стилей для текущего dataview
	// если название стиля содержит подстроку 'list', элементы показываются в одну строку
	if(attr.custom_css){
		if(!Array.isArray(attr.custom_css))
			attr.custom_css = ["list", "large", "small"];
		attr.custom_css.forEach(function (type) {
			dhtmlXDataView.prototype.types[type].css = type;
		})
	}

	// создаём DataView
	if(attr.container){
		conf.container = attr.container;
		dataview = new dhtmlXDataView(conf);
	}else
		dataview = this.attachDataView(conf);

	// и элемент управления режимом просмотра
	// список кнопок можно передать снаружи. Если не указан, создаются три кнопки: "list", "large", "small"
	if(attr.custom_css && attr.custom_css.length > 1)
		dv_tools = new $p.iface.OTooolBar({
			wrapper: attr.outer_container || this.cell, width: '86px', height: '28px', bottom: '2px', right: '28px', name: 'dataview_tools',
			buttons: attr.buttons || [
				{name: 'list', css: 'tb_dv_list', title: 'Список (детально)', float: 'left'},
				{name: 'large', css: 'tb_dv_large', title: 'Крупные значки', float: 'left'},
				{name: 'small', css: 'tb_dv_small', title: 'Мелкие значки', float: 'left'}
			],
			onclick: function (name) {
				var template = dhtmlXDataView.prototype.types[name];
				if(name.indexOf("list") != -1)
					dataview.config.autowidth = 1;
				else
					dataview.config.autowidth = Math.floor((dataview._dataobj.scrollWidth) / (template.width + template.padding*2 + template.margin*2 + template.border*2));
				dataview.define("type", name);
				//dataview.refresh();
			}
		});

	dataview.__define({

		/**
		 * Фильтр, налагаемый на DataView
		 */
		selection: {
			get: function () {

			},
			set: function (v) {
				if(typeof v == "object"){
					for(var key in v)
						attr.selection[key] = v[key];
				}
				this.lazy_timer();
			}
		},

		requery: {
			value: function () {
				attr.url = "";
				$p.rest.build_select(attr, mgr);
				if(attr.filter_prop)
					attr.url+= "&filter_prop=" + JSON.stringify(attr.filter_prop);
				if(dhx4.isIE)
					attr.url = encodeURI(attr.url);
				dataview.clearAll();
				if(dataview._settings)
					dataview._settings.datatype = "json";
				dataview.load(attr.url, "json", function(v){
					if(v){
						dataview.show(dataview.first());
					}
				});
				timer_id = 0;
			}
		},

		requery_list: {
			value: function (list) {

				var _mgr = $p.md.mgr_by_class_name(mgr.class_name);

				function do_requery(){
					var query = [], obj, dv_obj;

					list.forEach(function (o) {
						obj = _mgr.get(o.ref || o, false, true);
						if(obj){
							dv_obj = ({})._mixin(obj._obj);
							dv_obj.id = obj.ref;
							if(o.count)
								dv_obj.count = o.count;
							if(!dv_obj.Код && obj.id)
								dv_obj.Код = obj.id;
							query.push(dv_obj);
						}
					});
					dataview.clearAll();
					dataview.parse(query, "json");
				}

				return _mgr.load_cached_server_array(list, mgr.rest_name).then(do_requery);

			}
		},

		lazy_timer: {
			value: function(){
				if(timer_id)
					clearTimeout(timer_id);
				timer_id = setTimeout(dataview.requery, 200);
			}
		}
	});

	if(attr.hash_route){

		$p.eve.hash_route.push(attr.hash_route);

		setTimeout(function(){
			attr.hash_route($p.job_prm.parse_url());
		}, 50);
	}


	return dataview;

};


/**
 * Общие методв интерфейса вебмагазина
 * Created 27.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_metastore_common
 */

$p.iface.list_data_view = function(attr){

	// пагинация
	var div_pager = document.createElement('div'),

	// контейнер dataview
		div_dataview = document.createElement('div'),

	// внешний контейнер dataview
		div_dataview_outer = document.createElement('div'),

	// внешний для внешнего контейнер dataview
		container,

	// указатель на dataview и параметры dataview
		dataview, dataview_attr;

	if(attr.container instanceof dhtmlXCellObject){
		container = document.createElement('div');
		attr.container.attachObject(container);
		container.style.width = "100%";
		container.style.height = "100%";
	}else{
		container = attr.container;
		delete attr.container;
	}

	// ODynDataView
	container.appendChild(div_dataview_outer);
	div_dataview_outer.appendChild(div_dataview);

	div_pager.classList.add("wb-tools");
	div_dataview_outer.style.clear = "both";
	div_dataview_outer.style.height = div_dataview.style.height = container.offsetHeight + "px";
	div_dataview_outer.style.width = div_dataview.style.width = container.offsetWidth + "px";

	dataview_attr = {
		container: div_dataview,
		outer_container: div_dataview_outer,
		type: attr.type || "list",
		custom_css: attr.custom_css || true,
		autowidth: 1,
		pager: {
			container: div_pager,
			size:30,
			template: "{common.prev()}<div class='paging_text'> Страница {common.page()} из #limit#</div>{common.next()}"
		},
		fields: ["ref", "name"],
		select: attr.select || true
	};
	if(attr.hide_pager)
		delete dataview_attr.pager;
	if(dataview_attr.type != "list" && !attr.autowidth)
		delete dataview_attr.autowidth;
	if(attr.drag)
		dataview_attr.drag = true;

	dataview = dhtmlXCellObject.prototype.attachDynDataView(
		{
			rest_name: "Module_ИнтеграцияСИнтернетМагазином/СписокНоменклатуры/",
			class_name: "cat.Номенклатура"
		}, dataview_attr);

	// подключаем пагинацию
	div_dataview_outer.appendChild(div_pager);


	// подключаем контекстное меню

	// подписываемся на события dataview
	dataview.attachEvent("onAfterSelect", function (id){
		// your code here
	});

	dataview.attachEvent("onItemDblClick", function (id, ev, html){

		var hprm,
			dv_obj = {};

		for(var i=0; i<ev.target.classList.length; i++){
			if(ev.target.classList.item(i).indexOf("dv_") == 0){
				hprm = true;
				break;
			}
		}

		if(!hprm){
			hprm = $p.job_prm.parse_url(),
				dv_obj = dv_obj._mixin(dataview.get(id));
			dv_obj.ref = dv_obj.id;
			dv_obj.id = dv_obj.Код;
			dv_obj._not_set_loaded = true;
			delete dv_obj.Код;
			$p.cat.Номенклатура.create(dv_obj)
				.then(function (o) {
					$p.iface.set_hash(o.ВидНоменклатуры.ref, id, hprm.frm, "catalog");
				});
		}

		return false;
	});

	// подписываемся на событие изменения размера во внешнем layout и изменение ориентации устройства
	if(attr.autosize)
		window.addEventListener("resize", function () {
			setTimeout(function () {
				div_dataview_outer.style.height = div_dataview.style.height = container.offsetHeight + "px";
				div_dataview_outer.style.width = div_dataview.style.width = container.offsetWidth + "px";
				dataview.refresh();
			}, 600);
		}, false);

	return dataview;

};

dhtmlXDataView.prototype.get_elm = function(elm){
	while (elm = elm.parentNode){
		if(elm.getAttribute && elm.getAttribute("dhx_f_id"))
			return this.get(elm.getAttribute("dhx_f_id"));
	}
};
/**
 * Фильтр по свойствам вида элементов справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_filter_prop
 */

/**
 * ### Визуальный компонент для установки отборов по реквизитам (в том числе - вычисляемым), свойствам и категориям элементов справочника
 * - Отображает коллекцию элементов отбора и элементы управления с доступными значениями
 * - Унаследован от [dhtmlxForm](http://docs.dhtmlx.com/form__index.html)
 * - Автоматически обновляет состав доступных свойств при изменении отбора по родителю, выполняя запрос к irest-сервису библиотеки интеграции 1С
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachPropFilter` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OPropFilter
 * @param mgr {DataManager}
 * @param attr {Object} - параметры создаваемого компонента
 * @constructor
 */
dhtmlXCellObject.prototype.attachPropFilter = function(mgr, attr) {

	if(!attr)
		attr = {};
	var _cell = this,
		_width = _cell.getWidth ? _cell.getWidth() : _cell.cell.offsetWidth - 44,
		_add,
		_price,
		_filter_prop = {},
		_parent,
		_hprm = $p.job_prm.parse_url(),
		pf = new function OPropFilter(){
			this.children = [];
			this.form = _cell.attachForm([
				{ type:"settings" , labelWidth:120, inputWidth:120, offsetLeft: dhtmlx.skin == "dhx_web" ? 4 : 8, offsetTop: 8 },
				{ type:"container", name:"price", label:"", inputWidth: _width, inputHeight:50, position: "label-top"},
				{ type:"checkbox" , name:"store", label:"Есть на складе", labelAlign:"left", position:"label-right", tooltip: "Скрыть тованы, которых нет в наличии"  },
				{ type:"container", name:"_add", label:"Дополнительно", inputWidth: _width, inputHeight:"auto", position: "label-top"},
				{ type:"template" , name:"form_template_3", label:"Показать"  },
				{ type:"template" , name:"form_template_1", label:"Больше параметров"  }
			]);
		};

	// подключим дополнительные элементы
	//_cell.cell.firstChild.style.overflow = "auto";

	function prop_change(v){
		var changed;
		for(var key in v){
			if(!_filter_prop[key])
				changed = true;
			else if(typeof v[key] == "object"){
				for(var j in v[key])
					if(_filter_prop[key][j] != v[key][j])
						changed = true;
			}
			_filter_prop[key] = v[key];
		}
		if(changed)
			dhx4.callEvent("filter_prop_change", [_filter_prop]);
	}

	// форма
	//_form.style.width = "100%";
	//_form.style.height = "100px";
	//_cont.appendChild(_form);
	//
	//_add.style.width = "100%";
	//_add.style.height = "100%";
	//_cont.appendChild(_add);


	_add = pf.form.getContainer("_add");

	pf.__define({

		mode: {
			get: function () {

			},
			set: function (v) {

			},
			enumerable: false
		},

		// указывает на объект, определяющий набор свойств для фильтрации
		// например, на элемент справочника _ВидыНоменклатуры_
		parent: {
			get: function () {
				return _parent ? _parent.ref : "";
			},
			set: function (v) {
				// чистим содержимое контейнера
				var child,
					price_prop = {
						container: pf.form.getContainer("price"),
						on_change: prop_change,
						name: "Цена",
						synonym: "Цена",
						range: {min: 0, max: 1000000},
						start: {min: 100, max: 100000}
					};

				pf.children.forEach(function (child) {
					if(child.destructor)
						child.destructor();
				});
				while (child = _add.lastChild)
					_add.removeChild(child);

				_filter_prop = {};

				if(v == $p.blank.guid){
					// перестраиваем ценник
					if(_price){
						price_prop.range.min = 0;
						price_prop.range.max = 1000000;
						price_prop.start.min = 100;
						price_prop.start.max = 100000;
						_price.rebuild(price_prop);
					} else
						_price = new ORangeSlider(price_prop);

					return;
				}

				// получаем вид номенклатуры
				_parent = mgr.get(v);

				// слайдер цены - перестраиваем или создаём новый при старте
				price_prop.range.min = _parent.Цена_Мин > 500 ? _parent.Цена_Мин - 500 : 0;
				price_prop.range.max = _parent.Цена_Макс + 500;
				price_prop.start.min = _parent.Цена_Мин;
				price_prop.start.max = _parent.Цена_Макс;
				if(_price)
					_price.rebuild(price_prop);
				else
					_price = new ORangeSlider(price_prop);


				// уточняем производителей
				if(_parent.Производители){
					var values = _parent.Производители.split(",");
					if(values.length > 1){
						child = new OMultiCheckbox({
							container: _add,
							property: {},
							name: "Производители",
							values: values.map(function (ref) { return $p.cat.Производители.get(ref); })
						});
						pf.children.push(child);
					}
				}

				// бежим по свойствам и создаём элементы управления
				_parent.РеквизитыБыстрогоОтбораНоменклатуры.each(function (o) {
					if(o.property && !o.property.empty()){
						child = new OMultiCheckbox({
							container: _add,
							property: o.property,
							name: o.ПредставлениеРеквизита
						});
						pf.children.push(child);
					}
				});

			},
			enumerable: false
		},

		/**
		 * Обработчик маршрутизации
		 */
		hash_route: {
			value: function (hprm) {
				if(hprm.obj && pf.parent != hprm.obj){
					pf.parent = hprm.obj;


				}
			}
		}
	});


	$p.eve.hash_route.push(pf.hash_route);
	setTimeout(function () {
		pf.hash_route(_hprm);
	}, 50);

	return pf;
};

/**
 *
 * Created 07.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  wdg_multi_checkbox
 */

/**
 * ### Визуальный компонент - таблица из двух колонок: чекбокс и значение
 * - Позволяет выбрать N Значений из списка
 * - Унаследован от [dhtmlXGridObject](http://docs.dhtmlx.com/grid__index.html)
 * - Автоматически строит список свойств по элементу плана видов характеристик _ДополнительныеРеквизитыИСведения_
 *
 * @class OMultiCheckbox
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.container {HTMLElement} - div, в котором будет расположен компонент
 * @param attr.property {cch.property} - Элемент плана видов характеристик _ДополнительныеРеквизитыИСведения_
 * @constructor
 */
function OMultiCheckbox(attr) {

	var _div = document.createElement("div"),
		_grid = new dhtmlXGridObject(_div);

	_div.classList.add("multi_checkbox");
	attr.container.appendChild(_div);

	// собственно табличная часть
	_grid.setIconsPath(dhtmlx.image_path);
	_grid.setImagePath(dhtmlx.image_path);
	_grid.setHeader("," + attr.name || attr.property.Заголовок || attr.property.name);
	//_grid.setNoHeader(true);
	_grid.setInitWidths("30,*");
	_grid.setColAlign("center,left");
	_grid.setColSorting("na,na");
	_grid.setColTypes("ch,ro");
	_grid.setColumnIds("ch,name");
	_grid.enableAutoWidth(true, 600, 100);
	_grid.enableAutoHeight(true, 180, true);
	_grid.init();

	if(attr.values){
		attr.values.forEach(function (o) {
			_grid.addRow(o.ref,[0, o.name]);
		})
	}else if(attr.property.type.is_ref && attr.property.type.types && attr.property.type.types.length == 1){
		$p.md.mgr_by_class_name(attr.property.type.types[0]).find_rows({owner: attr.property}, function (o) {
			_grid.addRow(o.ref,[0, o.name]);
		})
	}

	return _grid;

};



/**
 * Фильтр по свойствам вида элементов справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_range_slider
 */

/**
 * ### Визуальный компонент для установки пары min и max значений с полями ввода и ползунком
 * Унаследован от [noUiSlider](http://refreshless.com/nouislider/)
 *
 * @class ORangeSlider
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.container {HTMLElement} - div, в котором будет расположен компонент
 * @param attr.on_change {Function} - событие, которое генерирует компонент при изменении значений
 * @param attr.name {String} - Имя свойства
 * @param attr.synonym {String} - Текст заголовка
 * @param attr.tooltip {String} - Текст всплывающей подсказки
 * @param attr.range {Object} - диапазон
 * @param attr.start {Object} - начальные значения
 * @constructor
 */
function ORangeSlider(attr) {

	var _div = document.createElement("div"),
		_title = document.createElement("div"),
		_slider = document.createElement("div"),
		_min,
		_max;

	attr.container.appendChild(_div);
	_div.appendChild(_title);
	_title.style.marginBottom = "12px";
	_title.innerHTML = attr.synonym + ": <input name='min' /> - <input name='max' />"
	_min = _title.querySelector('[name=min]');
	_max = _title.querySelector('[name=max]');
	_min.style.width = "33%";
	_max.style.width = "33%";

	_div.appendChild(_slider);

	function create(){

		noUiSlider.create(_slider, {
			start: [ attr.start ? attr.start.min : 100, attr.start ? attr.start.max : 10000 ], // Handle start position
			step: attr.step || 100, // Slider moves in increments of '10'
			margin: attr.margin || 100, // Handles must be more than '20' apart
			connect: true, // Display a colored bar between the handles
			behaviour: 'tap-drag', // Move handle on tap, bar is draggable
			range: { // Slider can select '0' to '100'
				'min': attr.range ? attr.range.min : 200,
				'max': attr.range ? attr.range.max : 10000
			}
		});

		// When the slider value changes, update the input and span
		_slider.noUiSlider.on('update', function( values, handle ) {
			if ( handle ) {
				_max.value = values[handle];
			} else {
				_min.value = values[handle];
			}
			on_change();
		});
	}

	function on_change(){
		var val = {};
		val[attr.name] = [parseInt(_min.value) || 0, parseInt(_max.value) || 100000];
		attr.on_change(val);
	}

	function input_bind(){
		_slider.noUiSlider.set([_min.value, _max.value]);
		on_change();
	}

	create();

	// When the input changes, set the slider value
	_min.addEventListener('change', input_bind);
	_max.addEventListener('change', input_bind);

	_slider.rebuild = function (nattr) {
		if(nattr.range)
			attr.range = nattr.range;
		if(nattr.start)
			attr.start = nattr.start;
		_slider.noUiSlider.destroy();
		create();
	};

	return _slider;

};

/**
 *
 * Created 09.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_product_card
 */

/**
 * ### Визуальный компонент карточки товара
 * - Отображает аккордеон с картинками и свойствами
 * - Унаследован от [dhtmlxForm](http://docs.dhtmlx.com/form__index.html)
 * - Автоматически перерисовывается при изменении ссылки номенклатуры
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachOProductCard` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OProductCard
 * @param attr {Object} - параметры создаваемого компонента
 * @param [attr.ref] {String|DataObj} - ссылка или номенклатура
 * @constructor
 */
dhtmlXCellObject.prototype.attachOProductCard = function(attr) {

	if(!attr)
		attr = {};

	this.attachHTMLString($p.injected_data['product_card.html']);

	baron({
		root: '.wdg_product_accordion',
		scroller: '.scroller',
		bar: '.scroller__bar',
		barOnCls: 'baron',

		$: $,   // Local copy of jQuery-like utility

		event: function(elem, event, func, mode) { // Events manager
			if (mode == 'trigger') {
				mode = 'fire';
			}
			bean[mode || 'on'](elem, event, func);
		}
	}).fix({
		elements: '.header__title',
		outside: 'header__title_state_fixed',
		before: 'header__title_position_top',
		after: 'header__title_position_bottom',
		clickable: true
	}).pull({
		block: '.load',
		elements: [{
			self: '.load__value',
			property: 'width'
		}],
		limit: 115,
		onExpand: function() {
			$('.load').css('background', 'grey');
		}
	});


	var _cell = this.cell,
		res = {
			container: _cell.querySelector(".wdg_product_accordion"),
			header: _cell.querySelector("[name=header]"),
			title: _cell.querySelector("[name=title]"),
			path: _cell.querySelector("[name=path]"),
			main: new CardMain(_cell.querySelector("[name=main]")),
			description: _cell.querySelector("[name=description]"),
			properties: _cell.querySelector("[name=properties]"),
			notes: new OMarketReviews(_cell.querySelector("[name=notes]")),
			download: _cell.querySelector("[name=download]"),
			head_layout: null,
			head_fields: null
		},

		path = new $p.iface.CatalogPath(res.path, function (e) {
			var hprm = $p.job_prm.parse_url();
			$p.iface.set_hash(this.ref, "", hprm.frm, hprm.view);
			return $p.cancel_bubble(e)
		});

	//if($p.device_type != "desktop")
	//	res.download.style.visibility = "hidden";

	// кнопка "вернуться к списку"
	new $p.iface.OTooolBar({
		wrapper: res.header,
		width: '28px',
		height: '29px',
		top: '0px',
		right: '20px',
		name: 'back',
		class_name: "",
		buttons: [
			{name: 'back', text: '<i class="fa fa-long-arrow-left fa-lg" style="vertical-align: 15%;"></i>', title: 'Вернуться к списку', float: 'right'}
		],
		onclick: function (name) {
			switch (name) {
				case "back":
					var hprm = $p.job_prm.parse_url();
					$p.iface.set_hash(hprm.obj, "", hprm.frm, hprm.view);
					if($p.iface.popup)
						$p.iface.popup.hide();
					break;
			}
		}
	});

	/**
	 * Перезаполняет все ячейки аккордеона
	 * @param ref
	 */
	function requery(ref){

		// информацию про номенклатуру, полученную ранее используем сразу
		var nom = res.nom = $p.cat.Номенклатура.get(ref, false);
		res.main.requery_short(nom);

		// дополнительное описание получаем с сервера и перезаполняем аккордеон
		if(nom.is_new()){

			nom.load()
				.then(res.main.requery_long)
				.catch($p.record_log);
		}else
			res.main.requery_long(nom);

	}

	/**
	 * Изображение, цена и кнопки купить - сравнить - добавить
	 * @param cell {HTMLElement}
	 * @constructor
	 */
	function CardMain(cell){

		var _img = cell.querySelector(".product_img"),
			_title = cell.querySelector("[name=order_title]"),
			_price = cell.querySelector("[name=order_price]"),
			_brand = cell.querySelector("[name=order_brand]"),
			_carousel = new dhtmlXCarousel({
				parent:         cell.querySelector(".product_carousel"),
				offset_left:    0,      // number, offset between cell and left/right edges
				offset_top:     0,      // number, offset between cell and top/bottom edges
				offset_item:    0,      // number, offset between two nearest cells
				touch_scroll:   true    // boolean, true to enable scrolling cells with touch
		});

		function set_title(nom){
			_title.innerHTML = res.title.innerHTML = nom.НаименованиеПолное || nom.name;
		}

		// короткое обновление свойств без обращения к серверу
		this.requery_short = function (nom) {
			set_title(nom);
			_price.innerHTML = dhtmlXDataView.prototype.types.list.price(nom);
			_img.src = "templates/product_pics/" + nom.ФайлКартинки.ref + ".png";
			if(!nom.Файлы){
				_carousel.base.style.display = "none";
				_img.style.display = "";
			}

			// сбрасываем текст отзывов с маркета
			res.notes.model = nom.МаркетИд;
		};

		// длинное обновление свойств после ответа сервера
		this.requery_long = function (nom) {
			var files = JSON.parse(nom.Файлы || "[]");

			if(files.length){
				// удаляем страницы карусели
				var ids = [];
				_carousel.forEachCell(function(item){
					ids.push(item.getId());
				});
				ids.forEach(function (id) {
					_carousel.cells(id).remove();
				});

				// рисуем новые страницы
				_img.style.display = "none";
				_carousel.base.style.display = "";
				files.forEach(function (file) {
					ids = _carousel.addCell();
					_carousel.cells(ids).attachHTMLString('<img class="aligncenter" style="height: 100%" src="templates/product_pics/'+file.ref+'.'+file.ext+'" >');
				});

			}else{
				// одиночное изображение
				_carousel.base.style.display = "none";
				_img.style.display = "";
			}

			// обновляем наименование - оно могло измениться
			set_title(nom);

			//
			if(nom.Марка != $p.blank.guid)
				_brand.innerHTML = "Марка (бренд): " + nom.Марка.presentation;

			else if(nom.Производитель != $p.blank.guid){
				_brand.innerHTML = "Производитель: " + nom.Производитель.presentation;

			}

			// описание и свойства
			if(nom.ФайлОписанияДляСайта.empty()){
				// если у номенклатуры нет описания, скрываем блок
				res.description.style.display = "none";
			}else {
				res.description.style.display = "";
				$p.ajax.get("templates/product_descriptions/" + nom.ФайлОписанияДляСайта.ref + ".html")
					.then(function (req) {
						res.description.innerHTML = req.response;
					})
					.catch(function (err) {
						$p.record_log(nom.ФайлОписанияДляСайта.ref)
					});
			}

			// таблица реквизитов объекта
			if(!res.head_layout){
				res.head_layout = new dhtmlXLayoutObject({
					parent:     res.properties,
					pattern:    "1C",
					offsets: {
						top:    8,
						right:  0,
						bottom: 0,
						left:   0
					},
					cells: [
						{
							id:     "a",
							text:   "Свойства и категории",
							header: false
						}
					]
				});
			}
			if(res.head_fields)
				res.head_layout.cells("a").detachObject(true);
			res.head_fields = res.head_layout.cells("a").attachHeadFields({obj: nom});
			res.head_fields.setEditable(false);

			// текст отзывов с маркета
			res.notes.model = nom.МаркетИд;

		};

		// подписываемся на событие изменения размера
		dhx4.attachEvent("layout_resize", function (layout) {
			$p.record_log("");
		});

		// навешиваем обработчики на кнопки - генерируем широковещательное событие
		function btn_msg(){
			dhx4.callEvent(this.name, [res.nom]);
		}
		["order_cart", "order_compare"].forEach(function (name) {
			cell.querySelector("[name=" + name + "]").onclick = btn_msg;
		})


	}



	// обработчик маршрутизации
	$p.eve.hash_route.push(function (hprm){
		if(hprm.view == "catalog" && $p.is_guid(hprm.ref) && !$p.is_empty_guid(hprm.ref))
			requery(hprm.ref);
	});

	if(attr.ref){
		requery(attr.ref);
		delete attr.ref;
	}

	return res;

};
/**
 *
 * Created 10.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_products_view
 */

/**
 * ### Визуальный компонент списка товаров
 * - Отображает dataview товаров
 * - В шапке содержит хлебные крошки и фильтр по подстроке
 * - Использует [dhtmlxLayout](http://docs.dhtmlx.com/layout__index.html) и ODynDataView
 * - Автоматически перерисовывается при изменении отбора по виду номенклатуры
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachOProductsView` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OProductsView
 * @param attr {Object} - параметры создаваемого компонента
 * @constructor
 */
dhtmlXCellObject.prototype.attachOProductsView = function(attr) {

	if(!attr)
		attr = {};


	var _cell = this.cell,

	// внешний контейнер
		layout = document.createElement('div'),

	// указатель на хлебные крошки
		path,

	// указатель на dataview и параметры dataview
		dataview, dataview_attr;


	this.attachObject(layout);

	// Область строки поиска
	(function(){

		// шапка
		var div_head = document.createElement('div'),

		// контейнер строки поиска
			div_search = document.createElement('div'),

		// собственно, строка поиска
			input_search = document.createElement('input'),

		// икона поиска
			icon_search = document.createElement('i');

		div_head.className = "md_column320";
		layout.appendChild(div_head);

		if($p.device_type != "desktop")
			div_head.style.padding = "4px 8px";

		// хлебные крошки
		path = new $p.iface.CatalogPath(div_head);

		// строка поиска
		div_search.className = "search";
		div_head.appendChild(div_search);
		div_search.appendChild(input_search);
		div_search.appendChild(icon_search);
		icon_search.className="icon_search fa fa-search";
		input_search.className = "search";
		input_search.type = "search";
		input_search.placeholder = "Введите артикул или текст";
		input_search.title = "Найти товар по части наименования, кода или артикула";
		input_search.onchange = function (e) {
			dhx4.callEvent("search_text_change", [this.value]);
			this.blur();
		}

	})();

	// Область сортировки
	(function(){

		var md_column320 = document.createElement('div'),
			sort = document.createElement('div'),
			values = [
				'по возрастанию цены <i class="fa fa-sort-amount-asc fa-fw"></i>',
				'по убыванию цены <i class="fa fa-sort-amount-desc fa-fw"></i>',
				'по наименованию <i class="fa fa-sort-alpha-asc fa-fw"></i>',
				'по наименованию <i class="fa fa-sort-alpha-desc fa-fw"></i>',
				'по популярности <i class="fa fa-sort-numeric-asc fa-fw"></i>',
				'по популярности <i class="fa fa-sort-numeric-desc fa-fw"></i>'
			];

		md_column320.className = "md_column320";
		layout.appendChild(md_column320);
		md_column320.appendChild(sort);

		$p.iface.ODropdownList({
			container: sort,
			title: "Сортировать:" + ($p.device_type == "desktop" ? "<br />" : " "),
			values: values,
			class_name: "catalog_path",
			event_name: "sort_change"
		});

		dhx4.attachEvent("sort_change", function (v) {
			$p.record_log(v);
		});

	})();

	// Область ODynDataView
	(function(){

		// пагинация
		var div_pager = document.createElement('div'),

		// контейнер dataview
			div_dataview = document.createElement('div'),

		// внешний контейнер dataview
			div_dataview_outer = document.createElement('div');

		// получаем заготовку номенклдатуры с минимальными полями
		function nom_from_id(id){
			var dv_obj = ({})._mixin(dataview.get(id));
			dv_obj.ref = dv_obj.id;
			dv_obj.id = dv_obj.Код;
			dv_obj._not_set_loaded = true;
			delete dv_obj.Код;
			return $p.cat.Номенклатура.create(dv_obj);
		}

		// ODynDataView
		layout.appendChild(div_dataview_outer);
		div_dataview_outer.appendChild(div_dataview);

		div_pager.classList.add("wb-tools");
		div_dataview_outer.style.clear = "both";
		div_dataview_outer.style.height = div_dataview.style.height = _cell.offsetHeight + "px";
		div_dataview_outer.style.width = div_dataview.style.width = _cell.offsetWidth + "px";

		dataview_attr = {
			container: div_dataview,
			outer_container: div_dataview_outer,
			type: "list",
			custom_css: true,
			autowidth: 1,
			pager: {
				container: div_pager,
				size:30,
				template: "{common.prev()}<div class='paging_text'> Страница {common.page()} из #limit#</div>{common.next()}"
			},
			fields: ["ref", "name"],
			selection: {},
			hash_route : function (hprm) {
				if(hprm.obj && dataview_attr.selection.ВидНоменклатуры != hprm.obj){

					// обновляем вид номенклатуры и перевзводим таймер обновления
					dataview_attr.selection.ВидНоменклатуры = hprm.obj;
					dataview.lazy_timer();

				}
			}
		};
		dataview = dhtmlXCellObject.prototype.attachDynDataView(
			{
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СписокНоменклатуры/",
				class_name: "cat.Номенклатура"
			}, dataview_attr);

		// обработчик события изменения текста в строке поиска
		dhx4.attachEvent("search_text_change", function (text) {
			// обновляем подстроку поиска и перевзводим таймер обновления
			if(text)
				dataview_attr.selection.text = function (){
					return "text like '%25" + text + "%25'";
				};
			else if(dataview_attr.selection.hasOwnProperty("text"))
				delete dataview_attr.selection.text;

			dataview.lazy_timer();

		});

		dhx4.attachEvent("filter_prop_change", function (filter_prop) {

			// обновляем подстроку поиска и перевзводим таймер обновления
			dataview_attr.filter_prop = filter_prop;
			dataview.lazy_timer();

		});

		// подключаем пагинацию
		div_dataview_outer.appendChild(div_pager);

		// подключаем контекстное меню

		// подписываемся на события dataview
		dataview.attachEvent("onAfterSelect", function (id){
			// your code here
		});

		dataview.attachEvent("onItemDblClick", function (id, ev, html){

			var hprm = $p.job_prm.parse_url();

			nom_from_id(id)
				.then(function (o) {
					$p.iface.set_hash(hprm.obj, id, hprm.frm, hprm.view);
				});

			return false;
		});

		// подписываемся на событие изменения размера во внешнем layout и изменение ориентации устройства
		dhx4.attachEvent("layout_resize", function (layout) {
			div_dataview_outer.style.height = div_dataview.style.height = _cell.offsetHeight + "px";
			div_dataview_outer.style.width = div_dataview.style.width = _cell.offsetWidth + "px";
			dataview.refresh();
		});

		div_dataview.addEventListener('click', function (e) {
			var target = e.target,
				elm = dataview.get_elm(e.target);

			if(elm){

				if(target.classList.contains("dv_icon_cart")){
					nom_from_id(elm.id)
						.then(function (o) {
							dhx4.callEvent("order_cart", [o]);
						});

				}else if(target.classList.contains("dv_icon_add_compare")){
					nom_from_id(elm.id)
						.then(function (o) {
							dhx4.callEvent("order_compare", [o]);
						});

				}else if(target.classList.contains("dv_icon_detail"))
					dataview.callEvent("onItemDblClick", [elm.id]);
			}
		}, false);


	})();


	return dataview;
};

$p.iface.CatalogPath = function CatalogPath(parent, onclick){

	var id = undefined,
		div = document.createElement('div');
	div.className = "catalog_path";
	parent.appendChild(div);

	// Обработчик маршрутизации
	function hash_route (hprm) {
		if(id != hprm.obj){
			id = hprm.obj;

			var child,
			// получаем массив пути
				path = $p.cat.ВидыНоменклатуры.path(id);

			// удаляем предыдущие элементы
			while(child = div.lastChild){
				div.removeChild(child);
			}

			var a = document.createElement('span');
			if(path.length && path[0].presentation)
				a.innerHTML = '<i class="fa fa-folder-open-o"></i> ';
			else
				a.innerHTML = '<i class="fa fa-folder-open-o"></i> Поиск во всех разделах каталога';
			div.appendChild(a);

			// строим новый путь
			while(child = path.pop()){

				if(div.children.length > 1){
					a = document.createElement('span');
					a.innerHTML = " / ";
					div.appendChild(a);
				}
				a = document.createElement('a');
				a.innerHTML = child.presentation;
				a.ref = child.ref;
				a.href = "#";
				a.onclick = onclick || function (e) {
					var hprm = $p.job_prm.parse_url();
					if(hprm.obj != this.ref)
						$p.iface.set_hash(this.ref, "", hprm.frm, hprm.view);
					return $p.cancel_bubble(e)
				};
				div.appendChild(a);
			}

		}
	};

	// подписываемся на событие hash_route
	$p.eve.hash_route.push(hash_route);

	setTimeout(function () {
		hash_route($p.job_prm.parse_url());
	}, 50);

}
/**
 *
 * Created 07.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  wdg_multi_reviews
 */

/**
 * ### Визуальный компонент - отзывы о товаре с Яндекс.Маркета
 * - Показывает список отзывов
 * - "https://api.content.market.yandex.ru/v1/model/" + id + "/opinion.json"
 *
 * @class OMarketReviews
 * @param container {HTMLElement} - div, в котором будет расположен компонент
 * @constructor
 */
function OMarketReviews(container) {

	var _model, _empty;

	function empty_text(){
		if(!_empty){
			container.innerHTML = '<p class="text">Пока нет ни одного комментария, ваш будет первым</p>';
			_empty = true;
		}
	}

	empty_text();

	// подписываемся на сообщения socket_msg
	dhx4.attachEvent("socket_msg", function (data) {
		if(!data || !data.rows || data.type != "opinion")
			return;
		data.rows.forEach(function (opinion) {
			if(opinion.model == _model){
				if(_empty){
					container.innerHTML = '';
					_empty = false;
				}
				opinion.opinion.forEach(function (op) {
					container.innerHTML += '<p class="text">' + op.pro + '</p>';
				});
			}
		});
	});

	this.__define({

		model: {
			get: function () {
				return _model;
			},
			set: function (v) {
				if(_model == v)
					return;
				_model = v;
				empty_text();

				// запрашиваем у сокет-сервера отзывы с Маркета
				if(_model)
					$p.eve.socket.send({type: "opinion", model: _model});
			}
		}
	});

};



/**
 * Главное окно интернет-магазина
 * Created 21.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @author    Evgeniy Malyarov
 * @module  init.js
 */

/**
 * Процедура устанавливает параметры работы программы, специфичные для текущей сборки
 * @param prm {Object} - в свойствах этого объекта определяем параметры работы программы
 * @param modifiers {Array} - сюда можно добавить обработчики, переопределяющие функциональность объектов данных
 */
$p.settings = function (prm, modifiers) {

	// для транспорта используем rest, а не сервис http
	prm.rest = true;
	prm.irest_enabled = true;

	// разделитель для localStorage
	prm.local_storage_prefix = "webshop_";

	// расположение rest-сервиса ut
	prm.rest_path = "/a/ut11/%1/odata/standard.odata/";

	// расположение socket-сервера
	//prm.ws_url = "ws://localhost:8001";

	// по умолчанию, обращаемся к зоне %%%
	prm.zone = 0;

	// расположение файлов данных
	prm.data_url = "data/";

	// расположение файла инициализации базы sql
	//prm.create_tables_sql = $p.injected_data['create_tables.sql'];

	// расположение страницы настроек
	prm.settings_url = "settings.html";

	// разрешаем сообщения от других окон
	// prm.allow_post_message = "*";

	// используем геокодер
	prm.use_ip_geo = true;

	// полноэкранный режим на мобильных
	//prm.request_full_screen = true;

	// логин гостевого пользователя
	prm.guest_name = "АлхимовАА";

	// пароль гостевого пользователя
	prm.guest_pwd = "";

	// т.к. стили надо грузить в правильном порядке, а файлы базовых css зависят от скина - их имена на берегу не известны,
	// задаём список файлов css для отложенной загрузки
	prm.additional_css = ["templates/webshop.css", "templates/webshop_ie_only.css"];

	// скин по умолчанию
	prm.skin = "dhx_terrace";

	// разрешаем покидать страницу без лишних вопросов
	$p.eve.redirect = true;


};

/**
 * Рисуем основное окно при инициализации документа
 */
$p.iface.oninit = function() {

	$p.iface.sidebar_items = [
		{id: "catalog", text: "Каталог", icon: "search_48.png"},
		{id: "compare", text: "Сравнение", icon: "compare_48.png"},
		{id: "cart", text: "Корзина", icon: "shop_cart_48.png"},
		{id: "orders", text: "Заказы", icon: "projects_48.png"},
		{id: "content", text: "Контент", icon: "content_48.png"},
		{id: "user", text: "Профиль", icon: "contacts_48.png"},
		{id: "settings", text: "Настройки", icon: "settings_48.png"},
		{id: "about", text: "О программе", icon: "about_48.png"}
	];

	function oninit(){

		var toolbar, hprm, items,  _items = $p.wsql.get_user_param("sidebar_items", "object");
		if(_items && Array.isArray(_items) && _items.length){
			items = [];
			for(var i in _items){
				if(_items[i][0])
					items.push($p.iface.sidebar_items[i])
			}
		}else
			items = $p.iface.sidebar_items;

		// гасим заставку
		document.body.removeChild(document.querySelector("#webshop_splash"));

		// при первой возможности создаём layout
		if($p.device_type == "desktop"){

			$p.iface.main = new dhtmlXSideBar({
				parent: document.body,
				icons_path: "templates/imgs/dhxsidebar" + dhtmlx.skin_suffix(),
				width: 110,
				template: "icons_text",
				items: items,
				offsets: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				}
			});

			toolbar = $p.iface.main.attachToolbar({
				icons_size: 24,
				icons_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
				items: [
					{type: "text", id: "title", text: "&nbsp;"},
					{type: "spacer"},
					{type: "text", id: "right", text: "[Город клиента и мантра магазина]"}
				]
			});

		}else{
			$p.iface.main = new dhtmlXSideBar({
				parent: document.body,
				icons_path: "templates/imgs/dhxsidebar" + dhtmlx.skin_suffix(),
				width: 180,
				header: true,
				template: "tiles",
				autohide: true,
				items: items,
				offsets: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				}
			});
		}

		// подписываемся на событие навигации по сайдбару
		$p.iface.main.attachEvent("onSelect", function(id){

			if($p.device_type == "desktop")
				toolbar.setItemText("title", window.dhx4.template("<span style='font-weight: bold; font-size: 14px;'>#text#</span>", {text: this.cells(id).getText().text}));

			hprm = $p.job_prm.parse_url();
			if(hprm.view != id)
				$p.iface.set_hash(hprm.obj, "", hprm.frm, id);

			$p.iface["view_" + id]($p.iface.main.cells(id));

		});

		// шаблоны инициализируем сразу
		init_templates();

		// еще, сразу инициализируем класс OViewCompare, т.к. в нём живут обработчики добавления в корзину и история просмотров
		// и класс OViewCart, чтобы обрабатывать события добавления в корзину
		setTimeout(function () {
			if($p.iface.main.cells("compare"))
				$p.iface.view_compare($p.iface.main.cells("compare"));
			if($p.iface.main.cells("cart"))
				$p.iface.view_cart($p.iface.main.cells("cart"));
		}, 50);

		hprm = $p.job_prm.parse_url();
		if(!hprm.view || $p.iface.main.getAllItems().indexOf(hprm.view) == -1){
			var last_hprm = $p.wsql.get_user_param("last_hash_url", "object");
			if(last_hprm)
				$p.iface.set_hash(last_hprm.obj, last_hprm.ref, last_hprm.frm, last_hprm.view || "catalog");
			else
				$p.iface.set_hash(hprm.obj, hprm.ref, hprm.frm, $p.device_type == "desktop" ? "content" : "catalog");
		} else
			setTimeout($p.iface.hash_route, 10);

		// подписываемся на событие геолокатора
		// если геолокатор ответит раньше, чем сформируется наш интерфейс - вызовем событие повторно через 3 сек
		if($p.iface.main.getAttachedToolbar){
			var tb = $p.iface.main.getAttachedToolbar(), city;
			if(tb){
				$p.ipinfo.ipgeo().then(function (pos) {
					if(pos.city && pos.city.name_ru)
						city = pos.city.name_ru;
					else if(pos.region && pos.region.name_ru)
						city = pos.city.region;

					tb.setItemText("right", '<i class="fa fa-map-marker"></i> ' + city.replace("г. ", ""));
					tb.objPull[tb.idPrefix+"right"].obj.style.marginRight = "8px";
				});
			}
		}
	}


	// подписываемся на событие при закрытии страницы - запоминаем последний hash_url
	window.addEventListener("beforeunload", function () {
		$p.wsql.set_user_param("last_hash_url", $p.job_prm.parse_url())
	});

	// подписываемся на событие готовности метаданных - после него можно грузить данные
	dhx4.attachEvent("meta", function () {

		$p.eve.auto_log_in()
			.then(oninit)
			.catch(function (err) {
				console.log(err);
			})
			.then(function (err) {
				if($p.iface.sync)
					$p.iface.sync.close();
			});

	});

};

/**
 * Обработчик маршрутизации
 * @param hprm
 * @return {boolean}
 */
$p.eve.hash_route.push(function (hprm) {

	// view отвечает за переключение закладки в SideBar
	if(hprm.view && $p.iface.main.getActiveItem() != hprm.view){
		$p.iface.main.getAllItems().forEach(function(item){
			if(item == hprm.view)
				$p.iface.main.cells(item).setActive(true);
		});
	}
	return false;
});
/**
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_catalog
 */

$p.iface.view_catalog = function (cell) {

	// Динамический фильтр
	function prop_filter(){
		if(!$p.iface._catalog.filter)
			$p.iface._catalog.filter = $p.iface._catalog.navigation.cells("filter").attachPropFilter($p.cat.ВидыНоменклатуры);
	}

	// Карточка товара
	function product_card(cell, ref){

		if(!$p.iface._catalog.product_card)
			$p.iface._catalog.product_card = cell.attachOProductCard({
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СвойстваНоменклатуры",
				class_name: "cat.Номенклатура",
				ref: ref
			});

		cell.setActive();
	}

	// Список товаров
	function products_view(cell){
		if(!$p.iface._catalog.dataview)
			$p.iface._catalog.dataview = cell.attachOProductsView();
	}

	// Дерево видов номенклатуры
	function products_tree(cell){

		var tree = cell.attachDynTree($p.cat.ВидыНоменклатуры, {}, function () {
			$p.cat.ПредопределенныеЭлементы.by_name("ВидНоменклатуры_ПоказыватьВМагазине").Элементы.each(function (o) {
				tree.openItem(o.Элемент.ref);
			})
		});
		tree.attachEvent("onSelect", function(id){
			var hprm = $p.job_prm.parse_url();
			if(hprm.obj != id)
				$p.iface.set_hash(id, "", hprm.frm, hprm.view);
		});

		// подписываемся на событие hash_route
		function hash_route(hprm){
			if(tree){
				if(!hprm.obj)
					hprm.obj = $p.blank.guid;
				tree.selectItem(hprm.obj, false, false);
			}
		}
		$p.eve.hash_route.push(hash_route);
		setTimeout(function () {
			hash_route($p.job_prm.parse_url());
		}, 50);

		return tree;
	}

	// Разбивка в зависимости от типов устройств
	function view_catalog(){

		$p.iface._catalog = {};
		if($p.device_type == "desktop"){
			$p.iface._catalog.layout = cell.attachLayout({
				pattern: "2U",
				cells: [
					{id: "a", text: "Каталог", width: 300, header: false},
					{id: "b", text: "Товары", header: false}
				],
				offsets: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				}
			});
			$p.iface._catalog.layout.attachEvent("onResizeFinish", function(){
				dhx4.callEvent("layout_resize", [this]);
			});
			$p.iface._catalog.layout.attachEvent("onPanelResizeFinish", function(){
				dhx4.callEvent("layout_resize", [this]);
			});

			// Tabbar - дерево и фильтр
			$p.iface._catalog.navigation = $p.iface._catalog.layout.cells("a").attachTabbar({
				arrows_mode:    "auto",
				tabs: [
					{id: "tree", text: '<i class="fa fa-sitemap"></i> Разделы', active: true},
					{id: "filter", text: '<i class="fa fa-filter"></i> Фильтр'}
				]
			});

			// карусель с dataview и страницей товара
			$p.iface._catalog.carousel = $p.iface._catalog.layout.cells("b").attachCarousel({
				keys:           false,
				touch_scroll:   false,
				offset_left:    0,
				offset_top:     0,
				offset_item:    0
			});

			setTimeout(function () {
				products_view($p.iface._catalog.carousel.cells("dataview"));
			})

		}else{
			$p.iface._catalog.navigation = cell.attachTabbar({
				arrows_mode:    "auto",
				tabs: [
					{id: "tree", text: '<i class="fa fa-sitemap"></i> Разделы', active: true},
					{id: "filter", text: '<i class="fa fa-filter"></i> Фильтр'},
					{id: "goods", text: '<i class="fa fa-search"></i> Товары'}
				]
			});

			// карусель с dataview и страницей товара
			$p.iface._catalog.carousel = $p.iface._catalog.navigation.cells("goods").attachCarousel({
				keys:           false,
				touch_scroll:   false,
				offset_left:    0,
				offset_top:     0,
				offset_item:    0
			});
		}

		// страницы карусели
		$p.iface._catalog.carousel.hideControls();
		$p.iface._catalog.carousel.addCell("dataview");
		$p.iface._catalog.carousel.addCell("goods");


		// обработчик при изменении закладки таббара
		$p.iface._catalog.navigation.attachEvent("onSelect", function (id) {
			if(id=="filter")
				prop_filter();
			else if(id=="goods")
				products_view($p.iface._catalog.carousel.cells("dataview"));
			return true;
		});

		// Динамическое дерево
		$p.iface._catalog.tree = products_tree($p.iface._catalog.navigation.cells("tree"));

		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(function (hprm){

			var nom = $p.cat.Номенклатура.get(hprm.ref, false, true);

			if(hprm.view == "catalog"){

				// при непустой ссылке, показываем карточку товара
				// если ссылка является номенклатурой - устанавливаем вид номенклатуры
				if(nom && !nom.empty()){

					if(hprm.obj != nom.ВидНоменклатуры.ref)
						hprm.obj = nom.ВидНоменклатуры.ref;
					if(hprm.obj != $p.iface._catalog.tree.getSelectedItemId())
						$p.iface._catalog.tree.selectItem(hprm.obj, false);

					product_card($p.iface._catalog.carousel.cells("goods"), hprm.ref);

				}
				// если указан пустой вид номенклатуры - используем текущий элемент дерева
				else if(!$p.cat.ВидыНоменклатуры.get(hprm.obj, false, true) || $p.cat.ВидыНоменклатуры.get(hprm.obj, false, true).empty()){
					if(!$p.is_empty_guid($p.iface._catalog.tree.getSelectedItemId()))
						hprm.obj = $p.iface._catalog.tree.getSelectedItemId();

				}
				// иначе - переключаемся на закладку списка
				else
					$p.iface._catalog.carousel.cells("dataview").setActive();
			}

		});

	}

	// создаём элементы
	if(!$p.iface._catalog)
		view_catalog();

	return $p.iface._catalog;
};

/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_cart
 */

$p.iface.view_cart = function (cell) {

	var _requered;

	function OViewCart(){

		// карусель с dataview корзины и страницей оформления заказа
		var t = this,
			_cell = cell,
			prefix = "view_cart",
			_carousel = _cell.attachCarousel({
				keys:           false,
				touch_scroll:   false,
				offset_left:    0,
				offset_top:     0,
				offset_item:    0
			}),
			_container_cart,
			_container_order,
			_content,
			_dataview,
			_cart,
			_do_order;

		/**
		 * Возвращает список товаров в корзине
		 * @return {Array}
		 */
		t.list = function () {
			var list = $p.wsql.get_user_param(prefix, "object");
			if(!Array.isArray(list)){
				list = [];
				$p.wsql.set_user_param(prefix, list);
			}
			return list;
		};

		t.bubble = function () {
			var bubble = 0;
			t.list().forEach(function (o) {
				bubble += o.count;
			});
			if(bubble)
				_cell.setBubble(bubble);
			else
				_cell.clearBubble();
			return bubble;
		};

		/**
		 * Добавляет номенклатуру в корзину. Если уже есть, увеличивает количество
		 * @param nom {CatObj|String} - объект номенклатуры или ссылка
		 */
		t.add = function (nom) {

			if(typeof nom == "string"){
				if($p.is_empty_guid(nom))
					return;
				nom = $p.cat.Номенклатура.get(nom, false, true);
			}
			if(!nom || !nom.name)
				return;

			var list = t.list(),
				finded;

			for(var i in list){
				if(list[i].ref == nom.ref){
					list[i].count++;
					finded = true;
					break;
				}
			}
			if(!finded){
				list.push({ref: nom.ref, count: 1});
				$p.msg.show_msg((nom.НаименованиеПолное || nom.name) + " добавлен в корзину");
			}
			$p.wsql.set_user_param(prefix, list);

			t.requery()
				.then(function () {
					_cart.select(nom.ref);
				});

		};

		/**
		 * Удаляет номенклатуру из корзины
		 * @param ref {String} - ссылка номенклатуры
		 */
		t.remove = function (ref) {
			var list = t.list();

			for(var i in list){
				if(list[i].ref == ref || list[i].id == ref){

					dhtmlx.confirm({
						type:"confirm",
						title:"Корзина",
						text:"Подтвердите удаление товара",
						ok: "Удалить",
						cancel: "Отмена",
						callback: function(result){
							if(result){
								list.splice(i, 1);
								$p.wsql.set_user_param(prefix, list);
								t.requery();
							}
						}
					});

					return;
				}
			}
		};

		/**
		 * Уменьшает количество номенклатуры в корзине. При уменьшении до 0 - удаляет
		 * @param ref {String} - ссылка номенклатуры
		 */
		t.sub = function (ref, val) {
			var list = t.list();

			function save_and_requery(){
				$p.wsql.set_user_param(prefix, list);
				t.requery()
					.then(function () {
						_cart.select(ref);
					});
			}

			for(var i in list){
				if(list[i].ref == ref || list[i].id == ref){
					if(val){
						list[i].count = val;
						save_and_requery();

					}else if(val == undefined && list[i].count > 1){
						list[i].count--;
						save_and_requery();

					}else
						t.remove(ref);

					return;
				}
			}
		};

		/**
		 * Обновляет dataview и содержимое инфопанели
		 */
		t.requery = function () {

			var val = {count: t.bubble(), amount: 0};   // количество и сумма

			return _cart.requery_list(t.list())
				.then(function () {

					t.list().forEach(function (o) {
						var nom = $p.cat.Номенклатура.get(o.ref, false, true)
						val.amount += o.count * nom.Цена_Макс;
					});

					_do_order.querySelector("[name=top1]").innerHTML = dhx4.template($p.injected_data["cart_order_top1.html"], val);
					_do_order.querySelector("[name=top2]").innerHTML = dhx4.template($p.injected_data["cart_order_top2.html"], val);
					_do_order.querySelector("[name=top3]").innerHTML = (val.amount * 0.07).toFixed(0);

				});

		};


		function cart_input_change(e){

			var val = parseInt(e.target.value),
				elm = _cart.get_elm(e.target);

			if(isNaN(val))
				e.target.value = elm.count;
			else{
				elm.count = val;
				t.sub(elm.id, val);
			}

			return false;
		}

		function cart_click(e){

			var target = e.target,
				elm = _cart.get_elm(e.target);

			if(elm){

				if(target.classList.contains("dv_icon_plus"))
					t.add(elm.id);

				else if(target.classList.contains("dv_icon_minus"))
					t.sub(elm.id);

				else if(target.classList.contains("dv_input"))
					setTimeout(function () {
						target.focus();
						target.select();
						target = null;
					}, 300);
			}

		}

		// элементы создаём с задержкой, чтобы побыстрее показать основное содержимое
		setTimeout(function () {

			// страницы карусели
			_carousel.hideControls();
			_carousel.addCell("cart");
			_carousel.addCell("checkout");

			// корзина
			_carousel.cells("cart").attachHTMLString($p.injected_data["cart.html"]);
			_container_cart = _carousel.cells("cart").cell;
			_container_cart.firstChild.style.overflow = "auto";
			_content = _container_cart.querySelector(".md_column1300");
			_dataview = _container_cart.querySelector("[name=cart_dataview]");
			_do_order = _container_cart.querySelector("[name=cart_order]");
			_dataview.style.width = (_do_order.offsetLeft - 4) + "px";
			_dataview.style.height = (_container_cart.offsetHeight - _dataview.offsetTop - 20) + "px";

			window.addEventListener("resize", function () {
				setTimeout(function () {
					var s1 = _dataview.style, s2 = _dataview.firstChild.style, s3 = _dataview.firstChild.firstChild.style;
					s1.width = s2.width = s3.width = (_do_order.offsetLeft - 4) + "px";
					s1.height = s2.height = s3.height = (_container_cart.offsetHeight - _dataview.offsetTop - 20) + "px";
					_cart.refresh();
				}, 600);
			}, false);

			_cart = $p.iface.list_data_view({
				container: _dataview,
				height: "auto",
				type: "cart",
				custom_css: ["cart"],
				hide_pager: true,
				autowidth: true
			});

			_dataview.addEventListener('change', cart_input_change, false);
			_dataview.addEventListener('click', cart_click, false);

			t.bubble();

			// обработчик кнопки "оформить"
			_do_order.onclick = function (e) {
				if(e.target.tagName == "A" || e.target.getAttribute("name") == "order_order"
						|| e.path.indexOf(_do_order.querySelector(".dv_icon_card")) != -1){
					_carousel.cells("checkout").setActive();
					return $p.cancel_bubble(e);
				}
			};

			// оформление заказа
			_carousel.cells("checkout").attachHTMLString($p.injected_data["checkout.html"]);
			_container_order = _carousel.cells("checkout").cell;

			baron({
				root: '.wdg_product_checkout',
				scroller: '.scroller',
				bar: '.scroller__bar',
				barOnCls: 'baron',

				$: $,   // Local copy of jQuery-like utility

				event: function(elem, event, func, mode) { // Events manager
					if (mode == 'trigger') {
						mode = 'fire';
					}
					bean[mode || 'on'](elem, event, func);
				}
			}).fix({
				elements: '.header__title',
				outside: 'header__title_state_fixed',
				before: 'header__title_position_top',
				after: 'header__title_position_bottom',
				clickable: true
			}).pull({
				block: '.load',
				elements: [{
					self: '.load__value',
					property: 'width'
				}],
				limit: 115,
				onExpand: function() {
					$('.load').css('background', 'grey');
				}
			});


			// кнопка "вернуться к списку"
			new $p.iface.OTooolBar({
				wrapper: _container_order.querySelector("[name=header]"),
				width: '28px',
				height: '29px',
				top: '0px',
				right: '20px',
				name: 'back',
				class_name: "",
				buttons: [
					{name: 'back', text: '<i class="fa fa-long-arrow-left fa-lg" style="vertical-align: 15%;"></i>', title: 'Вернуться в корзину', float: 'right'}
				],
				onclick: function (name) {
					switch (name) {
						case "back":
							_carousel.cells("cart").setActive();
							break;
					}
				}
			});

			// клик выбора платежной системы
			_container_order.querySelector("[name=billing_kind]").onclick = function (ev) {

				if(ev.target.tagName == "A"){
					var provider;
					$("li", this).removeClass("active");
					ev.target.parentNode.classList.add("active");
					for(var i=0; i<ev.target.classList.length; i++){
						if(ev.target.classList.item(i).indexOf("logo-") == 0){
							provider = ev.target.classList.item(i).replace("logo-", "") + "-container";
							break;
						}
					}
					$(".billing-system", this.querySelector(".billing-systems-container")).each(function (e, t) {
						if(e.classList.contains(provider))
							e.classList.remove("hide");
						else if(!e.classList.contains("hide"))
							e.classList.add("hide");
					});

					ev.preventDefault();
					return $p.cancel_bubble(ev);
				}
			}


		}, 50);


		// подписываемся на событие добавления в корзину
		dhx4.attachEvent("order_cart", t.add);
	}

	if(!$p.iface._cart)
		$p.iface._cart = new OViewCart();

	if(!_requered && $p.job_prm.parse_url().view == "cart")
		setTimeout($p.iface._cart.requery, 200);

	return $p.iface._cart;

};

/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_compare
 */

/**
 * Показывает список просмотренных товаров + табы по видам номенклатуры с трансформом свойств
 * @param cell {dhtmlXCellObject}
 */
$p.iface.view_compare = function (cell) {

	function OViewCompare(){

		var t = this,
			_cell = cell,
			_dataview,
			prefix = "view_compare_",
			changed;

		/**
		 * Добавляет номенклатуру в список просмотренных и дополнительно, в список к сравнению
		 * @param ref {String} - ссылка номенклатуры
		 * @param to_compare {Boolean} - добавлять не только в просмотренные, но и к сравнению
		 * @return {Boolean}
		 */
		t.add = function (ref, to_compare) {

			if($p.is_empty_guid(ref))
				return;

			var list = t.list("viewed"),
				do_requery = false;

			function push(to_compare){
				if(list.indexOf(ref) == -1){
					list.push(ref);
					$p.wsql.set_user_param(prefix + (to_compare ? "compare" : "viewed"), list);
					do_requery = true;
				}
			}

			push();

			if(to_compare){
				list = t.list("compare");
				push(to_compare);

				var nom = $p.cat.Номенклатура.get(ref, false, true);
				if(nom){
					t.bubble();
					$p.msg.show_msg((nom.НаименованиеПолное || nom.name) + " добавлен к сравнению");
				}
			}

			if(do_requery)
				changed = true;

			return do_requery;

		};

		/**
		 * Удаляет номенклатуру из списка к сравнению и дополнительно, из списка просмотренных
		 * @param ref {String} - ссылка номенклатуры
		 * @param from_viewed {Boolean} - добавлять не только в просмотренные, но и к сравнению
		 */
		t.remove = function (ref, from_viewed) {
			var list = t.list("compare"),
				index = list.indexOf(ref);
			if(index != -1){
				list.splice(index, 1);
				$p.wsql.set_user_param(prefix + "compare", list);
			}
			if(from_viewed){
				list = t.list("viewed");
				index = list.indexOf(ref);
				if(index != -1){
					list.splice(index, 1);
					$p.wsql.set_user_param(prefix + "viewed", list);
				}
			}
			t.requery();
		};

		/**
		 * Возвращает список просмотренных либо список к сравнению
		 * @param type
		 * @return {*}
		 */
		t.list = function (type) {
			var list = $p.wsql.get_user_param(prefix + type, "object");
			if(!Array.isArray(list)){
				list = [];
				$p.wsql.set_user_param(prefix + type, list);
			}
			return list;
		};

		t.tabs = _cell.attachTabbar({
			arrows_mode:    "auto",
			tabs: [
				{id: "viewed", text: '<i class="fa fa-eye"></i> Просмотренные', active: true}
			]
		});

		t.bubble = function () {
			if(t.list("compare").length)
				_cell.setBubble(t.list("compare").length);
			else
				_cell.clearBubble();
		};

		t.requery = function () {


			var ids = t.tabs.getAllTabs(),
				mgr = $p.cat.Номенклатура,
				nom,

				// получаем полный список номенклатур
				list = t.list("compare").concat(t.list("viewed")).filter(function(item, pos, self) {
					return self.indexOf(item) == pos;
				});

			// удаляем допзакладки
			t.tabs.tabs("viewed").setActive();
			for (var i=0; i<ids.length; i++) {
				if(ids[i] != "viewed")
					t.tabs.tabs(ids[i]).close();
			}

			// убеждаемся, что все номенклатуры по использованным к сравнению ссылкам, есть в памяти
			// и получаем массив видов номенклатуры к сравнению
			ids = [];
			mgr.load_cached_server_array(list)
				.then(function () {
					t.list("compare").forEach(function (ref) {
						nom = mgr.get(ref, false);
						if(ids.indexOf(nom.ВидНоменклатуры) == -1)
							ids.push(nom.ВидНоменклатуры);
					});

					_dataview.requery_list(t.list("viewed"));
				})
				.then(function () {

					// добавляем закладки по видам н6оменклатуры
					ids.forEach(function (o) {
						t.tabs.addTab(o.ref, o.name);
						compare_group(t.tabs.cells(o.ref), o);
					});

				});

			t.bubble();

		};

		// подписываемся на событие добавления к сравнению
		dhx4.attachEvent("order_compare", function (nom) {
			if(typeof nom == "object")
				nom = nom.ref;
			if(!$p.is_empty_guid(nom)){
				if(t.add(nom, true))
					t.requery();
			}
		});

		function viewed_click(e){

			var target = e.target,
				elm = _dataview.get_elm(e.target);

			if(elm){

				if(target.classList.contains("dv_icon_cart"))
					dhx4.callEvent("order_cart", [elm.id]);

				else if(target.classList.contains("dv_icon_add_compare")){
					if(t.add(elm.id, true))
						t.requery();

				}else if(target.classList.contains("dv_icon_remove_viewed"))
					t.remove(elm.id, true);
			}
		}

		// строит таблицу сравнения и выводит её в ячейку
		function compare_group(tab_cell, ВидНоменклатуры){

			var nom, list = [], finded,
				_row_fields=" ,Цена,НаименованиеПолное,Артикул,Производитель".split(","),
				_rows = [],
				_row,
				_headers = " ",
				_types = "ro",
				_sortings = "na",
				_ids = "fld",
				_widths = $p.device_type == "desktop" ? "200" : "150",
				_minwidths = "100",
				_grid = tab_cell.attachGrid(),
				_price = dhtmlXDataView.prototype.types.list.price;
			_grid.setDateFormat("%d.%m.%Y %H:%fld");

			function presentation(v){

				if($p.is_data_obj(v))
					return  v.presentation;

				else if(typeof v == "boolean")
					return  v ? "Да" : "Нет";

				else if(v instanceof Date){
						if(v.getHours() || v.getMinutes())
							return $p.dateFormat(v, $p.dateFormat.masks.date_time);
						else
							return $p.dateFormat(v, $p.dateFormat.masks.date)
				}else
					return v || "";
			}

			t.list("compare").forEach(function (ref) {
				nom = $p.cat.Номенклатура.get(ref);
				if(nom.ВидНоменклатуры == ВидНоменклатуры){
					list.push(nom);
					_headers += "," + nom.name;
					_types += ",ro";
					_sortings += ",na";
					_ids += "," + nom.ref;
					_widths += ",*";
					_minwidths += ",100";
				}
			});

			// собственно табличная часть
			_grid.setIconsPath(dhtmlx.image_path);
			_grid.setImagePath(dhtmlx.image_path);
			_grid.setHeader(_headers);
			_grid.setInitWidths(_widths);
			_grid.setColumnMinWidth(_minwidths);
			_grid.setColSorting(_sortings);
			_grid.setColTypes(_types);
			_grid.setColumnIds(_ids);
			_grid.enableAutoWidth(true, 1300, 600);
			_grid.init();

			// формируем массив значений
			for(var fld in _row_fields){
				_row = [];
				if(fld == 0)
					_row.push("");
				else if(_row_fields[fld] == "НаименованиеПолное")
					_row.push("Наименование");
				else
					_row.push(_row_fields[fld]);

				for(var j in list){
					nom = list[j];
					if(fld == 0){
						_row.push("<img class='compare_img' src='templates/product_pics/" + nom.ФайлКартинки.ref + ".png' >");
					}else if(fld == 1){
						_row.push("<span style='font-size: large'>" + _price(nom) + "</span>");
					}else{
						_row.push(presentation(nom[_row_fields[fld]]));
					}
				}
				_rows.push(_row);
			}
			ВидНоменклатуры.НаборСвойств.extra_fields.find_rows({deleted: false}, function (o) {
				_row = [o.property.Заголовок || o.property.presentation];
				for(var j in list){
					nom = list[j];
					finded = false;
					nom.extra_fields.find_rows({property: o.property}, function (row) {
						_row.push(presentation(row.value));
						finded = true;
						return false;
					});
					if(!finded){
						if(o.property.type.types.length && o.property.type.types[0] == "boolean")
							_row.push(presentation(false));
						else
							_row.push("");
					}
				}
				_rows.push(_row);
			});
			_grid.parse(_rows,"jsarray");

		}

		// Обработчик маршрутизации
		function hash_route(hprm){

			// обновляем список при переключении
			if(hprm.view == "compare"){

				if(changed || changed === undefined){
					t.requery();
					changed = false;
				}

				// при открытии карточки в каталоге, добавляем в список просмотренных
			}else{

				if(hprm.view == "catalog" && !$p.is_empty_guid(hprm.ref)){
					if($p.cat.ВидыНоменклатуры.get(hprm.obj, false, true) && !$p.cat.ВидыНоменклатуры.get(hprm.obj, false, true).empty())
						t.add(hprm.ref);
				}

				t.bubble();
			}
		}

		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(hash_route);

		setTimeout(function () {

			// dataview со списком просмотренных товаров
			_dataview = $p.iface.list_data_view({
				container: t.tabs.cells("viewed"),
				custom_css: ["viewed"],
				type: "viewed",
				autosize: true
			});

			t.tabs.cells("viewed").cell.addEventListener('click', viewed_click, false);

			hash_route($p.job_prm.parse_url());

		}, 50);

	}

	if(!$p.iface._compare)
		$p.iface._compare = new OViewCompare();

	return $p.iface._compare;

};

/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_orders
 */

$p.iface.view_orders = function (cell) {

	function OViewOrders(){

		var t = this,
			attr = {url: ""},
			def_prm = {
				hide_header: true,
				hide_filter: true,
				date_from: new Date("2012-01-01")
			};

		t.tabs = cell.attachTabbar({
			arrows_mode:    "auto",
			tabs: [
				{id: "orders", text: '<i class="fa fa-suitcase"></i> Заказы', active: true},
				{id: "pays", text: '<i class="fa fa-money"></i> Оплаты'},
				{id: "shipments", text: '<i class="fa fa-shopping-bag"></i> Продажи'},
				{id: "balance", text: '<i class="fa fa-balance-scale"></i> Баланс'}
			]
		});

		// получаем список доступных текущему пользователю партнеров, договоров и контрагентов
		if($p.cat.Контрагенты.find()){
			t.orders = $p.doc.ЗаказКлиента.form_list(t.tabs.cells("orders"), def_prm);

		}else{
			$p.rest.build_select(attr, {
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СправочникиПользователя/",
				class_name: "cat.Пользователи"
			});
			$p.ajax.get_ex(attr.url, attr)
				.then(function (req) {
					$p.eve.from_json_to_data_obj(req);
				})
				.then(function (data) {
					t.orders = $p.doc.ЗаказКлиента.form_list(t.tabs.cells("orders"), def_prm);
				})
				.catch(function (err) {
					$p.record_log(err);
				});
		}


		// обработчик при изменении закладки таббара
		t.tabs.attachEvent("onSelect", function (id) {
			if(!t[id]){
				if(id == "pays"){
					t[id] = t.tabs.cells(id).attachTabbar({
						arrows_mode:    "auto",
						tabs: [
							{id: "bank", text: '<i class="fa fa-university"></i> Банк'},
							{id: "card", text: '<i class="fa fa-credit-card"></i> Карта'},
							{id: "cache", text: '<i class="fa fa-money"></i> Наличные'},
							{id: "refunds", text: '<i class="fa fa-undo"></i></i> Возвраты'}
						]
					});

					t[id].attachEvent("onSelect", function (subid) {
						if(!t[id + "_" + subid]) {
							if (subid == "bank") {
								t[id + "_" + subid] = $p.doc.ПоступлениеБезналичныхДенежныхСредств.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "card") {
								t[id + "_" + subid] = $p.doc.ОперацияПоПлатежнойКарте.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "cache") {
								t[id + "_" + subid] = $p.doc.ПриходныйКассовыйОрдер.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "refunds") {
								t[id + "_" + subid] = $p.doc.РасходныйКассовыйОрдер.form_list(t[id].cells(subid), def_prm);

							}
						}
						return true;
					});

					t[id].cells("bank").setActive();

				}else if(id == "shipments"){

					t[id] = t.tabs.cells(id).attachTabbar({
						arrows_mode:    "auto",
						tabs: [
							{id: "shipments", text: '<i class="fa fa-truck"></i> Отгрузки'},
							{id: "refunds", text: '<i class="fa fa-undo"></i></i> Возвраты'}
						]
					});

					t[id].attachEvent("onSelect", function (subid) {
						if(!t[id + "_" + subid]) {
							if (subid == "shipments") {
								t[id + "_" + subid] = $p.doc.РеализацияТоваровУслуг.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "refunds") {
								t[id + "_" + subid] = $p.doc.ВозвратТоваровОтКлиента.form_list(t[id].cells(subid), def_prm);

							}
						}
						return true;
					});

					t[id].cells("shipments").setActive();

				}else if(id == "balance"){


				}
			}
			return true;
		});

		// Обработчик маршрутизации
		function hash_route(hprm){

			// открываем форму выбранного объекта
			if(hprm.view == "orders"){

				var mgr = $p.md.mgr_by_class_name(hprm.obj);
				if(mgr && !$p.is_empty_guid(hprm.ref))
					mgr.form_obj(t.tabs.cells(t.tabs.getActiveTab()), hprm.ref);
			}
		}
		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(hash_route);

	}

	if(!$p.iface._orders)
		$p.iface._orders = new OViewOrders();

	return $p.iface._orders;

};

/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_settings
 */

$p.iface.view_settings = function (cell) {

	function view_settings(){
		$p.iface._settings = {};
		cell.attachHTMLString($p.injected_data['settings.html']);
		$p.iface._settings._cell = cell.cell.querySelector(".dhx_cell_cont_sidebar");
		$p.iface._settings._cell.style.overflow = "auto";
		$p.iface._settings._form1 = $p.iface._settings._cell.querySelector("[name=form1]");
		$p.iface._settings._form2 = $p.iface._settings._cell.querySelector("[name=form2]");
		$p.iface._settings._form3 = $p.iface._settings._cell.querySelector("[name=form3]");

		$p.iface._settings.form1 = new dhtmlXForm($p.iface._settings._form1.firstChild, [

			{ type:"settings", labelWidth:80, position:"label-left"  },

			{type: "label", labelWidth:320, label: "Тип устройства", className: "label_options"},
			{ type:"block" , name:"form_block_2", list:[
				{ type:"settings", labelAlign:"left", position:"label-right"  },
				{ type:"radio" , name:"device_type", labelWidth:120, label:'<i class="fa fa-desktop"></i> Компьютер', value:"desktop"},
				{ type:"newcolumn"   },
				{ type:"radio" , name:"device_type", labelWidth:150, label:'<i class="fa fa-mobile fa-lg"></i> Телефон, планшет', value:"phone"},
			]  },
			{type:"template", label:"",value:"",
				note: {text: "Класс устройства определяется автоматически, но пользователь может задать его явно", width: 320}},

			{type: "label", labelWidth:320, label: "Вариант оформления интерфейса", className: "label_options"},
			{type:"combo" , inputWidth: 220, name:"skin", label:"Скин", options:[
				{value: "dhx_web", text: "Web"},
				{value: "dhx_terrace", text: "Terrace"}
			]},
			{type:"template", label:"",value:"",
				note: {text: "Дополнительные свойства оформления можно задать в css", width: 320}},

			{type: "label", labelWidth:320, label: "Адрес http сервиса 1С", className: "label_options"},
			{type:"input" , inputWidth: 220, name:"rest_path", label:"Путь", validate:"NotEmpty"},
			{type:"template", label:"",value:"",
				note: {text: "Можно указать как относительный, так и абсолютный URL публикации 1С OData. " +
				"О настройке кроссдоменных запросов к 1С <a href='#'>см. здесь</a>", width: 320}},

			{type: "label", labelWidth:320, label: "Значение разделителя публикации 1С fresh", className: "label_options"},
			{type:"input" , inputWidth: 220, name:"zone", label:"Зона", numberFormat: ["0", "", ""], validate:"NotEmpty,ValidInteger"},
			{type:"template", label:"",value:"",
				note: {text: "Для неразделенной публикации, зона = 0", width: 320}}

		]);

		$p.iface._settings.form2 = new dhtmlXForm($p.iface._settings._form2.firstChild, [

			{ type:"settings", labelWidth:80, position:"label-left"  },

			{type: "label", labelWidth:320, label: "Доступные закладки", className: "label_options"},
			{
				type:"container",
				name: "views",
				inputWidth: 320,
				inputHeight: 300
			},
			{type:"template", label:"",value:"",
				note: {text: "Видимость и порядок закладок навигации", width: 320}},


		]);

		$p.iface._settings.form3 = new dhtmlXForm($p.iface._settings._form3.firstChild, [

			{ type:"settings", labelWidth:80, position:"label-left"  },
			{type: "button", name: "save", value: "Применить настройки", offsetTop: 20}

		]);

		// Таблица доступных закладок
		$p.iface._settings.grid = new dhtmlXGridObject($p.iface._settings.form2.getContainer("views"));
		$p.iface._settings.grid.setHeader(" ,Закладка");
		$p.iface._settings.grid.setInitWidths("50,*");
		$p.iface._settings.grid.setColumnMinWidth("40,200");
		$p.iface._settings.grid.setColSorting("na,na");
		$p.iface._settings.grid.setColTypes("ch,ro");
		$p.iface._settings.grid.enableAutoWidth(true, 800, 300);
		$p.iface._settings.grid.init();
		var _rows = $p.wsql.get_user_param("sidebar_items", "object");
		if(!_rows || !Array.isArray(_rows) || !_rows.length){
			_rows = [];
			$p.iface.sidebar_items.forEach(function (item) {
				_rows.push([1, item.text]);
			});
		}
		$p.iface._settings.grid.parse(_rows,"jsarray");
		$p.iface._settings.grid.cells(7,0).setDisabled(true);

		// инициализация свойств

		$p.iface._settings.form1.checkItem("device_type", $p.wsql.get_user_param("device_type"));


		["zone", "skin", "rest_path"].forEach(function (prm) {
			$p.iface._settings.form1.setItemValue(prm, $p.wsql.get_user_param(prm));
		});

		$p.iface._settings.form1.attachEvent("onChange", function (name, value, state){
			$p.wsql.set_user_param(name, value);
		});

		$p.iface._settings.form3.attachEvent("onButtonClick", function(name){
			for(var i in _rows){
				_rows[i][0] = $p.iface._settings.grid.cells(parseInt(i)+1, 0).isChecked() ? 1 : 0;
			}
			$p.wsql.set_user_param("sidebar_items", _rows);

			location.reload();
		});
	}

	if(!$p.iface._settings)
		view_settings();

	return $p.iface._settings;


};

/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_user
 */

$p.iface.view_user = function (cell) {

	function OViewUser(){

		var t = this,
			attr = {url: ""};

		function fill_tabs(){
			var user = $p.cat.ВнешниеПользователи.find(),
				def_prm = {
					hide_header: true,
					hide_filter: true
				};

			t.tabs.cells("main").attachHeadFields({obj: user});
			t.tabs.cells("main").attachToolbar({
				icons_size: 24,
				icons_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
				items: [
					{type: "text", id: "title", text: "<span style='font-size: large'>Реквизиты автризации</span>"}
				]
			});

			t.tabs.cells("contacts").attachTabular({
				obj: user.ОбъектАвторизации,
				ts: "КонтактнаяИнформация",
				read_only: true
			});

			$p.cat.Контрагенты.form_selection(t.tabs.cells("contractors"), def_prm);

			$p.cat.КартыЛояльности.form_selection(t.tabs.cells("discounts"), def_prm);

			$p.cat.КонтактныеЛицаПартнеров.form_selection(t.tabs.cells("persons"), def_prm);

		}

		t.tabs = cell.attachTabbar({
			arrows_mode:    "auto",
			tabs: [
				{id: "main", text: '<i class="fa fa-user"></i> Основное', active: true},
				{id: "contacts", text: '<i class="fa fa-paper-plane-o"></i> Адрес, телефон'},
				{id: "contractors", text: '<i class="fa fa-university"></i> Контрагенты'},
				{id: "discounts", text: '<i class="fa fa-credit-card-alt"></i> Карты лояльности'},
				{id: "persons", text: '<i class="fa fa-reddit-alien"></i> Контактные лица'}
			]
		});

		// получаем список доступных текущему пользователю партнеров, договоров и контрагентов
		if($p.cat.ВнешниеПользователи.find()){
			fill_tabs();
		}else{
			$p.rest.build_select(attr, {
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СправочникиПользователя/",
				class_name: "cat.Пользователи"
			});
			$p.ajax.get_ex(attr.url, attr)
				.then(function (req) {
					$p.eve.from_json_to_data_obj(req);
				})
				.then(fill_tabs)
				.catch(function (err) {
					$p.record_log(err);
				});
		}

		// Обработчик маршрутизации
		function hash_route(hprm){

			// открываем форму выбранного объекта
			if(hprm.view == "user"){

				var mgr = $p.md.mgr_by_class_name(hprm.obj);
				if(mgr && !$p.is_empty_guid(hprm.ref))
					mgr.form_obj(t.tabs.cells(t.tabs.getActiveTab()), hprm.ref);
			}
		}
		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(hash_route);

	}

	if(!$p.iface._user)
		$p.iface._user = new OViewUser();

	return $p.iface._user;

};

/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_content
 */

$p.iface.view_content = function (cell) {

	function view_content(){
		// http://html.metaphorcreations.com/apex/
		$p.iface._content = {};
		cell.attachHTMLString($p.injected_data["content.html"]);
		cell.cell.querySelector(".dhx_cell_cont_sidebar").style.overflow = "auto";
	}

	if(!$p.iface._content)
		view_content();

	return $p.iface._content;

};

/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_about
 */

$p.iface.view_about = function (cell) {

	function view_about(){
		$p.iface._about = {};
		cell.attachHTMLString($p.injected_data['about.html']);
		cell.cell.querySelector(".dhx_cell_cont_sidebar").style.overflow = "auto";
	}

	if(!$p.iface._about)
		view_about();

	return $p.iface._about;

};

/**
 *
 * Created 05.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  templates.js
 */

function init_templates() {

	// строка стиля картинки
	function get_image_style(o){
		if(o.ФайлКартинки != $p.blank.guid){
			return "background-image:url(templates/product_pics/"+o.ФайлКартинки+".png);";
		}
		return "";
	}

	// строка представления производителя
	function get_manufacturer(o){
		if(o.Производитель != $p.blank.guid){
			return $p.cat.Производители.get(o.Производитель).presentation;
		}
		return "";
	}

	// цена
	function get_price(o){
		if((!o.Цена_Мин || !o.Цена_Макс) && o.Характеристики){
			var x = JSON.parse(o.Характеристики);
			for(var i in x){
				if(!o.Цена_Мин || (x[i].Цена_Мин && o.Цена_Мин > x[i].Цена_Мин))
					o.Цена_Мин = x[i].Цена_Мин;
				if(!o.Цена_Макс || (x[i].Цена_Макс && o.Цена_Макс < x[i].Цена_Макс))
					o.Цена_Макс = x[i].Цена_Макс;
			}
		}
		if(!o.Цена_Мин)
			o.Цена_Мин = 0;
		if(!o.Цена_Макс)
			o.Цена_Макс = 0;
		return (o.Цена_Мин == o.Цена_Макс ? o.Цена_Мин.toFixed(0) : 'от ' + o.Цена_Мин.toFixed(0) + ' до ' + o.Цена_Макс.toFixed(0)) +
			' <i class="fa fa-rub" style="font-size: smaller; color: #747f7f"></i>';
	}

	function get_amount(o){
		get_price(o);
		return (o.Цена_Макс * o.count).toFixed(0) + ' <i class="fa fa-rub" style="font-size: smaller; color: #747f7f"></i>';
	};

	// определяем представления DataView
	dhtmlx.Type.add(dhtmlXDataView,{
		name:"list",
		template: $p.injected_data["dataview_list.html"],
		template_loading:"Загрузка данных...",
		height: 96,
		width: 900,
		margin: 2,
		padding:0,
		border: 1,
		image:get_image_style,
		manufacturer: get_manufacturer,
		price: get_price
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"cart",
		template: $p.injected_data["dataview_cart.html"],
		height: 96,
		width: 800,
		margin: 2,
		padding:0,
		border: 1,
		image: get_image_style,
		price: get_amount
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"large",
		template: $p.injected_data["dataview_large.html"],
		height: 210,
		width: 380,
		margin: 2,
		padding:2,
		border: 1,
		image:get_image_style,
		manufacturer: get_manufacturer,
		price: get_price
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"small",
		template: $p.injected_data["dataview_small.html"],
		height: 180,
		width: 220,
		margin: 2,
		padding:2,
		border: 1,
		image:get_image_style,
		manufacturer: get_manufacturer,
		price: get_price
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"viewed",
		template: $p.injected_data["dataview_viewed.html"],
		height: 180,
		width: 220,
		margin: 2,
		padding:2,
		border: 1,
		image:get_image_style,
		manufacturer: get_manufacturer,
		price: get_price
	});


};

$p.injected_data._mixin({"about.html":"<div class=\"md_column1300\">\r\n    <h1><i class=\"fa fa-info-circle\"></i> Интернет-магазин MetaStore</h1>\r\n    <p>Метамагазин - это веб-приложение с открытым исходным кодом, разработанное компанией <a href=\"http://www.oknosoft.ru/\" target=\"_blank\">Окнософт</a> на базе фреймворка <a href=\"http://www.oknosoft.ru/metadata/\" target=\"_blank\">Metadata.js</a> и распространяемое под <a href=\"http://www.oknosoft.ru/programmi-oknosoft/metadata.html\" target=\"_blank\">коммерческой лицензией Окнософт</a>.<br />\r\n        Исходный код и документация доступны на <a href=\"https://github.com/oknosoft/metastore\" target=\"_blank\">GitHub <i class=\"fa fa-github-alt\"></i></a>.<br />\r\n        Приложение является веб-интерфейсом к типовым конфигурациям 1С (Управление торговлей 11.2, Комплексная автоматизация 2.0, ERP Управление предприятием 2.1) и реализует функциональность интернет-магазина для информационной базы 1С\r\n    </p>\r\n    <p>Использованы следующие библиотеки и инструменты:</p>\r\n\r\n    <h3>Серверная часть</h3>\r\n    <ul>\r\n        <li><a href=\"http://1c-dn.com/1c_enterprise/\" target=\"_blank\">1c_enterprise</a><span class=\"md_muted_color\">, ORM сервер 1С:Предприятие</span></li>\r\n        <li><a href=\"http://www.postgresql.org/\" target=\"_blank\">postgreSQL</a><span class=\"md_muted_color\">, мощная объектно-раляционная база данных</span></li>\r\n        <li><a href=\"https://nodejs.org/\" target=\"_blank\">node.js</a><span class=\"md_muted_color\">, серверная программная платформа, основанная на движке V8 javascript</span></li>\r\n        <li><a href=\"http://nginx.org/ru/\" target=\"_blank\">nginx</a><span class=\"md_muted_color\">, высокопроизводительный HTTP-сервер</span></li>\r\n    </ul>\r\n\r\n    <h3>Управление данными в памяти браузера</h3>\r\n    <ul>\r\n        <li><a href=\"https://github.com/agershun/alasql\" target=\"_blank\">alaSQL</a><span class=\"md_muted_color\">, база данных SQL для браузера и Node.js с поддержкой как традиционных реляционных таблиц, так и вложенных JSON данных (NoSQL)</span></li>\r\n        <li><a href=\"https://github.com/metatribal/xmlToJSON\" target=\"_blank\">xmlToJSON</a><span class=\"md_muted_color\">, компактный javascript модуль для преобразования XML в JSON</span></li>\r\n        <li><a href=\"https://github.com/SheetJS/js-xlsx\" target=\"_blank\">xlsx</a><span class=\"md_muted_color\">, библиотека для чтения и записи XLSX / XLSM / XLSB / XLS / ODS в браузере</span></li>\r\n    </ul>\r\n\r\n    <h3>UI библиотеки и компоненты интерфейса</h3>\r\n    <ul>\r\n        <li><a href=\"http://dhtmlx.com/\" target=\"_blank\">dhtmlx</a><span class=\"md_muted_color\">, кроссбраузерная библиотека javascript для построения современных веб и мобильных приложений</span></li>\r\n        <li><a href=\"https://github.com/leongersen/noUiSlider\" target=\"_blank\">noUiSlider</a><span class=\"md_muted_color\">, легковесный javascript компонент регулирования пары (min-max) значений </span></li>\r\n        <li><a href=\"https://github.com/eligrey/FileSaver.js\" target=\"_blank\">filesaver.js</a><span class=\"md_muted_color\">, HTML5 реализация метода saveAs</span></li>\r\n        <li><a href=\"https://github.com/Diokuz/baron\" target=\"_blank\">baron</a><span class=\"md_muted_color\">, компонент управления полосами прокрутки</span></li>\r\n        <li><a href=\"https://github.com/ded/qwery\" target=\"_blank\">qwery</a><span class=\"md_muted_color\">, движок селекторов</span></li>\r\n        <li><a href=\"https://github.com/ded/bonzo\" target=\"_blank\">bonzo</a><span class=\"md_muted_color\">, утилиты DOM</span></li>\r\n        <li><a href=\"https://github.com/fat/bean\" target=\"_blank\">bean</a><span class=\"md_muted_color\">, библиотека событий для javascript</span></li>\r\n    </ul>\r\n\r\n    <h3>Графика</h3>\r\n    <ul>\r\n        <li><a href=\"https://fortawesome.github.io/Font-Awesome/\" target=\"_blank\">fontawesome</a><span class=\"md_muted_color\">, набор иконок и стилей CSS</span></li>\r\n        <li><a href=\"http://fontastic.me/\" target=\"_blank\">fontastic</a><span class=\"md_muted_color\">, еще один набор иконок и стилей</span></li>\r\n    </ul>\r\n\r\n    <p>&nbsp;</p>\r\n    <h2><i class=\"fa fa-question-circle\"></i> Вопросы</h2>\r\n    <p>Если обнаружили ошибку, пожалуйста,\r\n        <a href=\"https://github.com/oknosoft/metastore/issues/new\" target=\"_blank\">зарегистрируйте вопрос в GitHub</a> или\r\n        <a href=\"http://www.oknosoft.ru/metadata/#page-118\" target=\"_blank\">свяжитесь с разработчиком</a> напрямую<br />&nbsp;</p>\r\n\r\n</div>","cart.html":"<div class=\"md_column1300\">\r\n\r\n    <h1><i class=\"fa fa-shopping-cart\"></i> Корзина</h1>\r\n\r\n    <div class=\"md_column320\" style=\"width: 67%; padding: 0 8px 0 0; margin-left: -8px;\">\r\n        <div name=\"cart_dataview\" style=\"height: 360px; width: 100%;\"></div>\r\n    </div>\r\n\r\n    <div class=\"md_column320\" name=\"cart_order\" style=\"padding: 0; width: 26%; min-width: 262px;\">\r\n\r\n        <table class=\"aligncenter\" style=\"line-height: 40px\">\r\n            <tr name=\"top1\">\r\n                <td style=\"border-bottom: 1px #ddd dashed;\">Товары (2)</td>\r\n                <td align=\"right\" style=\"border-bottom: 1px #ddd dashed;\">1300</td>\r\n            </tr>\r\n\r\n            <tr vertical-align: baseline;>\r\n                <td>Всего:</td>\r\n                <td name=\"top2\" align=\"right\" style=\"font-size: 2em;\">1300 <i class=\"fa fa-rub\" style=\"font-size: smaller\"></i></td>\r\n            </tr>\r\n\r\n            <tr>\r\n                <td colspan=\"2\">\r\n                    <a href=\"#\" class=\"dropdown_list\" style=\"display: inline-block; line-height: normal\" title=\"Наличие в магазинах\">Можно забрать сегодня</a>\r\n                </td>\r\n            </tr>\r\n\r\n            <tr>\r\n                <td>Бонусных рублей:</td>\r\n                <td name=\"top3\" align=\"right\">190</td>\r\n            </tr>\r\n\r\n            <tr>\r\n                <td colspan=\"2\">\r\n                    <button name=\"order_order\" class=\"md_btn btn-red btn-fluid\">Оформить заказ</button>\r\n                </td>\r\n            </tr>\r\n\r\n            <tr>\r\n                <td colspan=\"2\">\r\n                    <p style=\"margin: 0\">Оплатите онлайн – получите скидку 5%</p>\r\n                </td>\r\n            </tr>\r\n\r\n            <tr class=\"dv_icon_card\">\r\n                <td><i class=\"fa fa-square-o fa-lg\"></i> Оплатить картой</td>\r\n                <td align=\"right\"><i class=\"fa fa-cc-visa\"></i>&nbsp;<i class=\"fa fa-cc-mastercard\"></i></td>\r\n            </tr>\r\n\r\n        </table>\r\n\r\n    </div>\r\n\r\n</div>","cart_order_top1.html":"<td style=\"border-bottom: 1px #ddd dashed;\">Товары (#count#)</td>\r\n<td align=\"right\" style=\"border-bottom: 1px #ddd dashed;\">#amount#</td>","cart_order_top2.html":"#amount# <i class=\"fa fa-rub\" style=\"font-size: smaller\"></i>","checkout.html":"<div class=\"clipper wdg_product_checkout\">\r\n    <div class=\"scroller\">\r\n        <div class=\"container\">\r\n\r\n            <!-- РАЗДЕЛ 1 - выбор способа оплаты -->\r\n            <div class=\"header\">\r\n                <div class=\"header__title\" name=\"header\">\r\n                    <span name=\"title\">Способ оплаты</span>\r\n                </div>\r\n            </div>\r\n            <div name=\"billing_kind\" style=\"padding: 10px; background: #f5f5f5;\">\r\n\r\n                <ul class=\"margin-0 padding-0 billing-systems inline-ul min-width-800px\">\r\n                    <li class=\"margin-right-2px active\">\r\n                        <a class=\"width-104px height-66px display-block border-radius-5px bs-logo logo-visa\" href=\"#\"></a>\r\n                        Банковские<br>карты\r\n                        <b class=\"z-index-2\"></b>\r\n                    </li>\r\n                    <li class=\"margin-right-2px\">\r\n                        <a class=\"width-104px height-66px display-block border-radius-5px bs-logo logo-pcards\" href=\"#\"></a>\r\n                        Наличные<br>при получении\r\n                        <b class=\"z-index-2\"></b>\r\n                    </li>\r\n                    <li class=\"margin-right-2px\">\r\n                        <a class=\"width-104px height-66px display-block border-radius-5px bs-logo logo-qiwi\" href=\"#\"></a>\r\n                        QIWI <br> Кошелек\r\n                        <b class=\"z-index-2\"></b>\r\n                    </li>\r\n                    <li class=\"margin-right-2px\">\r\n                        <a class=\"width-104px height-66px display-block border-radius-5px bs-logo logo-webmoney\" href=\"#\"></a>\r\n                        WebMoney<br>WMR, WMZ\r\n                        <b class=\"z-index-2\"></b>\r\n                    </li>\r\n                    <li class=\"margin-right-2px\">\r\n                        <a class=\"width-104px height-66px display-block border-radius-5px bs-logo logo-ymoney\" href=\"#\"></a>\r\n                        Яндекс <br> Деньги\r\n                        <b class=\"z-index-2\"></b>\r\n                    </li>\r\n                    <li class=\"margin-right-2px\">\r\n                        <a class=\"width-104px height-66px display-block border-radius-5px bs-logo logo-cash\" href=\"#\"></a>\r\n                        Безналичный<br>платеж\r\n                        <b class=\"z-index-2\"></b>\r\n                    </li>\r\n                    <li class=\"margin-right-2px\">\r\n                        <a class=\"width-104px height-66px display-block border-radius-5px bs-logo logo-robox\" href=\"#\"></a>\r\n                        Другие <br> способы оплаты\r\n                        <b class=\"z-index-2\"></b>\r\n                    </li>\r\n                </ul>\r\n\r\n                <div class=\"opacity-03 hr bg-666\">&nbsp;</div>\r\n\r\n                <div class=\"billing-systems-container\">\r\n                    <div class=\"billing-system visa-container\">\r\n                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"text_tbl\">\r\n                            <tbody><tr>\r\n                                <td>\r\n                                    <p class=\"tit\">Моментальная оплата платежными картами Visa и Mastercard</p>\r\n                                </td>\r\n                            </tr>\r\n                            </tbody></table>\r\n                    </div>\r\n                    <div class=\"billing-system qiwi-container hide\">\r\n                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"text_tbl\">\r\n                            <tbody><tr>\r\n                                <td>\r\n                                    <p class=\"tit\">\r\n                                        Моментальная оплата с помощью <a href=\"https://qiwi.com/landing/other.action\" target=\"_blank\">QIWI кошелька</a> (Россия).<br>\r\n                                        1. Введите номер QIWI Кошелька (номер сотового телефона)<br>\r\n                                        2. Оплатите автоматически созданный счет на оплату: на сайте <a href=\"https://qiwi.com/landing/other.action\" target=\"_blank\">QIWI Кошелька</a>, терминале QIWI, с помощью приложения для социальных сетей или мобильного <a href=\"https://w.qiwi.com/applications/main.action\" target=\"_blank\">телефона</a>.<br>\r\n                                        QIWI Кошелек легко <a href=\"https://w.qiwi.com/replenish/main.action\" target=\"_blank\">пополнить</a> в терминалах QIWI и партнеров, банковскими картами, салонах сотовой связи, супермаркетах, банкоматах или через интернет-банк. Совершать платежи Вы можете не только со счета QIWI Кошелька, но и банковской картой, наличными, а также с лицевого счета мобильного телефона.\r\n                                    </p>\r\n                                </td>\r\n                            </tr>\r\n                            <tr>\r\n                            </tr></tbody></table>\r\n                    </div>\r\n                    <div class=\"billing-system webmoney-container hide\">\r\n                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"text_tbl\">\r\n                            <tbody><tr>\r\n                                <td>\r\n                                    <p class=\"tit\">Моментальная оплата через систему WebMoney в валютах WMZ и WMR.</p>\r\n                                </td>\r\n                            </tr>\r\n                            </tbody></table>\r\n                    </div>\r\n                    <div class=\"billing-system ymoney-container hide\">\r\n                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"text_tbl\">\r\n                            <tbody><tr>\r\n                                <td>\r\n                                    <p class=\"tit ym-descriptor PC \">\r\n                                        Оплатить заказ можно электронными деньгами Яндекс.Деньги, а также банкоматах Сбербанка и салонах сотовой связи («Евросеть», «Связной»)\r\n                                    </p>\r\n                                </td>\r\n                            </tr>\r\n                            </tbody></table>\r\n                    </div>\r\n                    <div class=\"billing-system pcards-container hide\">\r\n                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"text_tbl\">\r\n                            <tbody><tr>\r\n                                <td><p class=\"tit\">Оплата через курьера при получении заказа</p></td>\r\n                            </tr>\r\n                            </tbody></table>\r\n                    </div>\r\n                    <div class=\"billing-system cash-container hide\">\r\n                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"text_tbl\">\r\n                            <tbody><tr>\r\n                                <td><p class=\"tit\">Безналичная оплата для Юридических лиц</p></td>\r\n                            </tr>\r\n                            </tbody></table>\r\n                    </div>\r\n                    <div class=\"billing-system robox-container hide\">\r\n                        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"text_tbl\">\r\n                            <tbody><tr>\r\n                                <td>\r\n                                    <p class=\"tit\">\r\n                                        Вы можете мгновенно оплатить заказ различными электронными валютами при помощи сервиса ROBOKASSA.<br>\r\n                                        При помощи этой службы вы можете пополнить счет через терминалы мгновенной оплаты, через систему денежных переводов Contact,\r\n                                        с помощью кредитных карт, а также многими видами электронных денег\r\n                                    </p>\r\n                                </td>\r\n                            </tr>\r\n                            </tbody></table>\r\n                    </div>\r\n                </div>\r\n\r\n            </div>\r\n\r\n\r\n            <!-- РАЗДЕЛ 2 - доставка -->\r\n            <div class=\"header\">\r\n                <div class=\"header__title header__title_state_fixed\">Доставка</div>\r\n            </div>\r\n            <div name=\"delivery\">\r\n                <p class=\"text\">Выбор способа доставки</p>\r\n            </div>\r\n\r\n\r\n            <!-- РАЗДЕЛ 3 - завершение -->\r\n            <div class=\"header\">\r\n                <div class=\"header__title header__title_state_fixed\">Оформить заказ</div>\r\n            </div>\r\n            <div name=\"order\">\r\n                <p class=\"text\"><i class=\"fa fa-info-circle fa-lg\"></i> Оформление заказа отключено в демо-версии</p>\r\n            </div>\r\n\r\n            <div class=\"load\" style=\"height: 0px;\">\r\n                <div class=\"load__value\" style=\"width: 0%;\"></div>\r\n            </div>\r\n\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"scroller__track\">\r\n        <div class=\"scroller__bar\" style=\"height: 26px; top: 0px;\"></div>\r\n    </div>\r\n\r\n</div>","content.html":"<div class=\"md_column1300\">\r\n    <h1><i class=\"fa fa-opencart\"></i> 1с интернет магазин MetaStore</h1>\r\n    <p class=\"small-margin\">\r\n        Перед вами - стандартная конфигурация 1С:Управление торговлей, редакции 11.2, к которой подключен интерфейс интернет-магазина.\r\n        Все \"внутренности\", включая схему данных и бизнес-логику используются родные, 1С-ные, без изменений. Для решения задач интернет-тогргвли,\r\n        реализованы веб-формы поиска и просмотра номенклатуры, добавлен инструмент сравнения свойств товаров и корзина покупок.\r\n    </p>\r\n    <div class=\"md_column300\">\r\n        <p class=\"text-center small-margin\">\r\n            <!-- Start round icon -->\r\n            <a href=\"#\" class=\"apex-icon-round\">\r\n            <span class=\"apex-icon\">\r\n                <i class=\"apex-icon-1c\"></i>\r\n            </span>\r\n                <span class=\"apex-icon-title\">Типовая 1С</span>\r\n            </a>\r\n            <!-- End round icon -->\r\n            MetaStore - это веб-интерфейс<br />\r\n            к типовым конфигурациям 1С, реализующий функциональность интернет-магазина\r\n        </p>\r\n    </div>\r\n\r\n    <div class=\"md_column300\">\r\n        <p class=\"text-center small-margin\">\r\n            <!-- Start round icon -->\r\n            <a href=\"#\" class=\"apex-icon-round\">\r\n            <span class=\"apex-icon\">\r\n                <i class=\"apex-icon-connect\"></i>\r\n            </span>\r\n                <span class=\"apex-icon-title\">Готовое решение</span>\r\n            </a>\r\n            <!-- End round icon -->\r\n            Подключается в один клик:<br />\r\n            1С:Управление торговлей,<br />\r\n            1С:Комплексная автоматизация,<br />\r\n            1С:ERP Управление предприятием\r\n        </p>\r\n    </div>\r\n\r\n    <div class=\"md_column300\">\r\n        <p class=\"text-center small-margin\">\r\n            <!-- Start round icon -->\r\n            <a href=\"#\" class=\"apex-icon-round\">\r\n            <span class=\"apex-icon\">\r\n                <i class=\"apex-icon-equilizer\"></i>\r\n            </span>\r\n                <span class=\"apex-icon-title\">Простота настроек</span>\r\n            </a>\r\n            <!-- End round icon -->\r\n            Иерархия, свойства номенклатуры,<br />остатки и цены, настраиваются<br />в привычных формах 1С\r\n        </p>\r\n    </div>\r\n\r\n    <div class=\"md_column300\">\r\n        <p class=\"text-center small-margin\">\r\n            <!-- Start round icon -->\r\n            <a href=\"#\" class=\"apex-icon-round\">\r\n            <span class=\"apex-icon\">\r\n                <i class=\"fa fa-github-alt\" style=\"line-height: 78px;\"></i>\r\n            </span>\r\n                <span class=\"apex-icon-title\">Открытый код</span>\r\n            </a>\r\n            <!-- End round icon -->\r\n            Разработано на базе <a href=\"http://www.oknosoft.ru/metadata/\" target=\"_blank\">Metadata.js</a><br />\r\n            Исходный код и документация<br />доступны на <a href=\"https://github.com/oknosoft/metastore\" target=\"_blank\">GitHub <i class=\"fa fa-github-alt\"></i></a>\r\n            <br />&nbsp;\r\n        </p>\r\n    </div>\r\n\r\n\r\n    <div style=\"padding: 12px 0 0 0; clear: both; display: inline-block; width: 100%\">\r\n\r\n        <div class=\"md_column320\">\r\n            <img class=\"aligncenter\" src=\"templates/imgs/print_order.png\" style=\"width: 100%\">\r\n        </div>\r\n\r\n        <div class=\"md_column320\">\r\n            <h2>Ключевые особенности и преимущества</h2>\r\n            <ul>\r\n                <li class=\"small-margin\">Информация об остатках, оплатах и заказах, доступна в личном кабинете на сайте в реальном времени — никаких обменов между сайтом и 1С не требуется, так как сайт — это и есть 1С</li>\r\n                <li class=\"small-margin\">Библиотека является расширением типовых конфигураций 1С и максимально использует методические и программные наработки, накопленные фирмой 1С и её партнерами</li>\r\n                <li class=\"small-margin\">В личном кабинете, клиенту доступны для просмотра все первичные документы, связанные с его покупками (счета, оплаты, отгрузки и возвраты)</li>\r\n            </ul>\r\n\r\n            <h3>Для партнеров и программитов 1С</h3>\r\n            <ul>\r\n                <li class=\"small-margin\">Настройка бизнес-логики под требования заказчика, выполняется в привычном конфигураторе с использованием знакомых объектов типовых решений 1С</li>\r\n                <li class=\"small-margin\">Опыт разработки на javascript не повредит, но в серверной части проекта язык javascript не используется и для её поддержки и адаптации, специальных знаний веб-технологий не требуется</li>\r\n            </ul>\r\n\r\n            <h3>Для веб-студий и программитов javascript</h3>\r\n            <ul>\r\n                <li class=\"small-margin\">MetaStore базируется на библиотеке <a href=\"https://github.com/oknosoft/metadata.js\" target=\"_blank\">metadata.js</a>, которая предоставляет frontend-разрабочтику высокоуровневые javascript-объекты, упрощающие взаимодействие с 1С</li>\r\n                <li class=\"small-margin\">Опыт разработки на 1С не повредит, но в клиентской части проекта язык 1С не используется и для её поддержки и адаптации, специальных знаний 1С не требуется</li>\r\n            </ul>\r\n\r\n        </div>\r\n\r\n    </div>\r\n\r\n\r\n    <div style=\"padding: 12px 0 0 0; clear: both; display: inline-block; width: 100%\">\r\n\r\n        <div class=\"md_column320\">\r\n            <h3>Для пользователей</h3>\r\n            <ul>\r\n                <li class=\"small-margin\">Управление настройками магазина, свойствами и категориями номенклатуры, правилами ценообразования, заказами, оплатами и доставками, происходит в привычных формах 1С. Никакого двойного ввода данных, импорта и экспорта не требуется</li>\r\n                <li class=\"small-margin\">На сайте теперь можно использовать любые данные, доступные в 1С, что повышает функциональность и привлекательность интернет-магазина</li>\r\n                <li class=\"small-margin\">Интеграция с каталогом Яндекс.Маркет\r\n                    <ul>\r\n                        <li>Импорт категорий и свойств товаров</li>\r\n                        <li>Показ отзывов с Яндекс.Маркета в карточке товара интегрнет-магазина</li>\r\n                    </ul>\r\n                </li>\r\n            </ul>\r\n\r\n            <h3>Для всех</h3>\r\n            <ul>\r\n                <li class=\"small-margin\">Надёжность сервиса. Библиотека <a href=\"https://github.com/oknosoft/metadata.js\" target=\"_blank\">metadata.js</a> берёт на себя вопросы синхронизации данных между сайтом и 1С\r\n                    <ul>\r\n                        <li>В штатном режиме, когда сервер 1С доступен, выполняется прямое чтение и запись данных в 1С</li>\r\n                        <li>При недоступности сервера 1С, данные кешируются в промежуточном прокси на Node.js</li>\r\n                    </ul>\r\n                </li>\r\n                <li class=\"small-margin\">Масштабируемость\r\n                    <ul>\r\n                        <li>Для сайтов с небольшой посещаемостью, с обработкой запросов справится единственный экземпляр сервера 1С</li>\r\n                        <li>Для крупных проектов можно задействовать балансировщики нагрузки и отказоустойчивые кластеры</li>\r\n                    </ul>\r\n                </li>\r\n                <li class=\"small-margin\">Скорость работы\r\n                    <ul>\r\n                        <li>В MetaStore задействованы возможности современных браузеров и оптимизирован трафик между клиентом и сервером</li>\r\n                    </ul>\r\n                </li>\r\n                <li class=\"small-margin\">Функциональность\r\n                    <ul>\r\n                        <li>Использование на сайте модели данных 1С, отточенной многолетним опытом автоматизации крупных торговых предприятий, позволяет реализовать функциональный интерфейс, нацеленный на удобство клиентов</li>\r\n                    </ul>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n\r\n        <div class=\"md_column320\">\r\n            <img class=\"aligncenter\" src=\"templates/imgs/product_card.png\" style=\"width: 100%\">\r\n        </div>\r\n\r\n    </div>\r\n\r\n\r\n    <div style=\"padding: 12px 0 0 0; clear: both; display: inline-block; width: 100%\">\r\n\r\n        <div class=\"md_column320\">\r\n            <img class=\"aligncenter\" src=\"templates/imgs/phone-2.png\" alt=\"phone\" width=\"332\" height=\"409\">\r\n        </div>\r\n\r\n        <div class=\"md_column320\">\r\n            <h2 class=\"light\">Поддержка мобильных устройств</h2>\r\n            <ul>\r\n                <li class=\"small-margin\">Адаптивная разметка в зависимости от размеров экрана</li>\r\n                <li class=\"small-margin\">Полноэкранный режим и события смены ориентации устройства</li>\r\n                <li>Кеширование данных и экономия трафика обеспечивают комфортную работу при плохой связи</li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n\r\n\r\n</div>","dataview_cart.html":"<table width='100%'>\r\n    <tr>\r\n        <td rowspan='2' width='90px'>\r\n            <div class='dv_list_image' style='{common.image()}'></div>\r\n        </td>\r\n        <td>\r\n            {obj.name}\r\n        </td>\r\n        <td width='100px' align='right'>\r\n            <div style='display: inline-flex'>\r\n                <i class='fa fa-minus-square-o fa-lg dv_icon_minus' style='line-height: inherit; cursor: pointer;'></i>&nbsp;\r\n                <input class='dv_input' type='text' size='1' value='{obj.count}' style='text-align: center;' >&nbsp;\r\n                <i class='fa fa-plus-square-o fa-lg dv_icon_plus' style='line-height: inherit; cursor: pointer;'></i>\r\n            </div>\r\n        </td>\r\n        <td width='100px' align='right'>\r\n            {common.price()}\r\n        </td>\r\n    </tr>\r\n    <tr>\r\n        <td colspan='3' class='font_smaller'>{obj.Описание}&nbsp;</td>\r\n    </tr>\r\n</table>\r\n","dataview_large.html":"<div>\r\n    <div class='dataview_large_image' style='{common.image()}'></div>\r\n    <div class='dv_price'>{common.price()}</div>\r\n    <div style='clear: right'>\r\n        <div>{obj.name}</div>\r\n        <div class='font_smaller'>{common.manufacturer()}</div>\r\n        <div class='font_smaller'>{obj.Описание}</div>\r\n    </div>\r\n</div>\r\n\r\n","dataview_list.html":"<div>\r\n    <div class='dv_list_image' style='{common.image()}'></div>\r\n    <div class='dv_price'>\r\n        {common.price()}\r\n        <div class='dv_iconset_list'>\r\n            <i class='fa fa-cart-plus dv_icon_cart' title='Добавить в корзину'></i>&nbsp;\r\n            <i class='fa fa-bar-chart dv_icon_add_compare' title='Добавить к сравнению'></i>&nbsp;\r\n            <i class='fa fa-search-plus dv_icon_detail' title='Карточка товара'></i>\r\n        </div>\r\n    </div>\r\n\r\n    <div>\r\n        <div>{obj.name}</div>\r\n        <div class='font_smaller'>{common.manufacturer()}</div>\r\n        <div class='font_smaller'>{obj.Описание}</div>\r\n    </div>\r\n</div>\r\n","dataview_small.html":"<div>\r\n    <div class='dataview_small_image' style='{common.image()}'></div>\r\n    <div class='dv_price'>{common.price()}</div>\r\n</div>\r\n<div style='clear: both; text-align: center;'>{obj.name}</div>\r\n","dataview_viewed.html":"<div>\r\n    <div class='dataview_small_image' style='{common.image()}'></div>\r\n    <div class='dv_price'>{common.price()}</div>\r\n    <div class='dv_iconset'>\r\n        <i class='fa fa-cart-plus dv_icon_cart' title='Добавить в корзину'></i>&nbsp;\r\n        <i class='fa fa-bar-chart dv_icon_add_compare' title='Добавить к сравнению'></i>&nbsp;\r\n        <i class='fa fa-times dv_icon_remove_viewed' title='Удалить из списка просмотренных'></i>\r\n    </div>\r\n</div>\r\n<div style='clear: both; text-align: center;'>{obj.name}</div>\r\n","product_card.html":"<div class=\"clipper wdg_product_accordion\">\r\n    <div class=\"scroller\">\r\n        <div class=\"container\">\r\n\r\n            <div class=\"header\">\r\n                <div class=\"header__title\" name=\"header\">\r\n                    <span name=\"title\">Товар</span>\r\n                </div>\r\n\r\n            </div>\r\n\r\n            <div name=\"path\" style=\"padding: 8px\">\r\n\r\n            </div>\r\n\r\n            <!-- РАЗДЕЛ 1 - картинка и кнопки покупки -->\r\n            <div name=\"main\">\r\n                <div class=\"md_column320\" style=\"min-height: 350px;\">\r\n                    <img class=\"product_img aligncenter\" src=\"\">\r\n                    <div class=\"product_carousel aligncenter\"></div>\r\n                </div>\r\n                <div class=\"md_column320\" name=\"order\" style=\"padding-top: 0;\">\r\n                    <div>\r\n                        <h3 name=\"order_title\"></h3>\r\n                        <p name=\"order_price\" style=\"margin: 8px 0 0 0; font-size: 2em;\">1300 <i class=\"fa fa-rub\" style=\"font-size: smaller\"></i></p>\r\n                        <div class=\"rating\" data-rating=\"0\"><div class=\"fill-rating\"></div></div>\r\n                        <p style=\"margin: 0\">Этот товар еще никто не оценил.</p>\r\n                        <a href=\"#\" class=\"dropdown_list\" style=\"display: inline-block;\" title=\"Наличие в магазинах\">Можно забрать сегодня</a>\r\n                        <p name=\"order_warranty\" style=\"margin: 8px 0 0 0\">Гарантия: 12 мес.</p>\r\n                        <p name=\"order_brand\" style=\"margin: 8px 0 0 0\"></p>\r\n\r\n                        <button name=\"order_cart\" class=\"md_btn btn-red btn-fluid\"><i class=\"fa fa-cart-plus fa-fw\"></i> Добавить в корзину</button>\r\n                        <button name=\"order_compare\" class=\"md_btn btn-grey btn-fluid\"><i class=\"fa fa-bar-chart fa-fw\"></i> К сравнению</button>\r\n\r\n\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- РАЗДЕЛ 2 - описание и реквизиты -->\r\n            <div class=\"header\">\r\n                <div class=\"header__title header__title_state_fixed\">Описание и характеристики</div>\r\n            </div>\r\n            <div>\r\n                <!-- Здесь описание товара -->\r\n                <div class=\"md_column320\" name=\"description\">\r\n\r\n                </div>\r\n                <!-- Здесь OHeadFields товара -->\r\n                <div class=\"md_column320\" name=\"properties\" style=\"min-height: 300px;\">\r\n\r\n                </div>\r\n            </div>\r\n\r\n\r\n            <!-- РАЗДЕЛ 3 - отзывы с Маркета -->\r\n            <div class=\"header\">\r\n                <div class=\"header__title header__title_state_fixed\">Отзывы, вопрос-ответ</div>\r\n            </div>\r\n            <div name=\"notes\">\r\n                <p class=\"text\">Пока нет ни одного комментария, ваш будет первым</p>\r\n            </div>\r\n\r\n\r\n            <div class=\"header\">\r\n                <div class=\"header__title header__title_state_fixed\">Драйверы и файлы</div>\r\n            </div>\r\n            <div name=\"download\">\r\n                <p class=\"text\">Для данного товара файлы и драйверы не требуются</p>\r\n            </div>\r\n\r\n            <div class=\"load\" style=\"height: 0px;\">\r\n                <div class=\"load__value\" style=\"width: 0%;\"></div>\r\n            </div>\r\n\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"scroller__track\">\r\n        <div class=\"scroller__bar\" style=\"height: 26px; top: 0px;\"></div>\r\n    </div>\r\n\r\n</div>","review.html":"<div class=\"product-review-item product-review-item_collapsed_yes js-review\">\r\n    <div class=\"product-review-user i-bem\" onclick=\"return {'product-review-user':''}\">\r\n        <a class=\"link product-review-user__name\" href=\"/user/m2gtr/reviews\" itemprop=\"author\">Алексеев Алексей</a>\r\n        <a class=\"link product-review-user__reviews\" href=\"/user/m2gtr/reviews\">Автор 3&nbsp;отзывов</a>\r\n    </div>\r\n    <div class=\"product-review-item__stat\">\r\n        <div class=\"rating rating_border_yes hint i-bem hint_js_inited\" date-rate=\"4\"\r\n             onclick=\"return {&quot;hint&quot;:{&quot;content&quot;:&quot;Оценка&nbsp;пользователя&nbsp;4&nbsp;из&nbsp;5&quot;,&quot;offset&quot;:&quot;15&quot;}}\"\r\n             itemprop=\"reviewRating\" itemscope=\"\" itemtype=\"http://schema.org/Rating\">\r\n            <meta itemprop=\"ratingValue\" content=\"4\">\r\n            4\r\n            <div class=\"rating__corner\">\r\n                <div class=\"rating__triangle\"></div>\r\n            </div>\r\n        </div>\r\n        <span class=\"product-review-item__rating-label\">хорошая модель</span><span\r\n            class=\"product-review-item__delivery\">Опыт использования:&nbsp;менее месяца</span></div>\r\n\r\n    <dl class=\"product-review-item__stat\">\r\n        <dt class=\"product-review-item__title\">Достоинства:</dt>\r\n        <dd class=\"product-review-item__text\">Вместительный, 2 компрессора, полка для бутылок экономит место.</dd>\r\n    </dl>\r\n    <dl class=\"product-review-item__stat\">\r\n        <dt class=\"product-review-item__title\">Недостатки:</dt>\r\n        <dd class=\"product-review-item__text\">Работа МК сопровождается очень сильным журчанием... хотя может быть мне\r\n            попался бракованный экземпляр\r\n        </dd>\r\n    </dl>\r\n    <div class=\"product-review-item__stat  product-review-item__stat_type_inline\">\r\n        <div class=\"product-review-item__title\">Комментарий:</div>\r\n        <div class=\"product-review-item__text\">В целом холодильник хороший, как и писал вместительный и компактный,\r\n            очень выигрывает по ценовой политике.<br>объективно: качество пластика перевесных полочек на двери могло бы\r\n            быть и лучше, создается впечателение что они очень хрупкие и вот вот сломаются... но по факту ещё не одну не\r\n            сломал))<br>читал много отзывов и довольно много людей жалаются на противный сигнал при открытии двери\r\n            каждый раз, так вот сигнал этот отключается при отключении режима заморозка, да и этот сигнал довольно\r\n            тихий, как и сигнал при открытии двери ХК более 1 мин<br>По уровню шуму к ХК нареканий никаких нет,\r\n            компрессоры оба тихие, но вот к циркуляции хладогента в МК претензии есть,<br>при работе слышен звук на\r\n            подобие бульканя воды в батареях, он вроде и не громкий но жутко раздражает, обратился в сервис сказали что\r\n            бульканье это нормальное явления и не захотели приезжать...<br>так что совет проверяйте холодильник на\r\n            уровень шума прямов магазине\r\n        </div>\r\n    </div>\r\n    <div class=\"product-review-item__footer layout layout_display_table\">\r\n        <div class=\"layout__col\">12 мая\r\n            <meta itemprop=\"datePublished\" content=\"2015-05-12T17:55:02\">\r\n            ,&nbsp;Санкт-Петербург\r\n        </div>\r\n        <div class=\"layout__col layout__col_align_right\">\r\n            <div class=\"review-voting review-voting_active_yes manotice manotice_type_popup i-bem review-voting_js_inited manotice_js_inited\"\r\n                 onclick=\"return {&quot;review-voting&quot;:{&quot;sk&quot;:&quot;ua2238057ac558861fac690d2527fa046&quot;},&quot;manotice&quot;:{&quot;directions&quot;:&quot;right&quot;,&quot;autoclosable&quot;:&quot;yes&quot;}}\">\r\n                <div class=\"review-voting__plus\"></div>\r\n                <div class=\"review-voting__minus\"></div>\r\n                <div class=\"spin spin_theme_gray-16 i-bem spin_js_inited\" onclick=\"return {'spin':{}}\"></div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>","settings.html":"<div class=\"md_column1300\">\r\n    <h1><i class=\"fa fa-cogs\"></i> Настройки</h1>\r\n    <p>В промышленном режиме данная страница выключена.<br />\r\n        Внешний вид сайта и параметры подключения, настраиваются в конфигурационном файле.<br />\r\n        В демо-ражиме страница настроек иллюстрирует использование параметров работы программы клиентской частью приложения.</p>\r\n\r\n    <div class=\"md_column320\" name=\"form1\" style=\"max-width: 420px;\"><div></div></div>\r\n    <div class=\"md_column320\" name=\"form2\"><div></div></div>\r\n    <div class=\"md_column320\" name=\"form3\"><div></div></div>\r\n</div>","user.html":"<div class=\"md_column1300\">\r\n    <h1><i class=\"fa fa-user\"></i> Профиль пользователя</h1>\r\n    <p name=\"name\">Алхимов А.А.</p>\r\n\r\n</div>","create_tables.sql":"USE md;\nCREATE TABLE IF NOT EXISTS `cch_СтатьиРасходов` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВариантРаспределенияРасходов` CHAR, `ПравилоРаспределенияНаСебестоимость` CHAR, `РеквизитДопУпорядочивания` INT, `СпособРаспределенияПоНаправлениямДеятельности` CHAR, `ПрочиеРасходы` BOOLEAN, `СтатьяРасходов` CHAR, `КорреспондирующийСчет` CHAR, `Описание` CHAR, `ОграничитьИспользование` BOOLEAN, `ДоступныеОперации` CHAR, `СтатьяКалькуляции` CHAR, `ПравилоРаспределенияПоЭтапамПроизводства` CHAR, `ПравилоРаспределенияПоПодразделениям` CHAR, `ВариантРаздельногоУчетаНДС` CHAR, `ДоговорыКредитовИДепозитов` BOOLEAN, `ГруппаФинансовогоУчета` CHAR, `РасходыНаОбъектыЭксплуатации` BOOLEAN, `РасходыНаНМАиНИОКР` BOOLEAN, `ВидРасходов` CHAR, `ПринятиеКналоговомуУчету` BOOLEAN, `КонтролироватьЗаполнениеАналитики` BOOLEAN, `ВидЦенностиНДС` CHAR, `ВидРБП` CHAR, `АналитикаРасходовЗаказРеализация` BOOLEAN, `ВидАктива` CHAR, `ВидПрочихРасходов` CHAR, `СпособРаспределенияНаПроизводственныеЗатраты` CHAR, `КосвенныеЗатратыНУ` BOOLEAN, `СчетУчета` CHAR, `parent` CHAR, `ts_extra_fields` JSON, `ts_ДоступныеХозяйственныеОперации` JSON);\nCREATE TABLE IF NOT EXISTS `cch_СтатьиДоходов` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `РеквизитДопУпорядочивания` INT, `СпособРаспределения` CHAR, `КорреспондирующийСчет` CHAR, `ДоговорыКредитовИДепозитов` BOOLEAN, `Описание` CHAR, `ГруппаФинансовогоУчета` CHAR, `ПринятиеКналоговомуУчету` BOOLEAN, `ДоходыПоОбъектамЭксплуатации` BOOLEAN, `ДоходыПоНМАиНИОКР` BOOLEAN, `КонтролироватьЗаполнениеАналитики` BOOLEAN, `ВидПрочихДоходов` CHAR, `СчетУчета` CHAR, `parent` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cch_properties` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Виден` BOOLEAN, `ВладелецДополнительныхЗначений` CHAR, `ДополнительныеЗначенияИспользуются` BOOLEAN, `ДополнительныеЗначенияСВесом` BOOLEAN, `Доступен` BOOLEAN, `Заголовок` CHAR, `ЗаголовокФормыВыбораЗначения` CHAR, `ЗаголовокФормыЗначения` CHAR, `ЗаполнятьОбязательно` BOOLEAN, `Комментарий` CHAR, `МногострочноеПолеВвода` INT, `НаборСвойств` CHAR, `tooltip` CHAR, `ФорматСвойства` CHAR, `ЭтоДополнительноеСведение` BOOLEAN, `type` JSON, `ts_ЗависимостиДополнительныхРеквизитов` JSON);\nCREATE TABLE IF NOT EXISTS `enm_ЮрФизЛицо` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ЮридическоеФизическоеЛицо` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыХраненияФайлов` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыСравненияЗначенийСкидокНаценок` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыПользователей` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыОтветственныхЛиц` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыНалогообложенияНДС` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыКонтактнойИнформации` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыКодовКарт` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыКассККМ` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыКарт` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ТипыДенежныхСредств` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_СтатусыКартЛояльности` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_СтавкиНДС` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_СпособыУстановкиКурсаВалюты` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ПолФизическогоЛица` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ИнтеграцияТипРегистрации` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ИнтеграцияТипКеширования` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ЕдиницыИзмеренияВремени` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ДниНедели` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ГрадацииКачества` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ВидыДнейПроизводственногоКалендаря` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ВариантыОформленияПродажи` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `enm_ВариантыИспользованияХарактеристикНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR);\nCREATE TABLE IF NOT EXISTS `doc_УстановкаЦенНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Ответственный` CHAR, `Комментарий` CHAR, `Согласован` BOOLEAN, `ДокументОснование` CHAR, `ДокументОснование_T` CHAR, `Статус` CHAR, `ts_Товары` JSON, `ts_ВидыЦен` JSON, `ts_НаборыЗначенийДоступа` JSON);\nCREATE TABLE IF NOT EXISTS `doc_РеализацияТоваровУслуг` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Организация` CHAR, `Контрагент` CHAR, `СуммаДокумента` FLOAT, `Партнер` CHAR, `Склад` CHAR, `Комментарий` CHAR, `Договор` CHAR);\nCREATE TABLE IF NOT EXISTS `doc_РасходныйКассовыйОрдер` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Организация` CHAR, `СуммаДокумента` FLOAT, `Контрагент` CHAR, `Комментарий` CHAR);\nCREATE TABLE IF NOT EXISTS `doc_ПриходныйКассовыйОрдер` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Организация` CHAR, `СуммаДокумента` FLOAT, `Контрагент` CHAR, `Комментарий` CHAR);\nCREATE TABLE IF NOT EXISTS `doc_ПоступлениеБезналичныхДенежныхСредств` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Организация` CHAR, `СуммаДокумента` FLOAT, `Контрагент` CHAR, `Комментарий` CHAR);\nCREATE TABLE IF NOT EXISTS `doc_ОперацияПоПлатежнойКарте` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Организация` CHAR, `Контрагент` CHAR, `СуммаДокумента` FLOAT, `Комментарий` CHAR);\nCREATE TABLE IF NOT EXISTS `doc_ЗаказКлиента` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Партнер` CHAR, `Контрагент` CHAR, `Организация` CHAR, `Соглашение` CHAR, `Сделка` CHAR, `Валюта` CHAR, `СуммаДокумента` FLOAT, `ГрафикОплаты` CHAR, `ЖелаемаяДатаОтгрузки` Date, `Склад` CHAR, `ЦенаВключаетНДС` BOOLEAN, `Менеджер` CHAR, `ДополнительнаяИнформация` CHAR, `ДокументОснование` CHAR, `ДокументОснование_T` CHAR, `НеОтгружатьЧастями` BOOLEAN, `Статус` CHAR, `МаксимальныйКодСтроки` INT, `ДатаСогласования` Date, `Согласован` BOOLEAN, `ФормаОплаты` CHAR, `БанковскийСчет` CHAR, `БанковскийСчетКонтрагента` CHAR, `Касса` CHAR, `СуммаАвансаДоОбеспечения` FLOAT, `СуммаПредоплатыДоОтгрузки` FLOAT, `ДатаОтгрузки` Date, `АдресДоставки` CHAR, `НалогообложениеНДС` CHAR, `СкидкиРассчитаны` BOOLEAN, `ХозяйственнаяОперация` CHAR, `Комментарий` CHAR, `НомерПоДаннымКлиента` CHAR, `ДатаПоДаннымКлиента` Date, `Грузоотправитель` CHAR, `Грузополучатель` CHAR, `БанковскийСчетГрузоотправителя` CHAR, `БанковскийСчетГрузополучателя` CHAR, `ГруппаФинансовогоУчета` CHAR, `КартаЛояльности` CHAR, `Договор` CHAR, `Подразделение` CHAR, `Автор` CHAR, `Автор_T` CHAR, `ПорядокРасчетов` CHAR, `Назначение` CHAR, `СпособДоставки` CHAR, `ПеревозчикПартнер` CHAR, `ЗонаДоставки` CHAR, `ВремяДоставкиС` Date, `ВремяДоставкиПо` Date, `АдресДоставкиПеревозчика` CHAR, `АдресДоставкиЗначенияПолей` CHAR, `АдресДоставкиПеревозчикаЗначенияПолей` CHAR, `ДополнительнаяИнформацияПоДоставке` CHAR, `КонтактноеЛицо` CHAR, `Руководитель` CHAR, `ГлавныйБухгалтер` CHAR, `ВернутьМногооборотнуюТару` BOOLEAN, `СрокВозвратаМногооборотнойТары` INT, `СостояниеЗаполненияМногооборотнойТары` CHAR, `СуммаВозвратнойТары` FLOAT, `НазначениеПлатежа` CHAR, `ТребуетсяЗалогЗаТару` BOOLEAN, `priority` CHAR, `ИдентификаторПлатежа` CHAR, `ts_Товары` JSON, `ts_ЭтапыГрафикаОплаты` JSON, `ts_СкидкиНаценки` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `doc_ВозвратТоваровОтКлиента` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, posted boolean, date Date, number_doc CHAR, `Организация` CHAR, `Партнер` CHAR, `Контрагент` CHAR, `СуммаДокумента` FLOAT, `Склад` CHAR, `Комментарий` CHAR, `Договор` CHAR);\nCREATE TABLE IF NOT EXISTS `ireg_$log` (`date` INT, `sequence` INT, `class` CHAR, `note` CHAR, `obj` CHAR, PRIMARY KEY (`date`, `sequence`));\nCREATE TABLE IF NOT EXISTS `ireg_ШтрихкодыНоменклатуры` (`Штрихкод` CHAR, `Номенклатура` CHAR, `Характеристика` CHAR, `Упаковка` CHAR, PRIMARY KEY (`Штрихкод`));\nCREATE TABLE IF NOT EXISTS `ireg_ЦеныНоменклатуры` (`Номенклатура` CHAR, `ВидЦены` CHAR, `Характеристика` CHAR, `Цена` FLOAT, `Упаковка` CHAR, `Валюта` CHAR, PRIMARY KEY (`Номенклатура`, `ВидЦены`, `Характеристика`));\nCREATE TABLE IF NOT EXISTS `ireg_КорзинаПокупателя` (`ОбъектАвторизации` CHAR, `ОбъектАвторизации_T` CHAR, `Номенклатура` CHAR, `Характеристика` CHAR, `Упаковка` CHAR, `НоменклатураНабора` CHAR, `ХарактеристикаНабора` CHAR, `КоличествоУпаковок` FLOAT, `Цена` FLOAT, PRIMARY KEY (`ОбъектАвторизации`, `Номенклатура`, `Характеристика`, `Упаковка`, `НоменклатураНабора`, `ХарактеристикаНабора`));\nCREATE TABLE IF NOT EXISTS `ireg_ИнтеграцияСинонимы` (`ИмяВ1С` CHAR, `ИмяВJS` CHAR, PRIMARY KEY (`ИмяВ1С`));\nCREATE TABLE IF NOT EXISTS `ireg_ИнтеграцияСессии` (`ИдентификаторБраузера` CHAR, `Одобрено` BOOLEAN, `ТекущихЗапросов` INT, `Запросов` INT, `ПоследняяАктианость` Date, `ГеоIP` CHAR, PRIMARY KEY (`ИдентификаторБраузера`));\nCREATE TABLE IF NOT EXISTS `ireg_meta_objects` (`class_name` CHAR, `cache` CHAR, `hide` BOOLEAN, `lc_changed_base` INT, `irest_enabled` BOOLEAN, `reg_type` CHAR, `meta` JSON, `meta_patch` JSON, `ref` CHAR, PRIMARY KEY (`class_name`));\nCREATE TABLE IF NOT EXISTS `ireg_ИнтеграцияЛимиты` (`ОбластьДанных` INT, `ЛимитСессий` INT, `ЛимитЗапросов` INT, `ЛимитЗапросовНаПользователя` INT, `ДоступЗапрещен` BOOLEAN, `ПричинаБлокировки` CHAR, PRIMARY KEY (`ОбластьДанных`));\nCREATE TABLE IF NOT EXISTS `ireg_ИнтеграцияКешСсылок` (`identifier` CHAR, `conformity` CHAR, `conformity_T` CHAR, `identifier_presentation` CHAR, PRIMARY KEY (`identifier`));\nCREATE TABLE IF NOT EXISTS `ireg_ИнтеграцияДатыУдаления` (`ref` CHAR, `lc_changed` INT, `class_name` CHAR, PRIMARY KEY (`ref`));\nCREATE TABLE IF NOT EXISTS `ireg_ИнтеграцияДатыИзменения` (`ref` CHAR, `lc_changed` INT, `class_name` CHAR, `obj` JSON, PRIMARY KEY (`ref`));\nCREATE TABLE IF NOT EXISTS `cat_ТоварныеКатегории` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `owner` CHAR, `parent` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Марки` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Производитель` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ЗоныДоставки` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Описание` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_property_values_hierarchy` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Вес` FLOAT, `owner` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ДоговорыКредитовИДепозитов` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `БанковскийСчет` CHAR, `БанковскийСчетКомиссии` CHAR, `БанковскийСчетКонтрагента` CHAR, `БанковскийСчетПроцентов` CHAR, `ВалютаВзаиморасчетов` CHAR, `date` Date, `ДатаПервогоТранша` Date, `ДатаПоследнегоПлатежа` Date, `Касса` CHAR, `Комментарий` CHAR, `Контрагент` CHAR, `НаименованиеДляПечати` CHAR, `number_doc` CHAR, `Организация` CHAR, `Ответственный` CHAR, `Партнер` CHAR, `Подразделение` CHAR, `ПорядокОплаты` CHAR, `Согласован` BOOLEAN, `СрокДней` INT, `СрокМес` INT, `Статус` CHAR, `СтатьяДДСКомиссии` CHAR, `СтатьяДДСОсновногоДолга` CHAR, `СтатьяДДСПоступленияВыдачи` CHAR, `СтатьяДДСПроцентов` CHAR, `СтатьяДоходовРасходовКомиссии` CHAR, `СтатьяДоходовРасходовКомиссии_T` CHAR, `СтатьяДоходовРасходовПроцентов` CHAR, `СтатьяДоходовРасходовПроценто_T` CHAR, `СуммаКомиссии` FLOAT, `СуммаЛимита` FLOAT, `СуммаПроцентов` FLOAT, `СуммаТраншей` FLOAT, `ТипДоговора` CHAR, `ТипКомиссии` CHAR, `ТипСрочности` CHAR, `ФормаОплаты` CHAR, `ХарактерДоговора` CHAR, `ГруппаФинансовогоУчетаДенежныхСредств` CHAR, `ГруппаФинансовогоУчета` CHAR, `ts_Обеспечение` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ШаблоныЭтикетокИЦенников` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Шаблон` CHAR, `Назначение` CHAR, `Ширина` INT, `Высота` INT, `РазмерЯчейки` INT, `ДляЧего` CHAR, `ДляЧего_T` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ЦеновыеГруппы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Описание` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ХарактеристикиНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НаименованиеПолное` CHAR, `Принципал` CHAR, `Принципал_T` CHAR, `Контрагент` CHAR, `Контрагент_T` CHAR, `owner` CHAR, `owner_T` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ФизическиеЛица` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ДатаРождения` Date, `Пол` CHAR, `ИНН` CHAR, `ГруппаДоступа` CHAR, `Уточнение` CHAR, `parent` CHAR, `ts_КонтактнаяИнформация` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Файлы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Автор` CHAR, `Автор_T` CHAR, `ВладелецФайла` CHAR, `ВладелецФайла_T` CHAR, `ДатаЗаема` Date, `ДатаСоздания` Date, `Зашифрован` BOOLEAN, `ИндексКартинки` INT, `Описание` CHAR, `ПодписанЭП` BOOLEAN, `ПолноеНаименование` CHAR, `Редактирует` CHAR, `ТекстХранилище` CHAR, `ТекущаяВерсия` CHAR, `ТекущаяВерсияАвтор` CHAR, `ТекущаяВерсияДатаМодификацииФайла` Date, `ТекущаяВерсияДатаСоздания` Date, `ТекущаяВерсияКод` CHAR, `ТекущаяВерсияНомерВерсии` INT, `ТекущаяВерсияПутьКФайлу` CHAR, `ТекущаяВерсияРазмер` INT, `ТекущаяВерсияРасширение` CHAR, `ТекущаяВерсияТом` CHAR, `ХранитьВерсии` BOOLEAN, `ts_extra_fields` JSON, `ts_СертификатыШифрования` JSON);\nCREATE TABLE IF NOT EXISTS `cat_УчетныеЗаписиЭлектроннойПочты` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `SMTPАутентификация` CHAR, `АдресЭлектроннойПочты` CHAR, `ВремяОжидания` INT, `ИмяПользователя` CHAR, `ИспользоватьБезопасныйВходНаСерверВходящейПочты` BOOLEAN, `ИспользоватьБезопасныйВходНаСерверИсходящейПочты` BOOLEAN, `ИспользоватьДляОтправки` BOOLEAN, `ИспользоватьДляПолучения` BOOLEAN, `ИспользоватьЗащищенноеСоединениеДляВходящейПочты` BOOLEAN, `ИспользоватьЗащищенноеСоединениеДляИсходящейПочты` BOOLEAN, `ОставлятьКопииСообщенийНаСервере` BOOLEAN, `ПериодХраненияСообщенийНаСервере` INT, `Пользователь` CHAR, `ПользовательSMTP` CHAR, `ПортСервераВходящейПочты` INT, `ПортСервераИсходящейПочты` INT, `ПротоколВходящейПочты` CHAR, `СерверВходящейПочты` CHAR, `СерверИсходящейПочты` CHAR, `СпособPOP3Аутентификации` CHAR, `СпособSMTPАутентификации` CHAR, `ТребуетсяВходНаСерверПередОтправкой` BOOLEAN);\nCREATE TABLE IF NOT EXISTS `cat_УсловияПредоставленияСкидокНаценок` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `УсловиеПредоставления` CHAR, `УсловиеПредоставления_T` CHAR, `ВариантОпределенияПериодаНакопительнойСкидки` CHAR, `ВариантНакопления` CHAR, `КритерийОграниченияПримененияЗаОбъемПродаж` CHAR, `ВалютаОграничения` CHAR, `ГрафикОплаты` CHAR, `ФормаОплаты` CHAR, `ЗначениеУсловияОграничения` FLOAT, `СегментНоменклатурыОграничения` CHAR, `ПериодНакопления` CHAR, `ТипСравнения` CHAR, `ГруппаПользователей` CHAR, `ВидКартыЛояльности` CHAR, `СегментПартнеров` CHAR, `КоличествоПериодовНакопления` INT, `ВариантОтбораНоменклатуры` CHAR, `КоличествоДнейДоДняРождения` INT, `КоличествоДнейПослеДняРождения` INT, `ВключатьТекущуюПродажуВНакопленныйОбъемПродаж` BOOLEAN, `УчитыватьХарактеристики` BOOLEAN, `ПараметрыВнешнейОбработки` CHAR, `ХранилищеНастроекКомпоновкиДанных` CHAR, `parent` CHAR, `ts_ВремяДействия` JSON);\nCREATE TABLE IF NOT EXISTS `cat_УпаковкиЕдиницыИзмерения` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Безразмерная` BOOLEAN, `Вес` FLOAT, `ВесЕдиницаИзмерения` CHAR, `Высота` FLOAT, `ВысотаЕдиницаИзмерения` CHAR, `Глубина` FLOAT, `ГлубинаЕдиницаИзмерения` CHAR, `ЕдиницаИзмерения` CHAR, `ЕдиницаИзмерения_T` CHAR, `Числитель` FLOAT, `Знаменатель` FLOAT, `ЛинейныеРазмерыПредставление` CHAR, `Объем` FLOAT, `ОбъемЕдиницаИзмерения` CHAR, `СкладскаяГруппа` CHAR, `Типоразмер` CHAR, `Ширина` FLOAT, `ШиринаЕдиницаИзмерения` CHAR, `КоличествоУпаковок` INT, `ПоставляетсяВМногооборотнойТаре` BOOLEAN, `НоменклатураМногооборотнаяТара` CHAR, `ХарактеристикаМногооборотнаяТара` CHAR, `МинимальноеКоличествоУпаковокМногооборотнойТары` INT, `ТипИзмеряемойВеличины` CHAR, `НаименованиеПолное` CHAR, `МеждународноеСокращение` CHAR, `ТипУпаковки` CHAR, `owner` CHAR, `owner_T` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ТранспортныеСредства` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВидПеревозки` CHAR, `ГосударственныйНомерПрицепа` CHAR, `ЛицензионнаяКарточкаВид` CHAR, `ЛицензионнаяКарточкаНомер` CHAR, `ЛицензионнаяКарточкаРегистрационныйНомер` CHAR, `ЛицензионнаяКарточкаСерия` CHAR, `Марка` CHAR, `Прицеп` CHAR, `type` CHAR, `ГрузоподъемностьВТоннах` FLOAT, `ВместимостьВКубическихМетрах` FLOAT, `ВместимостьПредставление` CHAR, `ВесЕдиницаИзмерения` CHAR, `ОбъемЕдиницаИзмерения` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СтруктураПредприятия` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ТекущийРуководитель` CHAR, `ВариантОбособленногоУчетаТоваров` CHAR, `Источник` CHAR, `СоответствуетСтруктуреЮридическихЛиц` BOOLEAN, `ПроизводственноеПодразделение` BOOLEAN, `ГрафикРаботы` CHAR, `ИнтервалПланирования` CHAR, `НачалоИнтервалаПланирования` Date, `ОкончаниеИнтервалаПланирования` Date, `УправлениеМаршрутнымиЛистами` CHAR, `РеквизитДопУпорядочивания` INT, `ЗаполнениеДоступностиДляРасписанияРЦКоличествоИнтервалов` INT, `ЗаполнениеДоступностиДляРасписанияРЦНапоминаниеДней` INT, `ЗаполнениеДоступностиДляГрафикаПроизводстваКоличествоИнтервалов` INT, `СпособПооперационногоУправления` CHAR, `ЗаполнениеДоступностиДляГрафикаПроизводстваНапоминаниеДней` INT, `ПодразделениеДиспетчер` BOOLEAN, `ИспользоватьСерииНоменклатуры` BOOLEAN, `ВремяНаРегистрациюВыполнения` INT, `ВремяНаРегистрациюВыполненияЕдИзм` CHAR, `УчитыватьСебестоимостьПоСериям` BOOLEAN, `ПроизводствоПоЗаказам` BOOLEAN, `ПроизводствоБезЗаказов` BOOLEAN, `ИспользуетсяСписаниеЗатратНаВыпуск` BOOLEAN, `parent` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_СтраныМира` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НаименованиеПолное` CHAR, `КодАльфа2` CHAR, `КодАльфа3` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СтатьиДвиженияДенежныхСредств` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `КорреспондирующийСчет` CHAR, `Описание` CHAR, `ВидДвиженияДенежныхСредств` CHAR, `РеквизитДопУпорядочивания` INT, `parent` CHAR, `ts_ХозяйственныеОперации` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_СоглашенияСКлиентами` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `number_doc` CHAR, `date` Date, `СегментПартнеров` CHAR, `Контрагент` CHAR, `Партнер` CHAR, `Организация` CHAR, `Валюта` CHAR, `ГрафикОплаты` CHAR, `СуммаДокумента` FLOAT, `Типовое` BOOLEAN, `СрокПоставки` INT, `ВидЦен` CHAR, `ЦенаВключаетНДС` BOOLEAN, `ИспользуетсяВРаботеТорговыхПредставителей` BOOLEAN, `Соглашение` CHAR, `Склад` CHAR, `СегментНоменклатуры` CHAR, `ДатаНачалаДействия` Date, `ДатаОкончанияДействия` Date, `Комментарий` CHAR, `Регулярное` BOOLEAN, `Период` CHAR, `КоличествоПериодов` INT, `Статус` CHAR, `Согласован` BOOLEAN, `Менеджер` CHAR, `НалогообложениеНДС` CHAR, `ХозяйственнаяОперация` CHAR, `СпособРасчетаВознаграждения` CHAR, `ПроцентВознаграждения` FLOAT, `УдержатьВознаграждение` BOOLEAN, `ПроцентРучнойСкидки` FLOAT, `ПроцентРучнойНаценки` FLOAT, `ДоступноВнешнимПользователям` BOOLEAN, `ПорядокОплаты` CHAR, `ГруппаФинансовогоУчета` CHAR, `ИспользуютсяДоговорыКонтрагентов` BOOLEAN, `ОграничиватьРучныеСкидки` BOOLEAN, `ФормаОплаты` CHAR, `КонтактноеЛицо` CHAR, `ПорядокРасчетов` CHAR, `ВозвращатьМногооборотнуюТару` BOOLEAN, `СрокВозвратаМногооборотнойТары` INT, `РассчитыватьДатуВозвратаТарыПоКалендарю` BOOLEAN, `calendar` CHAR, `ВариантРасчетаЦен` CHAR, `СценарийПланирования` CHAR, `ВидПлана` CHAR, `ТребуетсяЗалогЗаТару` BOOLEAN, `КалендарьВозвратаТары` CHAR, `ВидСоглашенияДляОграниченияЧтения` CHAR, `ВидСоглашенияДляОграниченияИзменения` CHAR, `СтатьяДвиженияДенежныхСредств` CHAR, `ВозможнаОтгрузкаБезПереходаПраваСобственности` BOOLEAN, `ОбеспечиватьЗаказыОбособленно` BOOLEAN, `КодНаименованияСделки` CHAR, `СпособОпределенияЦеныСделки` CHAR, `КодУсловийПоставки` CHAR, `ts_Товары` JSON, `ts_ЦеновыеГруппы` JSON, `ts_extra_fields` JSON, `ts_ЭтапыГрафикаОплаты` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Склады` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВыборГруппы` CHAR, `ИспользоватьАдресноеХранение` BOOLEAN, `ИспользоватьАдресноеХранениеСправочно` BOOLEAN, `ИспользоватьОрдернуюСхемуПриОтгрузке` BOOLEAN, `ИспользоватьОрдернуюСхемуПриОтраженииИзлишковНедостач` BOOLEAN, `ИспользоватьОрдернуюСхемуПриПоступлении` BOOLEAN, `ИспользоватьСерииНоменклатуры` BOOLEAN, `ИспользоватьСкладскиеПомещения` BOOLEAN, `calendar` CHAR, `КонтролироватьОперативныеОстатки` BOOLEAN, `НастройкаАдресногоХранения` CHAR, `Подразделение` CHAR, `РозничныйВидЦены` CHAR, `ТекущаяДолжностьОтветственного` CHAR, `ТекущийОтветственный` CHAR, `ТипСклада` CHAR, `УровеньОбслуживания` CHAR, `УчетныйВидЦены` CHAR, `НачинатьОтгрузкуПослеФормированияЗаданияНаПеревозку` BOOLEAN, `ИспользованиеРабочихУчастков` CHAR, `ИсточникИнформацииОЦенахДляПечати` CHAR, `ИспользоватьСтатусыРасходныхОрдеров` BOOLEAN, `ИспользоватьСтатусыПриходныхОрдеров` BOOLEAN, `СпособОбеспеченияПотребностей` CHAR, `ДатаНачалаОрдернойСхемыПриОтгрузке` Date, `ДатаНачалаОрдернойСхемыПриПоступлении` Date, `ДатаНачалаОрдернойСхемыПриОтраженииИзлишковНедостач` Date, `ДатаНачалаИспользованияСкладскихПомещений` Date, `ДатаНачалаАдресногоХраненияОстатков` Date, `УчитыватьСебестоимостьПоСериям` BOOLEAN, `КонтролироватьОбеспечение` BOOLEAN, `СкладОтветственногоХранения` BOOLEAN, `ВидПоклажедержателя` CHAR, `Поклажедержатель` CHAR, `Поклажедержатель_T` CHAR, `СрокОтветственногоХранения` INT, `ОтветственноеХранениеДоВостребования` BOOLEAN, `УсловияХраненияТоваров` CHAR, `ОсобыеОтметки` CHAR, `parent` CHAR, `ts_КонтактнаяИнформация` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_СкладскиеЯчейки` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Линия` CHAR, `ОбластьХранения` CHAR, `Позиция` CHAR, `ПорядокОбхода` INT, `РабочийУчасток` CHAR, `Секция` CHAR, `Помещение` CHAR, `Стеллаж` CHAR, `Типоразмер` CHAR, `ТипСкладскойЯчейки` CHAR, `УровеньДоступности` INT, `Ярус` CHAR, `МаксимальныйКоэффициентНаполненностиПоВесу` INT, `МаксимальныйКоэффициентНаполненностиПоОбъему` INT, `ИспользованиеПериодичностиИнвентаризацииЯчейки` CHAR, `КоличествоДнейМеждуИнвентаризациями` INT, `owner` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СкладскиеПомещения` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ИспользоватьАдресноеХранение` BOOLEAN, `ИспользоватьАдресноеХранениеСправочно` BOOLEAN, `НастройкаАдресногоХранения` CHAR, `ТекущийОтветственный` CHAR, `ТекущаяДолжностьОтветственного` CHAR, `ИспользованиеРабочихУчастков` CHAR, `ДатаНачалаАдресногоХраненияОстатков` Date, `owner` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СкладскиеГруппыУпаковок` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Описание` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СкладскиеГруппыНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Описание` CHAR, `ТипНоменклатуры` CHAR, `ФизическиРазличаетсяОтНазначения` BOOLEAN, `ОграничиватьПоВесу` BOOLEAN, `ОграничиватьПоОбъему` BOOLEAN);\nCREATE TABLE IF NOT EXISTS `cat_СкидкиНаценки` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВалютаПредоставления` CHAR, `ВариантСовместногоПрименения` CHAR, `ВидЦены` CHAR, `ЗначениеСкидкиНаценки` FLOAT, `РеквизитДопУпорядочивания` INT, `СпособПредоставления` CHAR, `СпособПредоставления_T` CHAR, `Управляемая` BOOLEAN, `ТекстСообщения` CHAR, `ВидКартыЛояльности` CHAR, `СегментПодарков` CHAR, `ИспользоватьКратность` BOOLEAN, `УсловиеДляСкидкиКоличеством` FLOAT, `ТочностьОкругления` FLOAT, `ПсихологическоеОкругление` FLOAT, `ОкруглятьВБольшуюСторону` BOOLEAN, `СпособПримененияСкидки` CHAR, `БонуснаяПрограммаЛояльности` CHAR, `ПериодДействия` CHAR, `КоличествоПериодовДействия` INT, `ПериодОтсрочкиНачалаДействия` CHAR, `КоличествоПериодовОтсрочкиНачалаДействия` INT, `ВариантРасчетаРезультатаСовместногоПрименения` CHAR, `ВариантОтбораНоменклатуры` CHAR, `СегментНоменклатурыОграничения` CHAR, `ПараметрыВнешнейОбработки` CHAR, `ВариантОкругления` CHAR, `ХранилищеНастроекКомпоновкиДанных` CHAR, `УстановленДополнительныйОтбор` BOOLEAN, `ПрименятьУмножениеВРамкахВышестоящейГруппы` BOOLEAN, `УчитыватьХарактеристики` BOOLEAN, `parent` CHAR, `ts_УсловияПредоставления` JSON, `ts_ЦеновыеГруппы` JSON);\nCREATE TABLE IF NOT EXISTS `cat_СерииНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ГоденДо` Date, `ВидНоменклатуры` CHAR, `number_doc` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_СегментыПартнеров` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ДатаОчистки` Date, `ДатаСоздания` Date, `Описание` CHAR, `Ответственный` CHAR, `СпособФормирования` CHAR, `СхемаКомпоновкиДанных` CHAR, `ПроверятьНаВхождениеПриСозданииНового` BOOLEAN, `РегламентноеЗадание` CHAR, `ХранилищеНастроекКомпоновкиДанных` CHAR, `ИмяШаблонаСКД` CHAR, `ЗапретОтгрузки` BOOLEAN, `parent` CHAR, `ts_ПартнерыПоСегменту` JSON);\nCREATE TABLE IF NOT EXISTS `cat_СегментыНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ДатаОчистки` Date, `ДатаСоздания` Date, `Описание` CHAR, `Ответственный` CHAR, `СпособФормирования` CHAR, `СхемаКомпоновкиДанных` CHAR, `РегламентноеЗадание` CHAR, `ХранилищеНастроекКомпоновкиДанных` CHAR, `ИмяШаблонаСКД` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СделкиСКлиентами` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВалютаПервичногоСпроса` CHAR, `ВероятностьУспешногоЗавершения` INT, `ВидСделки` CHAR, `ДатаНачала` Date, `ДатаОкончания` Date, `Закрыта` BOOLEAN, `Комментарий` CHAR, `Ответственный` CHAR, `Партнер` CHAR, `ПереведенаНаУправлениеВРучную` BOOLEAN, `ПотенциальнаяСуммаПродажи` FLOAT, `ПричинаПроигрышаСделки` CHAR, `Статус` CHAR, `СоглашениеСКлиентом` CHAR, `ОбособленныйУчетТоваровПоСделке` BOOLEAN, `ts_extra_fields` JSON, `ts_ПартнерыИКонтактныеЛица` JSON, `ts_ПервичныйСпрос` JSON, `ts_НаборыЗначенийДоступа` JSON);\nCREATE TABLE IF NOT EXISTS `cat_РолиКонтактныхЛицПартнеров` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Описание` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_Производители` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_Проекты` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Ответственный` CHAR, `ПлановаяДатаНачала` Date, `ДатаНачала` Date, `ПлановаяДатаОкончания` Date, `ДатаОкончания` Date, `Завершен` BOOLEAN, `Комментарий` CHAR, `ts_ПартнерыИКонтактныеЛица` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Пользователи` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Недействителен` BOOLEAN, `Подразделение` CHAR, `ФизическоеЛицо` CHAR, `Комментарий` CHAR, `ancillary` BOOLEAN, `Подготовлен` BOOLEAN, `ИдентификаторПользователяСервиса` CHAR, `СвойстваПользователяИБ` CHAR, `ts_extra_fields` JSON, `ts_КонтактнаяИнформация` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ПартнерыПрисоединенныеФайлы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Автор` CHAR, `ВладелецФайла` CHAR, `ДатаМодификацииУниверсальная` Date, `ДатаСоздания` Date, `Зашифрован` BOOLEAN, `Изменил` CHAR, `ИндексКартинки` INT, `Описание` CHAR, `ПодписанЭП` BOOLEAN, `ПутьКФайлу` CHAR, `Размер` INT, `Расширение` CHAR, `Редактирует` CHAR, `СтатусИзвлеченияТекста` CHAR, `ТекстХранилище` CHAR, `ТипХраненияФайла` CHAR, `Том` CHAR, `ФайлХранилище` CHAR, `ts_ЭлектронныеПодписи` JSON, `ts_СертификатыШифрования` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Партнеры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `БизнесРегион` CHAR, `ГруппаДоступа` CHAR, `ДатаРегистрации` Date, `Клиент` BOOLEAN, `Комментарий` CHAR, `Поставщик` BOOLEAN, `НаименованиеПолное` CHAR, `ОсновнойМенеджер` CHAR, `Конкурент` BOOLEAN, `ПрочиеОтношения` BOOLEAN, `ОбслуживаетсяТорговымиПредставителями` BOOLEAN, `ДополнительнаяИнформация` CHAR, `Перевозчик` BOOLEAN, `ШаблонЭтикетки` CHAR, `ЮрФизЛицо` CHAR, `Пол` CHAR, `ДатаРождения` Date, `parent` CHAR, `ts_extra_fields` JSON, `ts_КонтактнаяИнформация` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Организации` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВидОбменаСКонтролирующимиОрганами` CHAR, `Военкомат` CHAR, `ГоловнаяОрганизация` CHAR, `ГрафикРаботы` CHAR, `ИНН` CHAR, `ДополнительныйКодФСС` CHAR, `ЕстьОбособленныеПодразделения` BOOLEAN, `ИндивидуальныйПредприниматель` CHAR, `КодНалоговогоОргана` CHAR, `ДатаРегистрации` Date, `ИностраннаяОрганизация` BOOLEAN, `ИПКодПодчиненностиФСС` CHAR, `ИПРегистрационныйНомерПФР` CHAR, `ИПРегистрационныйНомерТФОМС` CHAR, `ИПРегистрационныйНомерФСС` CHAR, `КодВСтранеРегистрации` CHAR, `КодНалоговогоОрганаПолучателя` CHAR, `КодОрганаПФР` CHAR, `КодОрганаФСГС` CHAR, `КодОКОНХ` CHAR, `КодПоОКАТО` CHAR, `КодПоОКПО` CHAR, `КодПодчиненностиФСС` CHAR, `КрупнейшийНалогоплательщик` BOOLEAN, `НаименованиеПолное` CHAR, `НаименованиеСокращенное` CHAR, `НаименованиеТерриториальногоОрганаПФР` CHAR, `НаименованиеТерриториальногоОрганаФСС` CHAR, `НаименованиеИнострОрганизации` CHAR, `НаименованиеНалоговогоОргана` CHAR, `ОбменКаталогОтправкиДанныхОтчетности` CHAR, `ОбменКаталогПрограммыЭлектроннойПочты` CHAR, `ОбменКодАбонента` CHAR, `ОбособленноеПодразделение` BOOLEAN, `ОГРН` CHAR, `КПП` CHAR, `ПрименятьРайонныйКоэффициент` BOOLEAN, `ПрименятьСевернуюНадбавку` BOOLEAN, `РайонныйКоэффициент` FLOAT, `prefix` CHAR, `РегистрационныйНомерФСС` CHAR, `РегистрацияВНалоговомОргане` CHAR, `РегистрационныйНомерПФР` CHAR, `СвидетельствоДатаВыдачи` Date, `УчетнаяЗаписьОбмена` CHAR, `КодОКВЭД` CHAR, `НаименованиеОКВЭД` CHAR, `КодОКОПФ` CHAR, `РегистрационныйНомерТФОМС` CHAR, `НаименованиеОКОПФ` CHAR, `КодОКФС` CHAR, `РайонныйКоэффициентРФ` FLOAT, `СвидетельствоСерияНомер` CHAR, `СтранаПостоянногоМестонахождения` CHAR, `СтранаРегистрации` CHAR, `ГрафикРаботыСотрудников` CHAR, `НаименованиеОКФС` CHAR, `ЦифровойИндексОбособленногоПодразделения` INT, `ПроцентСевернойНадбавки` FLOAT, `ЮрФизЛицо` CHAR, `ЮридическоеФизическоеЛицо` CHAR, `ФайлЛоготип` CHAR, `ФайлФаксимильнаяПечать` CHAR, `ДопускаютсяВзаиморасчетыЧерезГоловнуюОрганизацию` BOOLEAN, `ЗарегистрированВОЭЗ` BOOLEAN, `ts_КонтактнаяИнформация` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ОбластиХранения` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Описание` CHAR, `Помещение` CHAR, `ПриоритетРазмещенияВСвободныеЯчейки` INT, `ПриоритетРазмещенияВМонотоварныеЯчейки` INT, `ПриоритетРазмещенияВСмешанныеЯчейки` INT, `ПриоритетРазмещенияВЯчейкиСДругимТоваром` INT, `ПриоритетОтбораИзМонотоварныхЯчеек` INT, `ПриоритетОтбораИзСмешанныхЯчеек` INT, `ПриоритетОтбораПодОстаток` INT, `ОписаниеМонотоварности` CHAR, `СтрогаяМонотоварность` BOOLEAN, `ИспользованиеПериодичностиИнвентаризацииЯчеек` CHAR, `КоличествоДнейМеждуИнвентаризациями` INT, `ОбластьОбособленногоХранения` BOOLEAN, `owner` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_НоменклатураПрисоединенныеФайлы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Автор` CHAR, `ВладелецФайла` CHAR, `ДатаМодификацииУниверсальная` Date, `ДатаСоздания` Date, `Зашифрован` BOOLEAN, `Изменил` CHAR, `ИндексКартинки` INT, `Описание` CHAR, `ПодписанЭП` BOOLEAN, `ПутьКФайлу` CHAR, `Размер` INT, `Расширение` CHAR, `Редактирует` CHAR, `СтатусИзвлеченияТекста` CHAR, `ТекстХранилище` CHAR, `ТипХраненияФайла` CHAR, `Том` CHAR, `ФайлХранилище` CHAR, `ts_ЭлектронныеПодписи` JSON, `ts_СертификатыШифрования` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Номенклатура` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НаименованиеПолное` CHAR, `Артикул` CHAR, `ВариантОформленияПродажи` CHAR, `ВесЕдиницаИзмерения` CHAR, `ВесЗнаменатель` FLOAT, `ВесИспользовать` BOOLEAN, `ВесМожноУказыватьВДокументах` BOOLEAN, `ВесЧислитель` FLOAT, `ВидНоменклатуры` CHAR, `ЕдиницаИзмерения` CHAR, `ЕдиницаИзмерения_T` CHAR, `ЕдиницаИзмеренияСрокаГодности` CHAR, `ЕстьТоварыДругогоКачества` BOOLEAN, `ДлинаЕдиницаИзмерения` CHAR, `ДлинаЗнаменатель` FLOAT, `ДлинаИспользовать` BOOLEAN, `ДлинаМожноУказыватьВДокументах` BOOLEAN, `ДлинаЧислитель` FLOAT, `ИспользованиеХарактеристик` CHAR, `ИспользоватьИндивидуальныйШаблонЦенника` BOOLEAN, `ИспользоватьИндивидуальныйШаблонЭтикетки` BOOLEAN, `ИспользоватьУпаковки` BOOLEAN, `Качество` CHAR, `КодДляПоиска` CHAR, `Марка` CHAR, `НаборУпаковок` CHAR, `СтавкаНДС` CHAR, `НоменклатураМногооборотнаяТара` CHAR, `ОбъемДАЛ` FLOAT, `Описание` CHAR, `ПоставляетсяВМногооборотнойТаре` BOOLEAN, `Производитель` CHAR, `ПроизводительИмпортерДляДекларацийАлко` CHAR, `СкладскаяГруппа` CHAR, `СрокГодности` INT, `ТипНоменклатуры` CHAR, `ТоварнаяКатегория` CHAR, `ФайлКартинки` CHAR, `ФайлОписанияДляСайта` CHAR, `ОбъемЕдиницаИзмерения` CHAR, `ОбъемЗнаменатель` FLOAT, `ОбъемИспользовать` BOOLEAN, `ОбъемМожноУказыватьВДокументах` BOOLEAN, `ОбъемЧислитель` FLOAT, `ПлощадьЕдиницаИзмерения` CHAR, `ПлощадьЗнаменатель` FLOAT, `ПлощадьИспользовать` BOOLEAN, `ПлощадьМожноУказыватьВДокументах` BOOLEAN, `ПлощадьЧислитель` FLOAT, `ЦеноваяГруппа` CHAR, `ШаблонЦенника` CHAR, `ЕдиницаДляОтчетов` CHAR, `ЕдиницаДляОтчетов_T` CHAR, `КоэффициентЕдиницыДляОтчетов` FLOAT, `ШаблонЭтикетки` CHAR, `СезоннаяГруппа` CHAR, `КоллекцияНоменклатуры` CHAR, `Принципал` CHAR, `Принципал_T` CHAR, `Контрагент` CHAR, `Контрагент_T` CHAR, `РейтингПродаж` CHAR, `ОбособленнаяЗакупкаПродажа` BOOLEAN, `КодТНВЭД` CHAR, `КодОКВЭД` CHAR, `КодОКП` CHAR, `ОблагаетсяНДПИПоПроцентнойСтавке` BOOLEAN, `ВладелецСерий` CHAR, `ВладелецХарактеристик` CHAR, `ВладелецТоварныхКатегорий` CHAR, `Цена_Мин` FLOAT, `Цена_Макс` FLOAT, `Файлы` CHAR, `МаркетИд` CHAR, `Характеристики` CHAR, `parent` CHAR, `Цена` FLOAT, `ts_extra_fields` JSON, `ts_ДрагоценныеМатериалы` JSON);\nCREATE TABLE IF NOT EXISTS `cat_НаправленияДеятельности` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `parent` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_НаборыУпаковок` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ЕдиницаИзмерения` CHAR, `ЕдиницаИзмерения_T` CHAR, `ЕдиницаДляОтчетов` CHAR, `ЕдиницаДляОтчетов_T` CHAR, `КоэффициентЕдиницыДляОтчетов` FLOAT);\nCREATE TABLE IF NOT EXISTS `cat_НаборыДополнительныхРеквизитовИСведений` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `КоличествоРеквизитов` CHAR, `КоличествоСведений` CHAR, `Используется` BOOLEAN, `parent` CHAR, `ts_extra_fields` JSON, `ts_extra_properties` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Контрагенты` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НаименованиеПолное` CHAR, `ОбособленноеПодразделение` BOOLEAN, `ЮридическоеФизическоеЛицо` CHAR, `СтранаРегистрации` CHAR, `ГоловнойКонтрагент` CHAR, `ИНН` CHAR, `КПП` CHAR, `ДополнительнаяИнформация` CHAR, `Партнер` CHAR, `ЮрФизЛицо` CHAR, `НДСпоСтавкам4и2` BOOLEAN, `КодПоОКПО` CHAR, `РегистрационныйНомер` CHAR, `ts_КонтактнаяИнформация` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_КонтактныеЛицаПартнеров` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ДатаРегистрацииСвязи` Date, `ДатаПрекращенияСвязи` Date, `Автор` CHAR, `Автор_T` CHAR, `Комментарий` CHAR, `ДополнительнаяИнформация` CHAR, `ДолжностьПоВизитке` CHAR, `Пол` CHAR, `ДатаРождения` Date, `owner` CHAR, `ts_КонтактнаяИнформация` JSON, `ts_РолиКонтактногоЛица` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_КлассификаторБанковРФ` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `КоррСчет` CHAR, `Город` CHAR, `Адрес` CHAR, `Телефоны` CHAR, `ДеятельностьПрекращена` BOOLEAN, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_Кассы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `КассоваяКнига` CHAR, `ВалютаДенежныхСредств` CHAR, `Подразделение` CHAR, `РазрешитьПлатежиБезУказанияЗаявок` BOOLEAN, `СрокИнкассации` INT, `ГруппаФинансовогоУчета` CHAR, `ЭтоКассаОбособленногоПодразделения` BOOLEAN, `СчетУчета` CHAR, `owner` CHAR, `ts_ПолучателиПлатежейПриПеремещенииДС` JSON, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_КартыЛояльности` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Штрихкод` CHAR, `МагнитныйКод` CHAR, `Статус` CHAR, `Партнер` CHAR, `Контрагент` CHAR, `Соглашение` CHAR, `owner` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ИдентификаторыОбъектовМетаданных` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ПорядокКоллекции` INT, `Имя` CHAR, `synonym` CHAR, `ПолноеИмя` CHAR, `ПолныйСиноним` CHAR, `БезДанных` BOOLEAN, `ЗначениеПустойСсылки` CHAR, `ЗначениеПустойСсылки_T` CHAR, `КлючОбъектаМетаданных` CHAR, `НоваяСсылка` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_property_values` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Вес` FLOAT, `owner` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ДоговорыКонтрагентов` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `БанковскийСчет` CHAR, `БанковскийСчетКонтрагента` CHAR, `ВалютаВзаиморасчетов` CHAR, `Комментарий` CHAR, `ДатаНачалаДействия` Date, `ДатаОкончанияДействия` Date, `Организация` CHAR, `Контрагент` CHAR, `Менеджер` CHAR, `НаименованиеДляПечати` CHAR, `УчетАгентскогоНДС` BOOLEAN, `ВидАгентскогоДоговора` CHAR, `date` Date, `number_doc` CHAR, `Партнер` CHAR, `Подразделение` CHAR, `ПорядокОплаты` CHAR, `ПорядокРасчетов` CHAR, `Согласован` BOOLEAN, `Статус` CHAR, `ХозяйственнаяОперация` CHAR, `ТипДоговора` CHAR, `ОграничиватьСуммуЗадолженности` BOOLEAN, `ДопустимаяСуммаЗадолженности` FLOAT, `ГруппаФинансовогоУчета` CHAR, `ЗапрещаетсяПросроченнаяЗадолженность` BOOLEAN, `КонтактноеЛицо` CHAR, `СтатьяДвиженияДенежныхСредств` CHAR, `ИдентификаторПлатежа` CHAR, `УстановленСрокОплаты` BOOLEAN, `СрокОплаты` INT, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ГрафикиОплаты` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ФормаОплаты` CHAR, `ТолькоКредитныеЭтапы` BOOLEAN, `calendar` CHAR, `ts_Этапы` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ВнешниеПользователи` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ОбъектАвторизации` CHAR, `ОбъектАвторизации_T` CHAR, `Комментарий` CHAR, `ИдентификаторПользователяИБ` CHAR, `ИдентификаторПользователяСервиса` CHAR, `ПользовательИБИмя` CHAR, `ПользовательИБПароль` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ВидыЦен` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВалютаЦены` CHAR, `ЦенаВключаетНДС` BOOLEAN, `ИспользоватьПриПродаже` BOOLEAN, `ИспользоватьПриПередачеМеждуОрганизациями` BOOLEAN, `ИспользоватьПриВыпускеПродукции` BOOLEAN, `СпособЗаданияЦены` CHAR, `Формула` CHAR, `ОкруглятьВБольшуюСторону` BOOLEAN, `РеквизитДопУпорядочивания` INT, `identifier` CHAR, `ПорогСрабатывания` FLOAT, `СхемаКомпоновкиДанных` CHAR, `ХранилищеСхемыКомпоновкиДанных` CHAR, `ХранилищеНастроекКомпоновкиДанных` CHAR, `БазовыйВидЦены` CHAR, `Наценка` FLOAT, `ТочностьОкругления` FLOAT, `Округлять` BOOLEAN, `УстанавливатьЦенуПриВводеНаОсновании` BOOLEAN, `ИспользоватьПриПередачеПродукцииДавальцу` BOOLEAN, `ВариантОкругления` CHAR, `ts_ВлияющиеВидыЦен` JSON, `ts_ЦеновыеГруппы` JSON, `ts_ПравилаОкругленияЦены` JSON, `ts_ПорогиСрабатывания` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ВидыСделокСКлиентами` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Описание` CHAR, `Ответственный` CHAR, `ТипСделки` CHAR, `ИспользованиеРазрешено` BOOLEAN, `ИспользоватьСпрос` BOOLEAN, `ОбособленныйУчетТоваровПоСделке` BOOLEAN, `ts_ЭтапыСделкиПоПродаже` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ВидыСвязейМеждуФизЛицами` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Комментарий` CHAR, `РольФизЛица1` CHAR, `РольФизЛица2` CHAR, `ОбратноеНаименование` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ВидыСвязейМеждуПартнерами` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Комментарий` CHAR, `РольПартнера1` CHAR, `РольПартнера2` CHAR, `ОбратноеНаименование` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ВидыНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `АлкогольнаяПродукция` BOOLEAN, `ВариантОказанияУслуг` CHAR, `ВариантОформленияПродажи` CHAR, `ВариантПредставленияНабораВПечатныхФормах` CHAR, `ВариантРасчетаЦеныНабора` CHAR, `ВидАлкогольнойПродукции` CHAR, `ВладелецСерий` CHAR, `ВладелецТоварныхКатегорий` CHAR, `ВладелецХарактеристик` CHAR, `ГруппаАналитическогоУчета` CHAR, `ГруппаДоступа` CHAR, `ГруппаФинансовогоУчета` CHAR, `ЕдиницаДляОтчетов` CHAR, `ЕдиницаДляОтчетов_T` CHAR, `ЕдиницаИзмерения` CHAR, `ЕдиницаИзмерения_T` CHAR, `ИмпортнаяАлкогольнаяПродукция` BOOLEAN, `ИспользованиеХарактеристик` CHAR, `ИспользоватьИндивидуальноеНаименованиеПриПечати` BOOLEAN, `ИспользоватьКоличествоСерии` BOOLEAN, `ИспользоватьНомерСерии` BOOLEAN, `ИспользоватьСерии` BOOLEAN, `ИспользоватьСрокГодностиСерии` BOOLEAN, `ИспользоватьУпаковки` BOOLEAN, `ИспользоватьХарактеристики` BOOLEAN, `КоэффициентЕдиницыДляОтчетов` FLOAT, `НаборСвойств` CHAR, `НаборСвойствСерий` CHAR, `НаборСвойствХарактеристик` CHAR, `НаборУпаковок` CHAR, `НаименованиеДляПечати` CHAR, `НоменклатураМногооборотнаяТара` CHAR, `Описание` CHAR, `ПодакцизныйТовар` BOOLEAN, `ПоставляетсяВМногооборотнойТаре` BOOLEAN, `СезоннаяГруппа` CHAR, `СкладскаяГруппа` CHAR, `СодержитДрагоценныеМатериалы` BOOLEAN, `ТипНоменклатуры` CHAR, `ТочностьУказанияСрокаГодностиСерии` CHAR, `СтавкаНДС` CHAR, `ХарактеристикаМногооборотнаяТара` CHAR, `ТоварныеКатегориеОбщиеСДругимВидомНоменклатуры` BOOLEAN, `ШаблонЦенника` CHAR, `ШаблонЭтикетки` CHAR, `ШаблонЭтикеткиСерии` CHAR, `КодОКВЭД` CHAR, `КодТНВЭД` CHAR, `Цена_Мин` FLOAT, `Цена_Макс` FLOAT, `Производители` CHAR, `parent` CHAR, `ts_РеквизитыБыстрогоОтбораНоменклатуры` JSON, `ts_РеквизитыБыстрогоОтбораХарактеристик` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ВидыКонтактнойИнформации` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `АдресТолькоРоссийский` BOOLEAN, `ВключатьСтрануВПредставление` BOOLEAN, `ЗапретитьРедактированиеПользователем` BOOLEAN, `Используется` BOOLEAN, `МожноИзменятьСпособРедактирования` BOOLEAN, `ОбязательноеЗаполнение` BOOLEAN, `tooltip` CHAR, `ПроверятьКорректность` BOOLEAN, `ПроверятьПоФИАС` BOOLEAN, `РазрешитьВводНесколькихЗначений` BOOLEAN, `РедактированиеТолькоВДиалоге` BOOLEAN, `РеквизитДопУпорядочивания` INT, `СкрыватьНеактуальныеАдреса` BOOLEAN, `ТелефонCДобавочнымНомером` BOOLEAN, `type` CHAR, `УказыватьОКТМО` BOOLEAN, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ВидыКартЛояльности` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Статус` CHAR, `ДатаНачалаДействия` Date, `ДатаОкончанияДействия` Date, `Комментарий` CHAR, `Персонализирована` BOOLEAN, `АвтоматическаяРегистрацияПриПервомСчитывании` BOOLEAN, `ТипКарты` CHAR, `Организация` CHAR, `БонуснаяПрограммаЛояльности` CHAR, `ts_extra_fields` JSON, `ts_ШаблоныКодовКартЛояльности` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ВидыЗапасов` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Организация` CHAR, `ТипЗапасов` CHAR, `НалогообложениеНДС` CHAR, `Комитент` CHAR, `Комитент_T` CHAR, `Соглашение` CHAR, `Валюта` CHAR, `РеализацияЗапасовДругойОрганизации` BOOLEAN, `ВидЗапасовВладельца` CHAR, `СпособПередачиТоваров` CHAR, `Поставщик` CHAR, `Поставщик_T` CHAR, `Предназначение` CHAR, `Подразделение` CHAR, `Менеджер` CHAR, `Сделка` CHAR, `ГруппаФинансовогоУчета` CHAR, `Контрагент` CHAR, `Контрагент_T` CHAR, `Договор` CHAR, `Назначение` CHAR, `ГруппаПродукции` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ВидыДокументовФизическихЛиц` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `КодМВД` CHAR, `КодПФР` CHAR, `РеквизитДопУпорядочивания` INT);\nCREATE TABLE IF NOT EXISTS `cat_ВариантыКомплектацииНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Характеристика` CHAR, `Основной` BOOLEAN, `НоменклатураОсновногоКомпонента` CHAR, `ХарактеристикаОсновногоКомпонента` CHAR, `Упаковка` CHAR, `КоличествоУпаковок` FLOAT, `Количество` FLOAT, `ДлительностьСборкиРазборки` INT, `ВариантРасчетаЦеныНабора` CHAR, `ВариантПредставленияНабораВПечатныхФормах` CHAR, `СодержитТовары` BOOLEAN, `СодержитУслуги` BOOLEAN, `owner` CHAR, `ts_Товары` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ВариантыКлассификацииЗадолженности` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `calendar` CHAR, `ts_Интервалы` JSON);\nCREATE TABLE IF NOT EXISTS `cat_Валюты` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ЗагружаетсяИзИнтернета` BOOLEAN, `НаименованиеПолное` CHAR, `Наценка` FLOAT, `ОсновнаяВалюта` CHAR, `ПараметрыПрописиНаРусском` CHAR, `ФормулаРасчетаКурса` CHAR, `СпособУстановкиКурса` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_БизнесРегионы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ОсновнойМенеджер` CHAR, `ЗначениеГеографическогоРегиона` CHAR, `ЗначениеГеографическогоРегион_T` CHAR, `ГеографическийРегион` CHAR, `parent` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_БанковскиеСчетаОрганизаций` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ВалютаДенежныхСредств` CHAR, `НомерСчета` CHAR, `Банк` CHAR, `БанкДляРасчетов` CHAR, `ТекстКорреспондента` CHAR, `ТекстНазначения` CHAR, `ВариантВыводаМесяца` CHAR, `ВыводитьСуммуБезКопеек` BOOLEAN, `СрокИсполненияПлатежа` INT, `ИспользоватьОбменСБанком` BOOLEAN, `Программа` CHAR, `Кодировка` CHAR, `ФайлЗагрузки` CHAR, `ФайлВыгрузки` CHAR, `РазрешитьПлатежиБезУказанияЗаявок` BOOLEAN, `Подразделение` CHAR, `БИКБанка` CHAR, `РучноеИзменениеРеквизитовБанка` BOOLEAN, `НаименованиеБанка` CHAR, `КоррСчетБанка` CHAR, `ГородБанка` CHAR, `АдресБанка` CHAR, `ТелефоныБанка` CHAR, `БИКБанкаДляРасчетов` CHAR, `РучноеИзменениеРеквизитовБанкаДляРасчетов` BOOLEAN, `НаименованиеБанкаДляРасчетов` CHAR, `КоррСчетБанкаДляРасчетов` CHAR, `ГородБанкаДляРасчетов` CHAR, `АдресБанкаДляРасчетов` CHAR, `ТелефоныБанкаДляРасчетов` CHAR, `ГруппаФинансовогоУчета` CHAR, `ИспользоватьПрямойОбменСБанком` BOOLEAN, `ОбменСБанкомВключен` BOOLEAN, `СчетУчета` CHAR, `СВИФТБанка` CHAR, `СВИФТБанкаДляРасчетов` CHAR, `ИностранныйБанк` BOOLEAN, `СчетВБанкеДляРасчетов` CHAR, `owner` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_БанковскиеСчетаКонтрагентов` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НомерСчета` CHAR, `Банк` CHAR, `БанкДляРасчетов` CHAR, `ТекстКорреспондента` CHAR, `ТекстНазначения` CHAR, `ВалютаДенежныхСредств` CHAR, `БИКБанка` CHAR, `РучноеИзменениеРеквизитовБанка` BOOLEAN, `НаименованиеБанка` CHAR, `КоррСчетБанка` CHAR, `ГородБанка` CHAR, `АдресБанка` CHAR, `ТелефоныБанка` CHAR, `БИКБанкаДляРасчетов` CHAR, `РучноеИзменениеРеквизитовБанкаДляРасчетов` BOOLEAN, `НаименованиеБанкаДляРасчетов` CHAR, `КоррСчетБанкаДляРасчетов` CHAR, `ГородБанкаДляРасчетов` CHAR, `АдресБанкаДляРасчетов` CHAR, `ТелефоныБанкаДляРасчетов` CHAR, `СВИФТБанка` CHAR, `СВИФТБанкаДляРасчетов` CHAR, `ИностранныйБанк` BOOLEAN, `СчетВБанкеДляРасчетов` CHAR, `owner` CHAR, `owner_T` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_ОбщероссийскийКлассификаторПродукции` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НаименованиеПолное` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_КлассификаторТНВЭД` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НаименованиеПолное` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_КлассификаторВидовЭкономическойДеятельности` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `НаименованиеПолное` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_КоллекцииНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ДатаНачалаПродаж` Date, `ДатаЗапретаПродажи` Date, `ДатаНачалаЗакупок` Date, `ДатаЗапретаЗакупки` Date, `parent` CHAR, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_РейтингиПродажНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `РеквизитДопУпорядочивания` INT, `ts_extra_fields` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ПредопределенныеЭлементы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Элемент` CHAR, `Элемент_T` CHAR, `ts_Элементы` JSON);\nCREATE TABLE IF NOT EXISTS `cat_ИдентификаторыОбъектовРасширений` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ПорядокКоллекции` INT, `Имя` CHAR, `synonym` CHAR, `ПолноеИмя` CHAR, `ПолныйСиноним` CHAR, `БезДанных` BOOLEAN, `ЗначениеПустойСсылки` CHAR, `ЗначениеПустойСсылки_T` CHAR, `КлючОбъектаМетаданных` CHAR, `НоваяСсылка` CHAR, `ИмяРасширения` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СертификатыНоменклатуры` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `ДатаНачалаСрокаДействия` Date, `ДатаОкончанияСрокаДействия` Date, `Бессрочный` BOOLEAN, `ОрганВыдавшийДокумент` CHAR, `ТипСертификата` CHAR, `number_doc` CHAR, `presentation` CHAR, `Статус` CHAR, `parent` CHAR);\nCREATE TABLE IF NOT EXISTS `cat_СезонныеГруппы` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN);\nCREATE TABLE IF NOT EXISTS `cat_ВидыПодарочныхСертификатов` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `Номинал` FLOAT, `Валюта` CHAR, `Комментарий` CHAR, `СегментНоменклатуры` CHAR, `ТипКарты` CHAR, `ПериодДействия` CHAR, `КоличествоПериодовДействия` INT, `ЧастичнаяОплата` BOOLEAN, `СчетУчета` CHAR, `СтатьяДоходов` CHAR, `АналитикаДоходов` CHAR, `АналитикаДоходов_T` CHAR, `ts_extra_fields` JSON, `ts_ШаблоныКодовПодарочныхСертификатов` JSON);\nCREATE TABLE IF NOT EXISTS `cat_БонусныеПрограммыЛояльности` (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT, id CHAR, name CHAR, is_folder BOOLEAN, `КурсКонвертацииБонусовВВалюту` FLOAT, `МаксимальныйПроцентОплатыБонусами` FLOAT, `ВалютаКонвертацииБонусов` CHAR, `НеНачислятьБаллыПриОплатеБонусами` BOOLEAN, `СегментНоменклатуры` CHAR, `Комментарий` CHAR, `ts_ЦеновыеГруппы` JSON, `ts_extra_fields` JSON);\n"});
return undefined;
}));
