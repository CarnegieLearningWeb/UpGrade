/* eslint-disable no-prototype-builtins */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-bitwise */
/*

The code in this file is based on Smooth Scroll behavior polyfill (https://github.com/iamdustan/smoothscroll).

The MIT License (MIT)

Copyright (c) 2013 Dustan Kasten

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

'use strict';

// globals
const w: Record<string, any> = window;
const d: Record<string, any> = document;
const isScrollBehaviorSupported: boolean = 'scrollBehavior' in d.documentElement.style;
const element: Record<string, any> = w.HTMLElement || w.Element;
const DEFAULT_DURATION = 468;
const DEFAULT_EASING_FUNCTION: (k: number) => number = (k) => 0.5 * (1 - Math.cos(Math.PI * k));

// object gathering original scroll methods
const original: Record<string, any> = {
  scroll: w.scroll || w.scrollTo,
  elementScroll: element.prototype.scroll || scrollElement,
};

// define timing method
const now: () => number = w.performance && w.performance.now ? w.performance.now.bind(w.performance) : Date.now;

// changes scroll position inside an element
function scrollElement(x: number, y: number): void {
  this.scrollLeft = x;
  this.scrollTop = y;
}

// easing functions
const EASING_FUNCTIONS: Record<string, (k: number) => number> = {
  linear: (k: number): number => k,
  easeInQuad: (k: number): number => k * k,
  easeOutQuad: (k: number): number => k * (2 - k),
  easeInOutQuad: (k: number): number => (k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k),
  easeInCubic: (k: number): number => k * k * k,
  easeOutCubic: (k: number): number => --k * k * k + 1,
  easeInOutCubic: (k: number): number => (k < 0.5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1),
  easeInQuart: (k: number): number => k * k * k * k,
  easeOutQuart: (k: number): number => 1 - --k * k * k * k,
  easeInOutQuart: (k: number): number => (k < 0.5 ? 8 * k * k * k * k : 1 - 8 * --k * k * k * k),
  easeInQuint: (k: number): number => k * k * k * k * k,
  easeOutQuint: (k: number): number => 1 + --k * k * k * k * k,
  easeInOutQuint: (k: number): number => (k < 0.5 ? 16 * k * k * k * k * k : 1 + 16 * --k * k * k * k * k),
};

// indicates if a smooth behavior should be applied
function shouldBailOut(firstArg: Record<string, any>): boolean {
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
    'behavior member of ScrollOptions ' + firstArg.behavior + ' is not a valid value for enumeration ScrollBehavior.'
  );
}

// context type alias
interface Context {
  scrollable: Object;
  method: (x: number, y: number) => void;
  startTime: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  duration: number;
  easingFunction: (k: number) => number;
}

// self invoked function that, given a context, steps through scrolling
function step(context: Context): void {
  const time: number = now();
  let elapsed: number = (time - context.startTime) / context.duration;

  // avoid elapsed times higher than one
  elapsed = elapsed > 1 ? 1 : elapsed;

  // apply easing to elapsed time
  const value = context.easingFunction(elapsed);

  const currentX = context.startX + (context.x - context.startX) * value;
  const currentY = context.startY + (context.y - context.startY) * value;

  context.method.call(context.scrollable, currentX, currentY);

  // scroll more if we have not reached our destination
  if (currentX !== context.x || currentY !== context.y) {
    w.requestAnimationFrame(step.bind(w, context));
  }
}

// element type alias
type El = HTMLElement;

// scroll window or element with a smooth behavior
function smoothScroll(el: El, x: number, y: number, duration: number, easingFunction: (k: number) => number): void {
  let scrollable: Record<string, any>;
  let startX: number;
  let startY: number;
  let method: (x: number, y: number) => void;
  const startTime: number = now();

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
    scrollable,
    method,
    startTime,
    startX,
    startY,
    x,
    y,
    duration,
    easingFunction,
  });
}

// Element.prototype.scroll and Element.prototype.scrollTo
element.prototype.scroll = element.prototype.scrollTo = function () {
  // avoid action when no arguments are passed
  if (arguments[0] === undefined) {
    return;
  }
  // if the scroll-behavior is supported, and the duration and easing are not given
  if (
    isScrollBehaviorSupported &&
    arguments[0] !== null &&
    typeof arguments[0] === 'object' &&
    arguments[0].duration === undefined &&
    arguments[0].easing === undefined
  ) {
    // use the original function
    original.elementScroll.apply(this, arguments);
    return;
  }

  // avoid smooth behavior if not required
  if (shouldBailOut(arguments[0])) {
    // if one number is passed, throw error to match Firefox implementation
    if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
      throw new SyntaxError('Value could not be converted');
    }

    original.elementScroll.call(
      this,
      // use left prop, first number argument or fallback to scrollLeft
      arguments[0].left !== undefined
        ? ~~arguments[0].left
        : typeof arguments[0] !== 'object'
        ? ~~arguments[0]
        : this.scrollLeft,
      // use top prop, second argument or fallback to scrollTop
      arguments[0].top !== undefined ? ~~arguments[0].top : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
    );
    return;
  }

  const left: number = arguments[0].left;
  const top: number = arguments[0].top;

  // scroll with a smooth behavior
  smoothScroll.call(
    this,
    this,
    typeof left === 'undefined' ? this.scrollLeft : ~~left,
    typeof top === 'undefined' ? this.scrollTop : ~~top,
    typeof arguments[0].duration === 'number' ? Math.max(arguments[0].duration, 0) : DEFAULT_DURATION,
    typeof arguments[0].easing === 'string' && EASING_FUNCTIONS.hasOwnProperty(arguments[0].easing)
      ? EASING_FUNCTIONS[arguments[0].easing]
      : DEFAULT_EASING_FUNCTION
  );
};
