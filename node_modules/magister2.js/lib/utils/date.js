'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseDate = parseDate;
exports.date = date;
exports.urlDateConvert = urlDateConvert;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Tries to parse `val` to a date, if it fails this function will return
 * `undefined` instead of an invalid date.
 *
 * @param {any} val
 * @return {Date|undefined}
 */
function parseDate(val) {
  var n = Date.parse(val);
  if (!isNaN(n)) {
    return new Date(n);
  }
}

/**
 * @param {Date} date
 * @return {Date}
 */
function date(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * @param {Date} date
 * @return {String}
 */
function urlDateConvert(date) {
  return (0, _moment2.default)(date).format('Y-MM-DD');
}