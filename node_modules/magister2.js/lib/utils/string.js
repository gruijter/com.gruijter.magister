"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toString = toString;
/**
 * Returns the value as a string, or the value itself if it's `undefined` or
 * `null`.
 * @param {any} val
 * @return {String|undefined|null}
 */
function toString(val) {
  if (val == null) {
    return val;
  } else {
    return val.toString();
  }
}