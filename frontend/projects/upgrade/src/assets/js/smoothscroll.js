'use strict';

// polyfill
function polyfill() {
  // aliases
  var w = window;
  var d = document;

  // return if scroll behavior is supported and polyfill is not forced
//   if (
//     'scrollBehavior' in d.documentElement.style &&
//     w.__forceSmoothScrollPolyfill__ !== true
//   ) {
//     return;
//   }

  // globals
  var Element = w.HTMLElement || w.Element;
  var DEFAULT_DURATION = 468;
  var DEFAULT_EASING_FUNCTION = (k) => 0.5 * (1 - Math.cos(Math.PI * k));

  // object gathering original scroll methods
  var original = {
    scroll: w.scroll || w.scrollTo,
    elementScroll: Element.prototype.scroll || scrollElement,
  };

  // define timing method
  var now =
    w.performance && w.performance.now
      ? w.performance.now.bind(w.performance)
      : Date.now;

  /**
   * changes scroll position inside an element
   * @method scrollElement
   * @param {Number} x
   * @param {Number} y
   * @returns {undefined}
   */
  function scrollElement(x, y) {
    this.scrollLeft = x;
    this.scrollTop = y;
  }

  var EASING_FUNCTIONS = {
    linear: (k) => k,
    easeInQuad: (k) => k * k,
    easeOutQuad: (k) => k * (2 - k),
    easeInOutQuad: (k) => k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k,
    easeInCubic: (k) => k * k * k,
    easeOutCubic: (k) => (--k) * k * k + 1,
    easeInOutCubic: (k) => k < 0.5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1,
    easeInQuart: (k) => k * k * k * k,
    easeOutQuart: (k) => 1 - (--k) * k * k * k,
    easeInOutQuart: (k) => k < 0.5 ? 8 * k * k * k * k : 1 - 8 * (--k) * k * k * k,
    easeInQuint: (k) => k * k * k * k * k,
    easeOutQuint: (k) => 1 + (--k) * k * k * k * k,
    easeInOutQuint: (k) => k < 0.5 ? 16 * k * k * k * k * k : 1 + 16 * (--k) * k * k * k * k,
  }

  /**
   * returns result of applying ease math function to a number
   * @method ease
   * @param {Number} k
   * @param {Function} easingFunction
   * @returns {Number}
   */
  function ease(k, easingFunction) {
    return easingFunction(k);
  }

  /**
   * indicates if a smooth behavior should be applied
   * @method shouldBailOut
   * @param {Number|Object} firstArg
   * @returns {Boolean}
   */
  function shouldBailOut(firstArg) {
    if (
      firstArg === null ||
      typeof firstArg !== 'object' ||
      firstArg.behavior === undefined ||
      firstArg.behavior === 'auto' ||
      firstArg.behavior === 'instant'
    ) {
      // first argument is not an object/null
      // or behavior is auto, instant or undefined
      return true;
    }

    if (typeof firstArg === 'object' && firstArg.behavior === 'smooth') {
      // first argument is an object and behavior is smooth
      return false;
    }

    // throw error when behavior is not supported
    throw new TypeError(
      'behavior member of ScrollOptions ' +
        firstArg.behavior +
        ' is not a valid value for enumeration ScrollBehavior.'
    );
  }

  /**
   * self invoked function that, given a context, steps through scrolling
   * @method step
   * @param {Object} context
   * @returns {undefined}
   */
  function step(context) {
    var time = now();
    var value;
    var currentX;
    var currentY;
    var elapsed = (time - context.startTime) / context.duration;

    // avoid elapsed times higher than one
    elapsed = elapsed > 1 ? 1 : elapsed;

    // apply easing to elapsed time
    value = ease(elapsed, context.easingFunction);

    currentX = context.startX + (context.x - context.startX) * value;
    currentY = context.startY + (context.y - context.startY) * value;

    context.method.call(context.scrollable, currentX, currentY);

    // scroll more if we have not reached our destination
    if (currentX !== context.x || currentY !== context.y) {
      w.requestAnimationFrame(step.bind(w, context));
    }
  }

  /**
   * scrolls window or element with a smooth behavior
   * @method smoothScroll
   * @param {Object|Node} el
   * @param {Number} x
   * @param {Number} y
   * @param {Number} duration
   * @param {Function} easingFunction
   * @returns {undefined}
   */
  function smoothScroll(el, x, y, duration, easingFunction) {
    var scrollable;
    var startX;
    var startY;
    var method;
    var startTime = now();

    // define scroll context
    if (el === d.body) {
      scrollable = w;
      startX = w.scrollX || w.pageXOffset;
      startY = w.scrollY || w.pageYOffset;
      method = original.scroll;
    } else {
      scrollable = el;
      startX = el.scrollLeft;
      startY = el.scrollTop;
      method = scrollElement;
    }

    // scroll looping over a frame
    step({
      scrollable: scrollable,
      method: method,
      startTime: startTime,
      startX: startX,
      startY: startY,
      x: x,
      y: y,
      duration: duration,
      easingFunction: easingFunction
    });
  }

  // Element.prototype.scroll and Element.prototype.scrollTo
  Element.prototype.scroll = Element.prototype.scrollTo = function() {
    // avoid action when no arguments are passed
    if (arguments[0] === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(arguments[0]) === true) {
      // if one number is passed, throw error to match Firefox implementation
      if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
        throw new SyntaxError('Value could not be converted');
      }

      original.elementScroll.call(
        this,
        // use left prop, first number argument or fallback to scrollLeft
        arguments[0].left !== undefined
          ? ~~arguments[0].left
          : typeof arguments[0] !== 'object' ? ~~arguments[0] : this.scrollLeft,
        // use top prop, second argument or fallback to scrollTop
        arguments[0].top !== undefined
          ? ~~arguments[0].top
          : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
      );
      return;
    }

    var left = arguments[0].left;
    var top = arguments[0].top;

    // LET THE SMOOTHNESS BEGIN!
    smoothScroll.call(
      this,
      this,
      typeof left === 'undefined' ? this.scrollLeft : ~~left,
      typeof top === 'undefined' ? this.scrollTop : ~~top,
      typeof arguments[0].duration === 'number'
        ? Math.max(arguments[0].duration, 0)
        : DEFAULT_DURATION,
      typeof arguments[0].easing === 'string' && EASING_FUNCTIONS.hasOwnProperty(arguments[0].easing)
        ? EASING_FUNCTIONS[arguments[0].easing]
        : DEFAULT_EASING_FUNCTION
    );
  };
}

if (typeof exports === 'object' && typeof module !== 'undefined') {
  // commonjs
  module.exports = { polyfill: polyfill };
} else {
  // global
  polyfill();
}