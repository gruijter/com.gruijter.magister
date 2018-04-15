'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _util = require('./util');

/**
 * @private
 */
class VersionInfo {
	/**
  * @param {Object} raw
  */
	constructor(raw) {
		/**
   * @type String
   * @readonly
   */
		this.core = raw.CoreVersie;
		/**
   * @type String
   * @readonly
   */
		this.api = raw.ApiVersie;
		/**
   * @type String
   * @readonly
   */
		this.db = raw.DatabaseVersie;
		/**
   * @type String
   * @readonly
   */
		this.product = raw.ProductVersie;
		/**
   * @type Date
   * @readonly
   */
		this.releasedOn = (0, _util.parseDate)(raw.ReleaseDatum);
	}
}

exports.default = VersionInfo;